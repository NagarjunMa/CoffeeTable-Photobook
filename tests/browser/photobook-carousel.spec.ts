import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { collections } from "../../src/data/collections";

test("the selected photograph starts centered and expands while its neighbours stay clipped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#work");
  await expect(page.locator(".photobook-carousel")).toHaveAttribute("data-enhanced", "true");
  const selected = page.locator('.photobook-card[data-selected]');
  await expect.poll(() => selected.evaluate(el => {
    const card = el.getBoundingClientRect();
    const viewport = el.closest('.photobook-carousel')!.getBoundingClientRect();
    return Math.abs(card.left + card.width / 2 - (viewport.left + viewport.width / 2));
  })).toBeLessThan(2);
  await expect(selected.locator('.skiper-image-window')).toHaveCSS('clip-path', /inset\(0%/);
  await expect(selected.locator('img')).toHaveCSS('object-fit', 'contain');
  await page.getByRole('button', {name:'Next photobook', exact:true}).click();
  await expect(page.locator('.photobook-selection h3')).toHaveText('Maine');
  await expect(page.locator('.photobook-card[data-selected] .skiper-image-window')).toHaveCSS('clip-path', /inset\(0%/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test("drag and trackpad browse without accidentally opening a photobook", async ({ page }) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/#work');
  await expect(page.locator('.photobook-carousel')).toHaveAttribute('data-enhanced','true');
  const viewport=page.locator('.photobook-carousel-viewport');
  const box=(await viewport.boundingBox())!;
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x-400,y,{steps:12});
  await page.mouse.up();
  await expect(page.locator('.photobook-selection h3')).not.toHaveText('Hampi');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const previous=await page.locator('.photobook-selection h3').innerText();
  await page.mouse.move(x,y);
  await page.mouse.wheel(350,0);
  await expect(page.locator('.photobook-selection h3')).not.toHaveText(previous);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const before=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(0,-350);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(before-50);
});

test("a photograph opens the correct story and Escape restores its focus", async ({page})=>{
  await page.goto('/#work');
  const opener=page.getByRole('link',{name:'Preview Hampi photobook',exact:true});
  await opener.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog.getByRole('heading',{name:'Hampi',exact:true})).toBeVisible();
  await expect(dialog.locator('.book-detail-photo img')).toHaveCSS('object-fit','contain');
  await expect(dialog.getByRole('link',{name:'Open Hampi collection'})).toHaveAttribute('href','/series/hampi');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});

test("card keyboard browsing transfers focus before activation", async ({page})=>{
  await page.goto('/#work');
  const cardLink=(name:string)=>page.getByRole('link',{name:`Preview ${name} photobook`,exact:true});
  await cardLink('Hampi').focus();
  await page.keyboard.press('ArrowRight');
  await expect(cardLink('Maine')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading',{name:'Maine',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cardLink('Maine')).toBeFocused();
  await page.keyboard.press('End');
  await expect(cardLink('Bhutan')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading',{name:'Bhutan',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cardLink('Bhutan')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(cardLink('Hampi')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading',{name:'Hampi',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cardLink('Hampi')).toBeFocused();
});

test("contents keyboard navigation and rapid arrows retain the requested destination", async ({page})=>{
  await page.goto('/#work');
  const contents=page.getByRole('navigation',{name:'Destination contents'});
  await contents.getByRole('link',{name:'Hampi',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(contents.getByRole('link',{name:'Maine',exact:true})).toBeFocused();
  await page.keyboard.press('End');
  await expect(contents.getByRole('link',{name:'Bhutan',exact:true})).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('.photobook-selection h3')).toHaveText('Hampi');
  const next=page.getByRole('button',{name:'Next photobook',exact:true});
  await next.click();
  await next.click();
  await expect(page.locator('.photobook-selection h3')).toHaveText('New York');
  await page.getByRole('button',{name:'Preview New York photobook'}).click();
  await expect(page.getByRole('dialog').getByRole('heading',{name:'New York',exact:true})).toBeVisible();
});

for (const width of [390,1440]) {
  test(`every destination opens its own photo-and-story preview at ${width}px`,async ({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/#work');
    const contents=page.getByRole('navigation',{name:'Destination contents'});
    for (const collection of collections) {
      const opener=contents.getByRole('link',{name:collection.title,exact:true});
      await opener.click();
      const dialog=page.getByRole('dialog');
      await expect(dialog.getByRole('heading',{name:collection.title,exact:true})).toBeVisible();
      await expect(dialog.getByRole('link',{name:`Open ${collection.title} collection`})).toHaveAttribute('href',`/series/${collection.slug}`);
      if(collection.experience) await expect(dialog.locator('.book-story-preview')).toContainText(collection.experience.paragraphs[0]);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test('history restores the matching photobook preview',async ({page})=>{
  await page.goto('/#work');
  const contents=page.getByRole('navigation',{name:'Destination contents'});
  await contents.getByRole('link',{name:'Hampi',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('heading',{name:'Hampi',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('dialog').getByRole('heading',{name:'Hampi',exact:true})).toBeVisible();
});

test('without JavaScript every photograph remains a real gallery link',async ({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:3100/#work');
  const links=page.locator('.photobook-card-link');
  await expect(links).toHaveCount(collections.length);
  for (let i=0;i<collections.length;i++) await expect(links.nth(i)).toHaveAttribute('href',`/series/${collections[i].slug}`);
  await links.first().click();
  await expect(page).toHaveURL(/\/series\/hampi$/);
  await context.close();
});

test('reduced motion, a narrow screen, and a short window retain accessible previews',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const viewport of [{width:320,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    await page.goto('/#city-tigers');
    const dialog=page.getByRole('dialog');
    await expect(dialog.getByRole('heading',{name:'Tigers',exact:true})).toBeVisible();
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    const open=dialog.getByRole('link',{name:'Open Tigers collection'});
    await open.scrollIntoViewIfNeeded();
    await expect(open).toBeInViewport();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('a reduced-motion change during opening keeps the preview usable',async ({page})=>{
  await page.goto('/#work');
  const opener=page.getByRole('button',{name:'Preview Hampi photobook'});
  await opener.click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.getByRole('dialog').getByRole('link',{name:'Open Hampi collection'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});
