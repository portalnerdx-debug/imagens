import {lookupClickProduct} from "./ClickGateway";

export type LiveProduct={
  found:boolean;
  code:string;
  name?:string;
  price?:number;
  stock?:number;
  brand?:string;
  branch?:string;
  voltageOptions?:string[];
  imageUrl?:string;
  productUrl?:string;
  captureMethod?:"endpoint"|"visual";
  text?:string;
  source?:string;
  capturedAt?:string;
};

export async function fetchLiveProduct(code:string):Promise<LiveProduct>{
  const value=code.trim();
  if(!value) throw new Error("Informe o código do produto.");
  return lookupClickProduct(value) as Promise<LiveProduct>;
}
