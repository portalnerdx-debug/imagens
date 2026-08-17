import {addDoc,collection,getDocs,limit,orderBy,query,serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";

export type SoldItem={code:string;name?:string;category?:string;price?:number};
export type BasketRecord={items:SoldItem[];total:number;createdAtMs:number};

function needDb(){if(!db)throw new Error("Firebase não configurado.");return db}

export async function saveBasket(uid:string,items:SoldItem[]){
 const total=items.reduce((s,x)=>s+(Number(x.price)||0),0);
 return addDoc(collection(needDb(),"users",uid,"saleBaskets"),{
  items,total,createdAtMs:Date.now(),createdAt:serverTimestamp()
 });
}

export async function listBaskets(uid:string){
 const snap=await getDocs(query(collection(needDb(),"users",uid,"saleBaskets"),orderBy("createdAtMs","desc"),limit(500)));
 return snap.docs.map(d=>({id:d.id,...d.data()} as any));
}

export type ComboStat={from:string;to:string;count:number;fromCount:number;confidence:number};

export function learnCombos(baskets:BasketRecord[]):ComboStat[]{
 const base=new Map<string,number>(),pairs=new Map<string,number>();
 for(const basket of baskets){
  const codes=[...new Set((basket.items||[]).map(x=>x.code).filter(Boolean))];
  for(const a of codes)base.set(a,(base.get(a)||0)+1);
  for(const a of codes)for(const b of codes)if(a!==b)pairs.set(`${a}|||${b}`,(pairs.get(`${a}|||${b}`)||0)+1);
 }
 return [...pairs.entries()].map(([key,count])=>{
  const [from,to]=key.split("|||"),fromCount=base.get(from)||1;
  return {from,to,count,fromCount,confidence:Math.round(count/fromCount*100)};
 }).sort((a,b)=>b.confidence-a.confidence||b.count-a.count);
}
