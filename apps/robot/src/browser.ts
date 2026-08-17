import fs from "node:fs";
import {chromium,type Page} from "playwright";
import {AUTH_FILE,CLICK_BASE_URL,CLICK_CHROMIUM_ARGS,CLICK_HEADLESS} from "./config.js";
import {createFreshAuthenticatedState} from "./loginAuto.js";
import {runWithSessionRetry} from "./sessionRetry.js";

let refreshInProgress:Promise<void>|null=null;

export async function refreshClickSession(){
 if(refreshInProgress)return refreshInProgress;
 refreshInProgress=createFreshAuthenticatedState().finally(()=>{refreshInProgress=null});
 return refreshInProgress;
}

async function ensureState(){
 if(!fs.existsSync(AUTH_FILE))await refreshClickSession();
}

export async function createClickContext(){
  await ensureState();

  const browser=await chromium.launch({
    headless:CLICK_HEADLESS,
    args:CLICK_CHROMIUM_ARGS
  });

  const context=await browser.newContext({
    storageState: AUTH_FILE,
    viewport: { width: 1440, height: 1000 }
  });

  return {
    context,
    close: async () => {
      if (CLICK_HEADLESS) {
        await browser.close();
      }
    }
  };
}

export async function withAuthenticatedClickPage<T>(task:(page:Page)=>Promise<T>){
 return runWithSessionRetry(async()=>{
  const {context,close}=await createClickContext();
  try{
   const page=await context.newPage();
   await page.goto(CLICK_BASE_URL,{waitUntil:"domcontentloaded",timeout:60000});
   return await task(page);
  }finally{
   await close();
  }
 },async()=>{
  console.warn("[robot] Sessão da Plataforma Click expirada; renovando login automaticamente.");
  await refreshClickSession();
 });
}
