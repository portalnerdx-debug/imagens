import {addDoc,collection,serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";
import {savePerformanceSale} from "./PerformanceStore";
import {saveLostSaleLearning,saveObjectionLearning} from "./ObjectionLearningStore";
import {classifyObjection,suggestedResponse} from "./ObjectionAnalyzer";

export type SmartClosePayload={
 won:boolean; value:number; productCodes:string[]; approach:string;
 objection:string; stage:string; notes:string[]; additionalItems:number;
};

function needDb(){if(!db)throw new Error("Firebase não configurado.");return db}

export async function finalizeSmartAttendance(uid:string,p:SmartClosePayload){
 const category=p.objection.trim()?classifyObjection(p.objection):"";
 await savePerformanceSale(uid,{
  value:p.value,additionalItems:p.additionalItems,won:p.won,
  productCodes:p.productCodes,approach:p.approach,objection:p.objection.trim()
 });
 if(p.objection.trim()){
  await saveObjectionLearning(uid,{
   text:p.objection.trim(),category,response:suggestedResponse(category),
   outcome:p.won?"won":"lost"
  });
 }
 if(!p.won){
  await saveLostSaleLearning(uid,{
   reason:category||"Outro",
   detail:p.objection.trim()||"Atendimento encerrado sem venda.",
   productCode:p.productCodes[0],stage:p.stage
  });
 }
 await addDoc(collection(needDb(),"users",uid,"attendances"),{
  ...p,objectionCategory:category,createdAtMs:Date.now(),createdAt:serverTimestamp()
 });
}
