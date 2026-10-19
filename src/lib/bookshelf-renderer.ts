/**
 * Photographic adaptation of ThreeUI's MIT-licensed Bookshelf (Meng To, 2026).
 * The wrapped shelf layout, damped selection and hinged-cover behavior follow
 * https://github.com/MengTo/threeui/tree/main/src/shaders/bookshelf.
 * The portfolio owns its textures, DOM controls, navigation and detail cards.
 * See THIRD_PARTY_NOTICES.md for the upstream license.
 */
import * as THREE from "three";

export type ShelfVolume = { title: string; color: string; image?: string; count: string };
export type ShelfRenderer = {
  select: (index: number) => void;
  inspect: (open: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

type Rig = {
  root: THREE.Group;
  hinge: THREE.Group;
  lastOffset: number;
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
  let selected = initialIndex;
  let hovered = -1;
  let inspecting = false;
  let inspection = 0;
  let drag: { id: number; x: number; y: number; start: number; moved: boolean } | null = null;
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

  const width = 1.48, height = 2.04, depth = 0.18;
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
    root.position.set((index - initialIndex) * 1.92, height / 2, 0);
    scene.add(root);
    return { root, hinge, lastOffset: index - initialIndex };
  });

  function select(index: number) {
    let distance = index - wrap(Math.round(target), volumes.length);
    distance -= Math.round(distance / volumes.length) * volumes.length;
    target += distance;
    selected = wrap(index, volumes.length);
    callbacks.onSelect(selected);
    wake();
  }

  function hit(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(rigs.map((rig) => rig.root), true);
    return hits.length ? hits[0].object.userData.bookIndex as number : -1;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || inspecting) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: target, moved: false };
  }

  function onPointerMove(event: PointerEvent) {
    if (drag && event.pointerId === drag.id) {
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      if (!drag.moved && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        drag.moved = true;
        canvas.setPointerCapture(event.pointerId);
      }
      if (drag.moved) {
        target = drag.start - deltaX / Math.min(canvas.clientWidth * 0.45, 245);
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
      target = Math.round(target);
      selected = wrap(target, volumes.length);
      callbacks.onSelect(selected);
    }
    else if (event.type === "pointerup" && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 10) {
      const index = hit(event);
      if (index >= 0) { select(index); callbacks.onOpen(index); }
    }
    wake();
  }

  function onPointerLeave() { hovered = -1; wake(); }
  function onContextLost(event: Event) { event.preventDefault(); callbacks.onError(); }
  function onMotion() { reduced = motion.matches; wake(); }

  function frame(time: number) {
    frameId = 0;
    if (disposed || !visible) return;
    const delta = Math.min((time - (lastTime || time - 16)) / 1000, 0.05);
    lastTime = time;
    position = reduced ? target : THREE.MathUtils.damp(position, target, 9.5, delta);
    const nearest = wrap(Math.round(position), volumes.length);
    // Animated interpolation must not replace a button/keyboard request with
    // an intermediate book. Only a live drag derives selection from position.
    if (drag?.moved && nearest !== selected) { selected = nearest; callbacks.onSelect(selected); }
    inspection = reduced ? Number(inspecting) : THREE.MathUtils.damp(inspection, Number(inspecting), 10, delta);
    rigs.forEach((rig, index) => {
      let offset = index - position;
      offset -= Math.round(offset / volumes.length) * volumes.length;
      const distance = Math.abs(offset);
      const focus = 1 - THREE.MathUtils.clamp(distance, 0, 1);
      const lift = index === selected ? inspection : 0;
      const speed = reduced ? 1000 : 12;
      if (Math.abs(offset - rig.lastOffset) > volumes.length * 0.5) rig.root.position.x = offset * 1.92;
      rig.lastOffset = offset;
      rig.root.position.x = THREE.MathUtils.damp(rig.root.position.x, offset * 1.92, speed, delta);
      rig.root.position.y = THREE.MathUtils.damp(rig.root.position.y, height / 2 + focus * 0.14 + lift * 0.2, speed, delta);
      rig.root.position.z = THREE.MathUtils.damp(rig.root.position.z, focus * 0.32 - Math.min(distance, 3) * 0.12 + lift * 0.7, speed, delta);
      rig.root.rotation.y = THREE.MathUtils.damp(rig.root.rotation.y, -offset * 0.17 - lift * 0.12, speed, delta);
      rig.root.rotation.z = THREE.MathUtils.damp(rig.root.rotation.z, -offset * 0.018, speed, delta);
      const scale = THREE.MathUtils.damp(rig.root.scale.x, 1 + focus * 0.075 + lift * 0.05, speed, delta);
      rig.root.scale.setScalar(scale);
      rig.hinge.rotation.y = THREE.MathUtils.damp(rig.hinge.rotation.y, !reduced && hovered === index ? -0.12 : 0, speed, delta);
      rig.root.visible = distance < 3.4;
    });
    renderer.render(scene, camera);
    if (time < settleUntil || drag) requestFrame();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const aspect = Math.max(bounds.width, 1) / Math.max(bounds.height, 1);
    camera.aspect = aspect;
    camera.position.set(0, 3.1, aspect < 1.2 ? 5.8 : 6.8);
    camera.lookAt(0, 0.95, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height, false);
    wake();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("webglcontextlost", onContextLost);
  motion.addEventListener("change", onMotion);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); });
  observer.observe(canvas);
  resize();
  return {
    select,
    inspect(open) { inspecting = open; wake(); },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("pointerleave", onPointerLeave);
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
