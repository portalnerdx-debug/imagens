import React,{createContext,useContext,useState} from "react";
import type {LiveProduct} from "./ProductDataService";

type Value={
 products:LiveProduct[];
 addProduct:(p:LiveProduct)=>void;
 clear:()=>void;
};
const C=createContext<Value|null>(null);

export function LiveProductProvider({children}:{children:React.ReactNode}){
 const [products,setProducts]=useState<LiveProduct[]>([]);
 function addProduct(p:LiveProduct){
  setProducts(v=>[p,...v.filter(x=>x.code!==p.code)].slice(0,20));
 }
 return <C.Provider value={{products,addProduct,clear:()=>setProducts([])}}>{children}</C.Provider>
}
export function useLiveProducts(){
 const v=useContext(C);if(!v)throw new Error("useLiveProducts fora do provider");return v;
}
