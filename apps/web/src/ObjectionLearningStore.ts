import {addDoc,collection,getDocs,limit,orderBy,query,serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";

export type ObjectionRecord={
 text:string; category:string; response:string; outcome:"pending"|"won"|"lost";
 createdAtMs:number;
};
export type LostSaleRecord={
 reason:string; detail:string; productCode?:string; stage?:string; createdAtMs:number;
};
function needDb(){if(!db)throw new Error("Firebase não configurado.");return db}

export async function saveObjectionLearning(uid:string,data:Omit<ObjectionRecord,"createdAtMs">){
 return addDoc(collection(needDb(),"users",uid,"objectionBank"),{...data,createdAtMs:Date.now(),createdAt:serverTimestamp()});
}
export async function listObjectionLearning(uid:string){
 const s=await getDocs(query(collection(needDb(),"users",uid,"objectionBank"),orderBy("createdAtMs","desc"),limit(300)));
 return s.docs.map(d=>({id:d.id,...d.data()} as any));
}
export async function saveLostSaleLearning(uid:string,data:Omit<LostSaleRecord,"createdAtMs">){
 return addDoc(collection(needDb(),"users",uid,"lostSaleLearning"),{...data,createdAtMs:Date.now(),createdAt:serverTimestamp()});
}
export async function listLostSaleLearning(uid:string){
 const s=await getDocs(query(collection(needDb(),"users",uid,"lostSaleLearning"),orderBy("createdAtMs","desc"),limit(300)));
 return s.docs.map(d=>({id:d.id,...d.data()} as any));
}
