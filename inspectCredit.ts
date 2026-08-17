import { CLICK_BASE_URL } from "./config.js";
import { createClickContext } from "./browser.js";

const {context,close}=await createClickContext();
try{
  const page=await context.newPage();
  await page.goto(CLICK_BASE_URL,{waitUntil:"domcontentloaded",timeout:60000});
  console.log("Navegue manualmente até a tela de pagamento/crediário.");
  console.log("Você tem 90 segundos.");
  await page.waitForTimeout(90000);

  console.log("\nURL:",page.url());
  const texts=await page.locator("button, label, [role=button], input").evaluateAll(els=>els.slice(0,150).map((el:any)=>({
    tag:el.tagName,
    text:(el.textContent||"").trim().slice(0,120),
    id:el.getAttribute("id"),
    name:el.getAttribute("name"),
    placeholder:el.getAttribute("placeholder"),
    ariaLabel:el.getAttribute("aria-label"),
    type:el.getAttribute("type")
  })));
  console.dir(texts,{depth:null});
}finally{await close();}
