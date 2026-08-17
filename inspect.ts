import { CLICK_BASE_URL } from "./config.js";
import { createClickContext } from "./browser.js";

const { context, close } = await createClickContext();
try {
  const page = await context.newPage();
  await page.goto(CLICK_BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("URL:", page.url());
  console.log("TÍTULO:", await page.title());

  const inputs = await page.locator("input").evaluateAll(els => els.slice(0,50).map(el => ({
    type: el.getAttribute("type"),
    id: el.getAttribute("id"),
    name: el.getAttribute("name"),
    placeholder: el.getAttribute("placeholder"),
    ariaLabel: el.getAttribute("aria-label")
  })));
  console.log("\nINPUTS:");
  console.dir(inputs, {depth:null});

  const buttons = await page.locator("button").evaluateAll(els => els.slice(0,50).map(el => ({
    text:(el.textContent||"").trim(),
    title:el.getAttribute("title"),
    ariaLabel:el.getAttribute("aria-label")
  })));
  console.log("\nBOTÕES:");
  console.dir(buttons, {depth:null});

  console.log("\nJanela aberta por 60 segundos para inspeção.");
  await page.waitForTimeout(60000);
} finally {
  await close();
}
