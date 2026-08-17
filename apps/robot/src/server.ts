import cors from "cors";
import express from "express";
import {ALLOWED_ORIGINS,CLICK_BASE_URL,PORT} from "./config.js";
import {createClickContext,refreshClickSession} from "./browser.js";
import {searchProduct} from "./productSearch.js";
import {simulateCredit} from "./creditSimulation.js";
import {verifyFirebaseBearer} from "./firebaseAuth.js";

const app=express();
app.disable("x-powered-by");
app.use(cors({
 origin(origin,callback){
  // Requisições sem Origin (curl, health checks, server-to-server) são permitidas.
  if(!origin)return callback(null,true);
  if(ALLOWED_ORIGINS.includes(origin))return callback(null,true);
  return callback(new Error("CORS_ORIGIN_NOT_ALLOWED"));
 },
 credentials:false
}));
app.use(express.json({limit:"64kb"}));

async function auth(req:any,res:any,next:any){
 try{
  req.user=await verifyFirebaseBearer(req.headers.authorization);
  next();
 }catch{
  res.status(401).json({error:"AUTH_REQUIRED"});
 }
}

function publicError(e:unknown){
 const m=e instanceof Error?e.message:"UNKNOWN";
 const known=new Set([
  "CLICK_CREDENTIALS_NOT_CONFIGURED","CLICK_INTERACTIVE_CHALLENGE_REQUIRED","CLICK_SESSION_EXPIRED",
  "PRODUCT_SEARCH_NOT_AVAILABLE","PRODUCT_NOT_FOUND","BUY_ACTION_NOT_FOUND","VOLTAGE_REQUIRED","VOLTAGE_OPTION_NOT_FOUND",
  "CPF_REQUIRED","CPF_FIELD_NOT_FOUND","CHECKOUT_ADVANCE_NOT_FOUND","CREDIT_OPTION_NOT_FOUND",
  "CREDIT_PLAN_NOT_FOUND","INSTALLMENTS_FIELD_NOT_FOUND","ENTRY_REQUIRED","ENTRY_FIELD_NOT_FOUND",
  "CT1_INSTALLMENTS_OUT_OF_RANGE","CREDIT_REQUEST_FAILED","CREDIT_RESULT_NOT_PARSED",
  "CT1_PRODUCT_PRICE_REQUIRED","CT1_CART_PREPARATION_FAILED","TRADITIONAL_PRODUCT_PRICE_REQUIRED","TRADITIONAL_CART_PREPARATION_FAILED",
  "CPF_SUBMIT_FAILED","WARRANTY_SERVICE_FAILED","CT2_INSTALLMENTS_OUT_OF_RANGE",
  "CT2_PAYMENT_SETUP_FAILED","CT2_VARIABLE_ENTRY_FAILED","CT2_PAYMENT_ID_NOT_FOUND","CT2_ENTRY_BELOW_MINIMUM",
  "48_INSTALLMENTS_OUT_OF_RANGE","48_PAYMENT_SETUP_FAILED","48_VARIABLE_ENTRY_FAILED",
  "48_PAYMENT_ID_NOT_FOUND","48_ENTRY_BELOW_MINIMUM","NEW_CUSTOMER_CART_CLEANUP_FAILED"
 ]);
 return known.has(m)?m:"AUTOMATION_FAILED";
}

app.get("/health",(_req,res)=>res.json({ok:true,service:"xvendas-playwright",mode:"browser-automation"}));

app.post("/api/session/refresh",auth,async(_req,res)=>{
 try{
  await refreshClickSession();
  res.json({ok:true});
 }catch(e){res.status(409).json({error:publicError(e)})}
});

app.get("/api/products/:code",auth,async(req,res)=>{
 const code=String(req.params.code||"").trim();
 if(!code)return res.status(400).json({error:"PRODUCT_CODE_REQUIRED"});
 try{
  const {context,close}=await createClickContext();
  try{
   const page=await context.newPage();
   await page.goto(CLICK_BASE_URL,{waitUntil:"domcontentloaded",timeout:60000});
   const result=await searchProduct(page,code);
   res.json(result);
  }finally{await close()}
 }catch(e){
  console.error(`[GET /api/products/${code}]`,e);
  res.status(500).json({error:publicError(e)});
 }
});

app.post("/api/credit/simulate",auth,async(req,res)=>{
 const body=req.body||{};
 const request={
  code:String(body.productCode||body.code||"").trim(),
  plan:String(body.plan||"").toUpperCase() as "48"|"CT1"|"CT2",
  installments:Number(body.installments),
  downPayment:body.entry!==undefined?Number(body.entry):body.downPayment!==undefined?Number(body.downPayment):undefined,
  cpf:body.cpf?String(body.cpf):undefined,
  voltage:body.voltage?String(body.voltage):undefined,
  warranty:Boolean(body.warranty)
 };
 try{
  const {context,close}=await createClickContext();
  try{
   const page=await context.newPage();
   await page.goto(CLICK_BASE_URL,{waitUntil:"domcontentloaded",timeout:60000});
   res.json(await simulateCredit(page,request));
  }finally{await close()}
 }catch(e){
  console.error("[POST /api/credit/simulate]",e);
  const error=publicError(e);
  res.status(["VOLTAGE_REQUIRED","CPF_REQUIRED","ENTRY_REQUIRED","CT1_INSTALLMENTS_OUT_OF_RANGE","CT2_INSTALLMENTS_OUT_OF_RANGE","CT2_ENTRY_BELOW_MINIMUM","48_INSTALLMENTS_OUT_OF_RANGE","48_ENTRY_BELOW_MINIMUM"].includes(error)?400:500).json({error});
 }
});

app.listen(PORT,()=>{
 console.log(`XVendas Playwright backend em http://0.0.0.0:${PORT}`);
 console.log(`[robot] Plataforma Click: ${CLICK_BASE_URL}`);
 console.log(`[robot] CORS permitido: ${ALLOWED_ORIGINS.join(", ")}`);
});
