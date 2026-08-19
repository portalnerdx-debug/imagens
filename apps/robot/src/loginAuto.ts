import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium,type APIResponse,type Page} from "playwright";
import {AUTH_DIR,AUTH_FILE,CLICK_BASE_URL,CLICK_CHROMIUM_ARGS,CLICK_HEADLESS,CLICK_PASSWORD,CLICK_USERNAME,requireClickCredentials} from "./config.js";

async function firstVisible(page:Page,selectors:string[]){
 for(const selector of selectors){
  const loc=page.locator(selector).first();
  if(await loc.isVisible({timeout:900}).catch(()=>false))return loc;
 }
 return null;
}

async function authenticatedClickPage(page:Page){
 const selectors=[
  "#UserInfo",
  ".loginSaudacao",
  'a[href*="loj_logoff_catalogo.php"]',
  'a[href*="limpa_login_final.php"]',
  'a[href*="dados-vendedor.php"]'
 ];
 for(const selector of selectors){
  if(await page.locator(selector).first().isVisible({timeout:700}).catch(()=>false))return true;
 }
 const html=await page.content().catch(()=>"");
 const protectedCart=/\/checkout_catalogo\/carrinho\.php/i.test(page.url())
  &&await page.locator("#CarrinhoNumItens, .link-excluir, .carrinho").count()>0;
 return protectedCart||/loj_logoff_catalogo\.php|limpa_login_final\.php|dados-vendedor\.php/i.test(html);
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

 // A tela atual envia o login por AJAX e o botão se chama apenas "OK".
 // Aguardar a resposta real evita validar a sessão antes de o AJAX terminar.
 let response:APIResponse;
 try{
  response=await page.request.post(new URL("/login_vendedor_novo.php",CLICK_BASE_URL).toString(),{
   form:{model:"",nm_login:CLICK_USERNAME,nm_senha:CLICK_PASSWORD},
   timeout:60000
  });
 }catch{
  throw new Error("CLICK_LOGIN_FAILED");
 }
 if(!response.ok())throw new Error("CLICK_LOGIN_FAILED");

 const raw=await response.text();
 let code:string;
 try{
  const parsed=JSON.parse(raw) as {codigo?:unknown};
  code=String(parsed.codigo??"");
 }catch{
  throw new Error("CLICK_LOGIN_FAILED");
 }
 if(code!=="0"&&code!=="101"){
  if(["2","91","102"].includes(code))throw new Error("CLICK_INTERACTIVE_CHALLENGE_REQUIRED");
  throw new Error("CLICK_LOGIN_FAILED");
 }

 // Confirmamos a sessão em uma rota protegida. A página inicial pode continuar
 // exibindo o formulário mesmo depois de o AJAX ter criado o cookie válido.
 const protectedUrl=new URL("/checkout_catalogo/carrinho.php",CLICK_BASE_URL).toString();
 await page.goto(protectedUrl,{waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});

 // We never attempt to bypass CAPTCHA/MFA.
 const challenge=page.getByText(/captcha|código de verificação|autenticação em duas etapas|2fa|mfa/i).first();
 if(await challenge.isVisible({timeout:700}).catch(()=>false)){
  throw new Error("CLICK_INTERACTIVE_CHALLENGE_REQUIRED");
 }
 if(!await authenticatedClickPage(page))throw new Error("CLICK_LOGIN_FAILED");
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
