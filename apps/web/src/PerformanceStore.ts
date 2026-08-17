import {addDoc,collection,doc,getDoc,getDocs,limit,orderBy,query,serverTimestamp,setDoc} from "firebase/firestore";
import {db} from "./firebase";

export type SalePerformance={value:number;additionalItems:number;won:boolean;createdAtMs:number;productCodes?:string[];approach?:string;objection?:string};
export type Goals={sales:number;revenue:number;ticket:number;additionals:number};
const defaultGoals:Goals={sales:30,revenue:30000,ticket:1000,additionals:15};
function needDb(){if(!db)throw new Error("Firebase não configurado.");return db}

export async function savePerformanceSale(uid:string,data:Omit<SalePerformance,"createdAtMs">){
 return addDoc(collection(needDb(),"users",uid,"performanceSales"),{...data,createdAtMs:Date.now(),createdAt:serverTimestamp()});
}
export async function listPerformanceSales(uid:string){
 const s=await getDocs(query(collection(needDb(),"users",uid,"performanceSales"),orderBy("createdAtMs","desc"),limit(500)));
 return s.docs.map(d=>({id:d.id,...d.data()} as any));
}
export async function loadGoals(uid:string):Promise<Goals>{
 const s=await getDoc(doc(needDb(),"users",uid,"settings","salesGoals"));
 return s.exists()?{...defaultGoals,...s.data()} as Goals:defaultGoals;
}
export async function saveGoals(uid:string,g:Goals){
 await setDoc(doc(needDb(),"users",uid,"settings","salesGoals"),{...g,updatedAt:serverTimestamp()},{merge:true});
}
