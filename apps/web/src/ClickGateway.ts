import {auth} from "./firebase";

const ROBOT_URL=(import.meta.env.VITE_ROBOT_URL||"http://localhost:8081").replace(/\/$/,"");

export type ClickProduct={
 found?:boolean;code:string;name?:string;price?:number;stock?:number;
 voltageOptions?:string[];brand?:string;branch?:string;text?:string;
 imageUrl?:string;productUrl?:string;captureMethod?:"endpoint"|"visual";
 source?:string;capturedAt?:string;
};
export type ClickCreditResult={
 ok:boolean;productCode?:string;plan:"48"|"CT1"|"CT2";installments:number;
 entry?:number;installmentValue?:number;total?:number;message?:string;status?:string;
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

async function request<T>(path:string,init:RequestInit={}):Promise<T>{
 const idToken=await token();
 const res=await fetch(`${ROBOT_URL}${path}`,{
  ...init,
  headers:{
   "content-type":"application/json",
   "authorization":`Bearer ${idToken}`,
   ...(init.headers||{})
  }
 });
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(data.error||"Falha no backend de automação.");
 return data as T;
}

export function lookupClickProduct(code:string){
 return request<ClickProduct>(`/api/products/${encodeURIComponent(code)}`);
}

export function simulateClickCredit(input:{
 productCode:string;plan:"48"|"CT1"|"CT2";installments:number;
 entry?:number;voltage?:string;warranty:boolean;cpf?:string;
}){
 return request<ClickCreditResult>("/api/credit/simulate",{
  method:"POST",body:JSON.stringify(input)
 });
}

export function refreshClickSession(){
 return request<{ok:boolean}>("/api/session/refresh",{method:"POST",body:"{}"});
}
