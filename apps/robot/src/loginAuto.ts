import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium,type Frame,type Locator,type Page} from "playwright";
import {AUTH_DIR,AUTH_FILE,CLICK_BASE_URL,CLICK_CHROMIUM_ARGS,CLICK_HEADLESS,CLICK_PASSWORD,CLICK_USERNAME,requireClickCredentials} from "./config.js";

type LoginRoot=Page|Frame;

function loginRoots(page:Page):LoginRoot[]{
 return [page,...page.frames().filter(frame=>frame!==page.mainFrame())];
}

async function firstVisible(
 page:Page,selectors:string[],timeout=12000,preferredRoot?:LoginRoot
):Promise<{root:LoginRoot;locator:Locator}|null>{
 const deadline=Date.now()+timeout;
 do{
  const roots=preferredRoot?[preferredRoot]:loginRoots(page);
  for(const root of roots){
   for(const selector of selectors){
    const loc=root.locator(selector).first();
    if(await loc.isVisible({timeout:150}).catch(()=>false))return {root,locator:loc};
   }
  }
  await page.waitForTimeout(250);
 }while(Date.now()<deadline);
 return null;
}

async function visibleLoginPassword(page:Page,timeout=500){
 return firstVisible(page,[
  'input[type="password"]','input[name*="senha" i]','input[id*="senha" i]',
  'input[placeholder*="senha" i]'
 ],timeout);
}

async function hasAuthenticatedMarker(page:Page){
 return Boolean(await firstVisible(page,[
  'a[href*="logout" i]','a[href*="sair" i]','button[name*="logout" i]',
  '[data-action*="logout" i]'
 ],1200));
}

async function openLoginForm(page:Page){
 const trigger=await firstVisible(page,[
  'a[href*="login" i]','button:has-text("Entrar")','a:has-text("Entrar")',
  'button:has-text("Acessar")','a:has-text("Acessar")'
 ],1800);
 if(!trigger)return false;
 await trigger.locator.click().catch(()=>{});
 await page.waitForLoadState("domcontentloaded").catch(()=>{});
 await page.waitForTimeout(500);
 return true;
}

async function waitForLoginCompletion(page:Page,timeout=20000){
 const deadline=Date.now()+timeout;
 do{
  if(!await visibleLoginPassword(page,350))return true;
  await page.waitForTimeout(350);
 }while(Date.now()<deadline);
 return false;
}

async function hasInteractiveChallenge(page:Page){
 for(const root of loginRoots(page)){
  const challenge=root.getByText(/captcha|c[oó]digo de verifica[cç][aã]o|autentica[cç][aã]o em duas etapas|2fa|mfa/i).first();
  if(await challenge.isVisible({timeout:250}).catch(()=>false))return true;
 }
 return false;
}

export async function performAutomaticLogin(page:Page){
 requireClickCredentials();

 let pass=await visibleLoginPassword(page,12000);
 if(!pass&&await hasAuthenticatedMarker(page))return {alreadyAuthenticated:true};
 if(!pass){
  await openLoginForm(page);
  pass=await visibleLoginPassword(page,12000);
 }
 if(!pass){
  // Uma página incompleta/indisponível não deve ser salva como sessão válida.
  throw new Error("CLICK_LOGIN_FAILED");
 }

 const user=await firstVisible(page,[
  'input[type="email"]','input[name*="email" i]','input[name*="login" i]',
  'input[name*="user" i]','input[id*="user" i]','input[autocomplete="username"]',
  'input[id*="email" i]','input[id*="login" i]','input[placeholder*="email" i]',
  'input[placeholder*="usuário" i]','input[placeholder*="usuario" i]',
  'input[type="text"]'
 ],12000,pass.root);

 if(!user)throw new Error("CLICK_LOGIN_FAILED");

 await user.locator.fill(CLICK_USERNAME);
 await pass.locator.fill(CLICK_PASSWORD);

 const button=pass.root.getByRole("button",{name:/entrar|login|acessar/i}).first();
 if(await button.isVisible({timeout:1200}).catch(()=>false))await button.click();
 else{
  const submit=pass.root.locator('button[type="submit"],input[type="submit"]').first();
  if(await submit.isVisible({timeout:800}).catch(()=>false))await submit.click();
  else await pass.locator.press("Enter");
 }

 await page.waitForLoadState("domcontentloaded").catch(()=>{});
 await page.waitForTimeout(500);

 // We never attempt to bypass CAPTCHA/MFA.
 if(await hasInteractiveChallenge(page)){
  throw new Error("CLICK_INTERACTIVE_CHALLENGE_REQUIRED");
 }
 const loginCompleted=await waitForLoginCompletion(page,20000);
 if(await hasInteractiveChallenge(page)){
  throw new Error("CLICK_INTERACTIVE_CHALLENGE_REQUIRED");
 }
 if(!loginCompleted){
  console.warn("[robot:login] formulário de senha continuou visível após o envio",{
   location:(()=>{try{const url=new URL(page.url());return `${url.origin}${url.pathname}`}catch{return "unknown"}})()
  });
  throw new Error("CLICK_LOGIN_FAILED");
 }
 return {alreadyAuthenticated:false};
}

export async function createFreshAuthenticatedState(){
 fs.mkdirSync(AUTH_DIR,{recursive:true});
 const temporaryAuthFile=`${AUTH_FILE}.${process.pid}.${Date.now()}.tmp`;
 const browser=await chromium.launch({headless:CLICK_HEADLESS,args:CLICK_CHROMIUM_ARGS});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 try{
  const page=await context.newPage();
  await page.goto(CLICK_BASE_URL,{waitUntil:"domcontentloaded",timeout:60000});
  await performAutomaticLogin(page);
  if(await visibleLoginPassword(page,1000))throw new Error("CLICK_LOGIN_FAILED");
  await context.storageState({path:temporaryAuthFile});
  fs.renameSync(temporaryAuthFile,AUTH_FILE);
 }finally{
  await browser.close();
  if(fs.existsSync(temporaryAuthFile))fs.rmSync(temporaryAuthFile,{force:true});
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
