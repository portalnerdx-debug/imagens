import {
  collection,deleteField,doc,getDoc,getDocs,limit,orderBy,query,serverTimestamp,
  setDoc,where,Timestamp
} from "firebase/firestore";
import {db} from "./firebase";
import type {LiveProduct} from "./ProductDataService";

export type CachedProduct=LiveProduct&{
  updatedAtMs:number;
  lastPrice?:number;
  lastStock?:number;
};

function needDb(){if(!db)throw new Error("Firebase não configurado.");return db}
const clean=(v:any)=>Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined));

export async function cacheProduct(uid:string,p:LiveProduct){
  const now=Date.now();
  const ref=doc(needDb(),"users",uid,"productCatalog",p.code);
  const previous=await getDoc(ref);
  const old=previous.exists()?previous.data():null;

  await setDoc(ref,clean({
    ...p,
    // Uma captura sem preço/estoque não pode manter silenciosamente o valor
    // antigo no catálogo como se tivesse acabado de ser confirmado.
    price:p.price===undefined?deleteField():p.price,
    stock:p.stock===undefined?deleteField():p.stock,
    updatedAt:serverTimestamp(),updatedAtMs:now,
    lastPrice:p.price===undefined?deleteField():p.price,
    lastStock:p.stock===undefined?deleteField():p.stock
  }),{merge:true});

  const priceChanged=old && p.price!==undefined && old.lastPrice!==undefined && Number(old.lastPrice)!==p.price;
  const stockChanged=old && p.stock!==undefined && old.lastStock!==undefined && Number(old.lastStock)!==p.stock;
  if(!old || priceChanged || stockChanged){
    const hist=doc(collection(needDb(),"users",uid,"productCatalog",p.code,"history"));
    await setDoc(hist,clean({
      price:p.price,stock:p.stock,capturedAt:p.capturedAt||new Date().toISOString(),
      createdAt:serverTimestamp(),source:p.source||"plataforma-click"
    }));
  }
}

export async function getCachedProduct(uid:string,code:string,maxAgeMinutes=30):Promise<CachedProduct|null>{
  const snap=await getDoc(doc(needDb(),"users",uid,"productCatalog",code));
  if(!snap.exists())return null;
  const x=snap.data() as any;
  const age=Date.now()-Number(x.updatedAtMs||0);
  if(age>maxAgeMinutes*60_000)return null;
  return {found:true,code,...x} as CachedProduct;
}

export async function listCatalog(uid:string){
  const snap=await getDocs(query(collection(needDb(),"users",uid,"productCatalog"),orderBy("updatedAtMs","desc"),limit(100)));
  return snap.docs.map(d=>({code:d.id,...d.data()} as CachedProduct));
}

export async function productHistory(uid:string,code:string){
  const snap=await getDocs(query(collection(needDb(),"users",uid,"productCatalog",code,"history"),orderBy("createdAt","desc"),limit(30)));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
