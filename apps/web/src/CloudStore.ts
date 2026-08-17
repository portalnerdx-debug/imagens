import {
  addDoc, collection, doc, getDoc, getDocs, orderBy, query,
  serverTimestamp, setDoc, updateDoc
} from "firebase/firestore";
import { db } from "./firebase";

export type SaleRecord={
  category:string; value:number; extras:number; closed:boolean; approach:string;
};

export type AtendimentoRecord={
  customerName?:string;
  objective:string;
  budget?:number;
  stage:string;
  status:"em_atendimento"|"fechada"|"perdida";
  notes:string[];
  productCode?:string;
};

function needDb(){
  if(!db) throw new Error("Firebase não configurado.");
  return db;
}

export async function createAtendimento(uid:string,data:AtendimentoRecord){
  const ref=await addDoc(collection(needDb(),"users",uid,"atendimentos"),{
    ...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  });
  return ref.id;
}

export async function updateAtendimento(uid:string,id:string,data:Partial<AtendimentoRecord>){
  await updateDoc(doc(needDb(),"users",uid,"atendimentos",id),{
    ...data,updatedAt:serverTimestamp()
  });
}

export async function listAtendimentos(uid:string){
  const snap=await getDocs(query(collection(needDb(),"users",uid,"atendimentos"),orderBy("createdAt","desc")));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

export async function saveSale(uid:string,data:SaleRecord){
  return addDoc(collection(needDb(),"users",uid,"sales"),{...data,createdAt:serverTimestamp()});
}

export async function listSales(uid:string){
  const snap=await getDocs(query(collection(needDb(),"users",uid,"sales"),orderBy("createdAt","desc")));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

export async function saveObjection(uid:string,data:Record<string,unknown>){
  return addDoc(collection(needDb(),"users",uid,"objections"),{...data,createdAt:serverTimestamp()});
}

export async function listObjections(uid:string){
  const snap=await getDocs(query(collection(needDb(),"users",uid,"objections"),orderBy("createdAt","desc")));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

export async function saveLostSale(uid:string,data:Record<string,unknown>){
  return addDoc(collection(needDb(),"users",uid,"lostSales"),{...data,createdAt:serverTimestamp()});
}

export async function listLostSales(uid:string){
  const snap=await getDocs(query(collection(needDb(),"users",uid,"lostSales"),orderBy("createdAt","desc")));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

export async function saveProfile(uid:string,data:Record<string,unknown>){
  return setDoc(doc(needDb(),"users",uid),{...data,updatedAt:serverTimestamp()},{merge:true});
}

export async function saveGoal(uid:string,data:Record<string,unknown>){
  return setDoc(doc(needDb(),"users",uid,"private","progress"),{...data,updatedAt:serverTimestamp()},{merge:true});
}

export async function loadGoal(uid:string){
  const snap=await getDoc(doc(needDb(),"users",uid,"private","progress"));
  return snap.exists()?snap.data():null;
}


export type ProgressRecord={
  xp:number;
  streak:number;
  missionDone:boolean;
  missionDate?:string;
  goals:{
    sales:number;
    ticket:number;
    extras:number;
  };
  current:{
    sales:number;
    ticket:number;
    extras:number;
  };
};

export async function saveProgress(uid:string,data:ProgressRecord){
  return setDoc(doc(needDb(),"users",uid,"private","progress"),{
    ...data,updatedAt:serverTimestamp()
  },{merge:true});
}

export async function loadProgress(uid:string):Promise<ProgressRecord|null>{
  const snap=await getDoc(doc(needDb(),"users",uid,"private","progress"));
  return snap.exists()?snap.data() as ProgressRecord:null;
}
