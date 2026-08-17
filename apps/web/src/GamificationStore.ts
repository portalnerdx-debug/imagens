import {doc,getDoc,setDoc,serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";

export type GameStats={
 xp:number;level:number;streak:number;lastActiveDay:string;
 quizzes:number;correct:number;missionsCompleted:number;
};
const initial:GameStats={xp:0,level:1,streak:0,lastActiveDay:"",quizzes:0,correct:0,missionsCompleted:0};
function needDb(){if(!db)throw new Error("Firebase não configurado.");return db}
export async function loadGameStats(uid:string):Promise<GameStats>{
 const s=await getDoc(doc(needDb(),"users",uid,"gamification","stats"));
 return s.exists()?{...initial,...s.data()} as GameStats:initial;
}
export async function awardXp(uid:string,amount:number,patch:Partial<GameStats>={}){
 const current=await loadGameStats(uid);
 const today=new Date().toISOString().slice(0,10);
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 let streak=current.streak;
 if(current.lastActiveDay!==today)streak=current.lastActiveDay===yesterday?current.streak+1:1;
 const xp=current.xp+amount;
 const next={...current,...patch,xp,level:Math.floor(xp/250)+1,streak,lastActiveDay:today};
 await setDoc(doc(needDb(),"users",uid,"gamification","stats"),{...next,updatedAt:serverTimestamp()},{merge:true});
 return next;
}
