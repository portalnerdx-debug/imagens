import fs from "node:fs";
import {chromium} from "playwright";
import {AUTH_FILE,CLICK_CHROMIUM_ARGS,CLICK_HEADLESS} from "./config.js";
import {createFreshAuthenticatedState} from "./loginAuto.js";

async function ensureState(){
 if(!fs.existsSync(AUTH_FILE))await createFreshAuthenticatedState();
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

export async function refreshClickSession(){
 if(fs.existsSync(AUTH_FILE))fs.rmSync(AUTH_FILE,{force:true});
 await createFreshAuthenticatedState();
}
