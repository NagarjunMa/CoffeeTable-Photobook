/**
 * Photographic adaptation of ThreeUI's MIT-licensed Bookshelf (Meng To, 2026).
 * The wrapped shelf layout, damped selection and hinged-cover behavior follow
 * https://github.com/MengTo/threeui/tree/main/src/shaders/bookshelf.
 * The portfolio owns its textures, DOM controls, navigation and detail cards.
 * See THIRD_PARTY_NOTICES.md for the upstream license.
 */
import * as THREE from "three";

export type ShelfVolume = { title: string; color: string; image?: string; count: string };
export type BookOrigin = { left: number; top: number; width: number; height: number };
export type ShelfRenderer = {
  select: (index: number) => void;
  inspect: (open: boolean) => void;
  bounds: (index: number) => BookOrigin | undefined;
  resize: () => void;
  dispose: () => void;
};

type Rig = {
  root: THREE.Group;
  hinge: THREE.Group;
};

const wrap = (value: number, length: number) => ((value % length) + length) % length;

export function createBookshelfRenderer(
  canvas: HTMLCanvasElement,
  volumes: ShelfVolume[],
  callbacks: { onSelect: (index: number) => void; onOpen: (index: number) => void; onError: () => void },
  initialIndex: number,
  fonts: { display: string; mono: string },
): ShelfRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  const resources = new Set<THREE.Texture>();
  const images: HTMLImageElement[] = [];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches;
  let disposed = false;
  let visible = true;
  let frameId = 0;
  let lastTime = 0;
  let settleUntil = 0;
  let target = initialIndex;
  let position = initialIndex;
  let velocity = 0;
  let selected = initialIndex;
  let hovered = -1;
  let inspecting = false;
  let inspection = 0;
  let drag: { id: number; x: number; y: number; start: number; moved: boolean; lastX: number; time: number; velocity: number } | null = null;
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  const pointer = new THREE.Vector2();
  const ray = new THREE.Raycaster();

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x624b37, 2.6));
  const light = new THREE.DirectionalLight(0xffefd9, 3.4);
  light.position.set(-3, 6, 7);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -7;
  light.shadow.camera.right = 7;
  light.shadow.camera.top = 5;
  light.shadow.camera.bottom = -3;
  light.shadow.bias = -0.001;
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xdce5ec, 1.4);
  fill.position.set(5, 3, -1);
  scene.add(fill);

  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.1, 2.2),
    new THREE.MeshStandardMaterial({ color: "#78634d", roughness: 0.85 }),
  );
  shelf.position.set(0, -0.09, -0.08);
  shelf.receiveShadow = true;
  scene.add(shelf);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.15;
  shadow.receiveShadow = true;
  scene.add(shadow);

  function requestFrame() {
    if (!disposed && visible && !frameId) frameId = requestAnimationFrame(frame);
  }

  function wake() {
    settleUntil = performance.now() + 1400;
    requestFrame();
  }

  function coverTexture(volume: ShelfVolume, index: number) {
    const surface = document.createElement("canvas");
    surface.width = 768;
    surface.height = 1024;
    const ctx = surface.getContext("2d")!;
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    resources.add(texture);
    const paint = (image?: HTMLImageElement) => {
      ctx.fillStyle = volume.color;
      ctx.fillRect(0, 0, 768, 1024);
      // A woven binding, generated locally rather than a downloaded texture.
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      for (let x = 0; x < 768; x += 3) ctx.fillRect(x, 0, 1, 1024);
      ctx.fillStyle = "rgba(0,0,0,0.045)";
      for (let y = 0; y < 1024; y += 3) ctx.fillRect(0, y, 768, 1);
      const edge = ctx.createLinearGradient(0, 0, 60, 0);
      edge.addColorStop(0, "rgba(0,0,0,0.28)");
      edge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, 60, 1024);
      ctx.fillStyle = "#eee5cd";
      ctx.textAlign = "center";
      ctx.font = `400 18px ${fonts.mono}`;
      ctx.fillText("NAGARJUN MALLESH", 390, 78);
      ctx.font = `500 ${volume.title.length > 12 ? 68 : 84}px ${fonts.display}`;
      ctx.fillText(volume.title, 390, 196, 650);
      ctx.fillStyle = "#e9e2d5";
      ctx.fillRect(92, 270, 596, 526);
      if (image) {
        const ratio = Math.min(556 / image.naturalWidth, 486 / image.naturalHeight);
        const width = image.naturalWidth * ratio;
        const height = image.naturalHeight * ratio;
        ctx.drawImage(image, 112 + (556 - width) / 2, 290 + (486 - height) / 2, width, height);
      } else {
        ctx.fillStyle = volume.color;
        ctx.font = `400 48px ${fonts.display}`;
        ctx.fillText(volume.title, 390, 540, 500);
      }
      ctx.fillStyle = "#eee5cd";
      ctx.font = `400 19px ${fonts.mono}`;
      ctx.fillText(volume.count, 390, 889);
      ctx.font = `400 16px ${fonts.mono}`;
      ctx.fillText(`PHOTOGRAPHIC VOLUME ${String(index + 1).padStart(2, "0")}`, 390, 950);
      texture.needsUpdate = true;
      wake();
    };
    paint();
    if (volume.image) {
      const image = new Image();
      images.push(image);
      image.crossOrigin = "anonymous";
      image.onload = () => { if (!disposed) paint(image); };
      image.src = volume.image;
    }
    return texture;
  }

  const width = 1.48, height = 2.04, depth = 0.18, spacing = 1.76;
  const rigs: Rig[] = volumes.map((volume, index) => {
    const root = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: volume.color, roughness: 0.87 });
    const paper = new THREE.MeshStandardMaterial({ color: "#ece5d6", roughness: 1 });
    const art = new THREE.MeshStandardMaterial({ map: coverTexture(volume, index), roughness: 0.84 });
    const pages = new THREE.Mesh(new THREE.BoxGeometry(width - 0.07, height - 0.06, depth), paper);
    root.add(pages);
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.035), cloth);
    back.position.z = -depth / 2 - 0.022;
    root.add(back);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.055, height, depth + 0.07), cloth);
    spine.position.x = -width / 2 + 0.02;
    root.add(spine);
    const hinge = new THREE.Group();
    hinge.position.set(-width / 2, 0, depth / 2 + 0.022);
    const front = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.035), [cloth, cloth, cloth, cloth, art, cloth]);
    front.position.x = width / 2;
    hinge.add(front);
    root.add(hinge);
    for (let line = 0; line < 7; line++) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(width - 0.07, 0.002, 0.001), cloth);
      edge.position.set(0.02, -height / 2 + 0.04 + line * (height - 0.08) / 6, depth / 2 + 0.001);
      edge.material = paper;
      root.add(edge);
    }
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.userData.bookIndex = index;
      }
    });
    root.position.set((index - initialIndex) * spacing, height / 2, 0);
    scene.add(root);
    return { root, hinge };
  });

  function select(index: number) {
    clearTimeout(wheelTimer);
    wheelTimer = undefined;
    const base = Math.round(position);
    let distance = index - wrap(base, volumes.length);
    distance -= Math.round(distance / volumes.length) * volumes.length;
    target = base + distance;
    selected = wrap(index, volumes.length);
    callbacks.onSelect(selected);
    wake();
  }

  function hit(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(rigs.filter(rig => rig.root.visible).map((rig) => rig.root), true);
    return hits.length ? hits[0].object.userData.bookIndex as number : -1;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || !event.isPrimary || inspecting) return;
    clearTimeout(wheelTimer);
    wheelTimer = undefined;
    // Grab the presentation position, including during an unfinished settle.
    target = position;
    velocity = 0;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position, moved: false, lastX: event.clientX, time: event.timeStamp, velocity: 0 };
  }

  function pixelsPerBook() {
    const left = new THREE.Vector3(0, height / 2, 0).project(camera);
    const right = new THREE.Vector3(spacing, height / 2, 0).project(camera);
    return Math.max(1, (right.x - left.x) * canvas.clientWidth / 2);
  }

  function onPointerMove(event: PointerEvent) {
    if (drag && event.pointerId === drag.id) {
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      if (!drag.moved && Math.abs(deltaY) > 10 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        drag = null;
        target = Math.round(position);
        wake();
        return;
      }
      if (!drag.moved && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        drag.moved = true;
        canvas.setPointerCapture(event.pointerId);
      }
      if (drag.moved) {
        const elapsed = event.timeStamp - drag.time;
        if (elapsed > 0) drag.velocity = -(event.clientX - drag.lastX) / pixelsPerBook() / (elapsed / 1000);
        drag.lastX = event.clientX;
        drag.time = event.timeStamp;
        target = drag.start - deltaX / pixelsPerBook();
        position = target;
        canvas.style.cursor = "grabbing";
        wake();
      }
    } else {
      hovered = hit(event);
      canvas.style.cursor = hovered >= 0 ? "pointer" : "grab";
      wake();
    }
  }

  function onPointerEnd(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return;
    const gesture = drag;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (gesture.moved) {
      velocity = event.type !== "pointerup" || event.timeStamp - gesture.time > 100 ? 0 : THREE.MathUtils.clamp(gesture.velocity, -10, 10);
      target = Math.round(position + THREE.MathUtils.clamp(velocity * 0.18, -1.5, 1.5));
      selected = wrap(target, volumes.length);
      callbacks.onSelect(selected);
    }
    else if (event.type === "pointerup" && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 10) {
      const index = hit(event);
      if (index >= 0) { select(index); callbacks.onOpen(index); }
      else {
        target = Math.round(position);
        selected = wrap(target, volumes.length);
        callbacks.onSelect(selected);
      }
    }
    else target = Math.round(position);
    canvas.style.cursor = hovered >= 0 ? "pointer" : "grab";
    wake();
  }

  function onWheel(event: WheelEvent) {
    // Native vertical scrolling remains available, including diagonal gestures.
    if (inspecting || drag || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || event.ctrlKey) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientWidth : 1;
    position += event.deltaX * unit / pixelsPerBook();
    target = position;
    velocity = 0;
    selected = wrap(Math.round(position), volumes.length);
    callbacks.onSelect(selected);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelTimer = undefined;
      target = Math.round(position);
      wake();
    }, 120);
    wake();
  }

  function bounds(index: number): BookOrigin | undefined {
    const rig = rigs[index];
    if (!rig?.root.visible) return;
    rig.root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(rig.root);
    const points = [
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ].map(point => point.project(camera));
    const rect = canvas.getBoundingClientRect();
    const left = Math.min(...points.map(point => point.x));
    const right = Math.max(...points.map(point => point.x));
    const top = Math.max(...points.map(point => point.y));
    const bottom = Math.min(...points.map(point => point.y));
    return { left: rect.left + (left + 1) * rect.width / 2, top: rect.top + (1 - top) * rect.height / 2, width: (right - left) * rect.width / 2, height: (top - bottom) * rect.height / 2 };
  }

  function onPointerLeave() {
    hovered = -1;
    // Before the intent threshold we have no capture, so an outside release
    // cannot reach us. Abandon that pending tap instead of keeping a ghost drag.
    if (drag && !drag.moved) {
      drag = null;
      target = Math.round(position);
      selected = wrap(target, volumes.length);
      callbacks.onSelect(selected);
    }
    wake();
  }
  function onContextLost(event: Event) { event.preventDefault(); callbacks.onError(); }
  function onMotion() { reduced = motion.matches; wake(); }

  function frame(time: number) {
    frameId = 0;
    if (disposed || !visible) return;
    const delta = Math.min((time - (lastTime || time - 16)) / 1000, 0.05);
    lastTime = time;
    if (reduced) { position = target; velocity = 0; }
    else if (!drag && !wheelTimer) {
      // Analytic critically damped spring; preserves velocity when retargeted.
      const omega = 15;
      const displacement = position - target;
      const carry = velocity + omega * displacement;
      const decay = Math.exp(-omega * delta);
      position = target + (displacement + carry * delta) * decay;
      velocity = (velocity - omega * carry * delta) * decay;
    }
    const nearest = wrap(Math.round(position), volumes.length);
    // Animated interpolation must not replace a button/keyboard request with
    // an intermediate book. Only a live drag derives selection from position.
    if (drag?.moved && nearest !== selected) { selected = nearest; callbacks.onSelect(selected); }
    inspection = reduced ? Number(inspecting) : THREE.MathUtils.damp(inspection, Number(inspecting), 10, delta);
    rigs.forEach((rig, index) => {
      let offset = index - position;
      offset -= Math.round(offset / volumes.length) * volumes.length;
      const distance = Math.abs(offset);
      const lift = index === selected ? inspection : 0;
      const speed = reduced ? 1000 : 12;
      rig.root.position.x = offset * spacing;
      rig.root.position.y = height / 2 + lift * 0.12;
      rig.root.position.z = THREE.MathUtils.damp(rig.root.position.z, lift * 0.2 + (hovered === index ? 0.08 : 0), speed, delta);
      rig.root.rotation.y = -0.08;
      rig.root.rotation.z = 0;
      rig.hinge.rotation.y = THREE.MathUtils.damp(rig.hinge.rotation.y, !reduced && hovered === index ? -0.12 : 0, speed, delta);
      rig.root.visible = distance < 3.4;
    });
    renderer.render(scene, camera);
    if (time < settleUntil || drag || wheelTimer || Math.abs(position - target) > 0.001 || Math.abs(velocity) > 0.001) requestFrame();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const aspect = Math.max(bounds.width, 1) / Math.max(bounds.height, 1);
    camera.aspect = aspect;
    camera.position.set(0, 2.3, aspect < 1.2 ? 5.8 : 6.8);
    camera.lookAt(0, 1, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height, false);
    wake();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);
  canvas.addEventListener("lostpointercapture", onPointerEnd);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("webglcontextlost", onContextLost);
  motion.addEventListener("change", onMotion);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); });
  observer.observe(canvas);
  resize();
  return {
    select,
    bounds,
    inspect(open) { inspecting = open; wake(); },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(wheelTimer);
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("lostpointercapture", onPointerEnd);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      images.forEach((image) => { image.onload = null; image.removeAttribute("src"); });
      resources.forEach((texture) => texture.dispose());
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
        }
      });
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    },
  };
}
