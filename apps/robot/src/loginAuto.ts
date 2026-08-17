import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium,type Page} from "playwright";
import {AUTH_DIR,AUTH_FILE,CLICK_BASE_URL,CLICK_HEADLESS,CLICK_PASSWORD,CLICK_USERNAME,requireClickCredentials} from "./config.js";

async function firstVisible(page:Page,selectors:string[]){
 for(const selector of selectors){
  const loc=page.locator(selector).first();
  if(await loc.isVisible({timeout:900}).catch(()=>false))return loc;
 }
 return null;
}

export async function performAutomaticLogin(page:Page){
 requireClickCredentials();

 const user=await firstVisible(page,[
  'input[type="email"]','input[name*="email" i]','input[name*="login" i]',
  'input[id*="email" i]','input[id*="login" i]','input[placeholder*="email" i]',
  'input[placeholder*="usuário" i]','input[placeholder*="usuario" i]'
 ]);
 const pass=await firstVisible(page,[
  'input[type="password"]','input[name*="senha" i]','input[id*="senha" i]',
  'input[placeholder*="senha" i]'
 ]);

 if(!user||!pass){
  // If the login form is absent, the session may already be authenticated.
  return {alreadyAuthenticated:true};
 }

 await user.fill(CLICK_USERNAME);
 await pass.fill(CLICK_PASSWORD);

 const button=page.getByRole("button",{name:/entrar|login|acessar/i}).first();
 if(await button.isVisible({timeout:1200}).catch(()=>false))await button.click();
 else await pass.press("Enter");

 await page.waitForLoadState("domcontentloaded").catch(()=>{});
 await page.waitForTimeout(1400);

 // We never attempt to bypass CAPTCHA/MFA.
 const challenge=page.getByText(/captcha|código de verificação|autenticação em duas etapas|2fa|mfa/i).first();
 if(await challenge.isVisible({timeout:700}).catch(()=>false)){
  throw new Error("CLICK_INTERACTIVE_CHALLENGE_REQUIRED");
 }
 return {alreadyAuthenticated:false};
}

export async function createFreshAuthenticatedState(){
 fs.mkdirSync(AUTH_DIR,{recursive:true});
 const browser=await chromium.launch({headless:CLICK_HEADLESS});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 try{
  const page=await context.newPage();
  await page.goto(CLICK_BASE_URL,{waitUntil:"domcontentloaded",timeout:60000});
  await performAutomaticLogin(page);
  await context.storageState({path:AUTH_FILE});
 }finally{
  await browser.close();
 }
}

function isExecutedDirectly(){
 const argvPath=process.argv[1];
 if(!argvPath)return false;
 try{
  return path.resolve(fileURLToPath(import.meta.url))===path.resolve(argvPath);
 }catch{
  return false;
 }
}

if(isExecutedDirectly()){
 createFreshAuthenticatedState()
  .then(()=>console.log("Sessão automática salva com sucesso."))
  .catch(e=>{
   console.error("[robot:login]",e instanceof Error?e.message:e);
   process.exit(1);
  });
}
