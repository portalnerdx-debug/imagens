import {getClickConfig} from "./clickConfig.js";

export type ProductLookup={code:string};
export type CreditSimulation={
 productCode:string;plan:"48"|"CT1"|"CT2";installments:number;
 entry?:number;voltage?:string;warranty:boolean;cpf:string;
};
export type ClickAdapter={
 lookupProduct(input:ProductLookup):Promise<unknown>;
 simulateCredit(input:CreditSimulation):Promise<unknown>;
};

type AuthorizedTransport={
 lookupProduct(config:ReturnType<typeof getClickConfig>,input:ProductLookup):Promise<unknown>;
 simulateCredit(config:ReturnType<typeof getClickConfig>,input:CreditSimulation):Promise<unknown>;
};

/**
 * This transport must be implemented from official/authorized Plataforma Click
 * API documentation or another method explicitly permitted by the service.
 * It must not bypass CAPTCHA, MFA, rate limits, or anti-bot controls.
 */
const transport:AuthorizedTransport={
 async lookupProduct(){
  throw new Error("CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED");
 },
 async simulateCredit(){
  throw new Error("CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED");
 }
};

export function createClickAdapter():ClickAdapter{
 return {
  async lookupProduct(input){
   const config=getClickConfig();
   return transport.lookupProduct(config,input);
  },
  async simulateCredit(input){
   const config=getClickConfig();
   return transport.simulateCredit(config,input);
  }
 };
}
