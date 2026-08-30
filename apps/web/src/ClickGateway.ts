import {auth} from "./firebase";

const ROBOT_URL=(import.meta.env.VITE_ROBOT_URL||"https://xvendas-robot.onrender.com").replace(/\/$/,"");
const VISIBLE_AGENT_URL=(import.meta.env.VITE_VISIBLE_AGENT_URL||"http://127.0.0.1:8082").replace(/\/$/,"");

export type ClickProduct={
 found?:boolean;code:string;name?:string;price?:number;stock?:number;
 voltageOptions?:string[];brand?:string;branch?:string;text?:string;
 imageUrl?:string;productUrl?:string;captureMethod?:"endpoint"|"visual";
 source?:string;capturedAt?:string;
};
export type ClickCreditResult={
 ok:boolean;productCode?:string;plan:"48"|"CT1"|"CT2";installments:number;
 entry?:number;installmentValue?:number;total?:number;message?:string;status?:string;clickUrl?:string;
 safeStop?:string;capturedValues?:number[];
 ct1RequiredProducts?:Array<{code:string;quantity:number;reason?:string}>;
 requiredProducts?:Array<{code:string;quantity:number;reason?:string}>;
 requestedInstallments?:number;financedTotal?:number;minimumEntry?:number;
 warranty?:{selected:boolean;serviceCode?:string;cartTotalAfterWarranty?:number;message?:string};
};

async function token(){
 const user=auth?.currentUser;
 if(!user)throw new Error("Faça login no XVendas.");
 return user.getIdToken();
}

async function request<T>(path:string,init:RequestInit={},visible=true):Promise<T>{
 const base=visible?VISIBLE_AGENT_URL:ROBOT_URL;
 const headers:Record<string,string>={"content-type":"application/json",...(init.headers as Record<string,string>||{})};
 if(!visible){headers.authorization=`Bearer ${await token()}`;}
 let res:Response;
 try{res=await fetch(`${base}${path}`,{...init,headers});}
 catch(e){if(visible)throw new Error("AGENTE_LOCAL_INDISPONIVEL: inicie apps/local-agent/INICIAR-AGENTE.bat e mantenha-o aberto.");throw e;}
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(data.error||"Falha no backend de automação.");
 return data as T;
}

export function lookupClickProduct(code:string){
 return request<ClickProduct>(`/api/products/${encodeURIComponent(code)}`);
}

export function simulateClickCredit(input:{
 productCode:string;plan:"48"|"CT1"|"CT2";installments:number;
 entry?:number;voltage?:string;warranty:boolean;cpf?:string;auxiliaryQuantity?:number;
}){
 return request<ClickCreditResult>("/api/credit/simulate",{method:"POST",body:JSON.stringify(input)});
}

export type ClickCardResult={
 ok:boolean;productCode:string;plan:"CCS"|"CCC";installments:number;entry?:number;
 installmentValue?:number;total?:number;voltage?:string;cardForm?:string;brand?:string;
 message?:string;status?:string;safeStop?:string;clickUrl?:string;
};
export function simulateClickCard(input:{
 productCode:string;plan:"CCS"|"CCC";installments:number;entry?:number;voltage?:string;cpf?:string;
}){
 return request<ClickCardResult>("/api/card/simulate",{method:"POST",body:JSON.stringify(input)});
}

export function refreshClickSession(){
 return request<{ok:boolean}>("/api/session/refresh",{method:"POST",body:"{}"});
}
