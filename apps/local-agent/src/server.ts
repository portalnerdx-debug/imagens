import "dotenv/config";
import cors from "cors";
import express from "express";
process.env.CLICK_HEADLESS="false";
process.env.PORT=process.env.PORT||"8082";
const [{withAuthenticatedClickPage,withFreshClickPage,refreshClickSession},{searchProduct},{simulateCredit},{simulateCard}]=await Promise.all([
 import("../../robot/src/browser.js"),import("../../robot/src/productSearch.js"),import("../../robot/src/creditSimulation.js"),import("../../robot/src/cardSimulation.js")
]);
const app=express(),port=Number(process.env.PORT||8082);
const origins=(process.env.ALLOWED_ORIGIN||"http://localhost:5173,https://vendas-211b4.web.app").split(",").map(x=>x.trim()).filter(Boolean);
app.use(cors({origin(origin,cb){if(!origin||origins.includes(origin))return cb(null,true);cb(new Error("CORS_ORIGIN_NOT_ALLOWED"))}}));app.use(express.json({limit:"64kb"}));
app.get("/health",(_q,r)=>r.json({ok:true,mode:"LOCAL_VISIBLE",headless:false}));
app.post("/api/session/refresh",async(_q,r)=>{try{await refreshClickSession();r.json({ok:true})}catch(e){r.status(500).json({error:String(e instanceof Error?e.message:e)})}});
app.get("/api/products/:code",async(q,r)=>{try{r.json(await withAuthenticatedClickPage((p:any)=>searchProduct(p,String(q.params.code||"").trim())))}catch(e){r.status(500).json({error:String(e instanceof Error?e.message:e)})}});
app.post("/api/credit/simulate",async(q,r)=>{try{const b=q.body||{},aq=b.auxiliaryQuantity===undefined?3:Number(b.auxiliaryQuantity);r.json(await withFreshClickPage((p:any)=>simulateCredit(p,{code:String(b.productCode||b.code||"").trim(),plan:String(b.plan||"").toUpperCase(),installments:Number(b.installments),downPayment:b.entry!==undefined?Number(b.entry):undefined,cpf:b.cpf?String(b.cpf):undefined,voltage:b.voltage?String(b.voltage):undefined,warranty:Boolean(b.warranty),auxiliaryQuantity:aq})))}catch(e){console.error(e);r.status(500).json({error:String(e instanceof Error?e.message:e)})}});
app.post("/api/card/simulate",async(q,r)=>{try{const b=q.body||{};r.json(await withFreshClickPage((p:any)=>simulateCard(p,{code:String(b.productCode||b.code||"").trim(),plan:String(b.plan||"CCS").toUpperCase(),installments:Number(b.installments),entry:b.entry!==undefined?Number(b.entry):undefined,cpf:b.cpf?String(b.cpf):undefined,voltage:b.voltage?String(b.voltage):undefined})))}catch(e){console.error(e);r.status(500).json({error:String(e instanceof Error?e.message:e)})}});
app.listen(port,()=>console.log(`Agente Local XVendas em http://127.0.0.1:${port} — janela Click visível`));