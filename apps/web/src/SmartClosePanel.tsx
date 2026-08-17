import React,{useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {useLiveProducts} from "./LiveProductContext";
import {finalizeSmartAttendance} from "./SmartCloseStore";
import {analyzeCustomer} from "./CustomerSignals";
import {analyzeClosing} from "./ClosingSignals";

export function SmartClosePanel({notes,objective,budget,stage}:{notes:string[];objective:string;budget:string;stage:string}){
 const {user}=useAuth(),{products}=useLiveProducts();
 const [won,setWon]=useState(true),[value,setValue]=useState(""),[codes,setCodes]=useState<string[]>([]);
 const [approach,setApproach]=useState("Descoberta primeiro"),[objection,setObjection]=useState("");
 const [saving,setSaving]=useState(false),[done,setDone]=useState("");
 const profile=useMemo(()=>analyzeCustomer(notes.join(" "),objective),[notes.join("|"),objective]);
 const closing=useMemo(()=>analyzeClosing(notes,stage,budget),[notes.join("|"),stage,budget]);
 function toggle(c:string){setCodes(v=>v.includes(c)?v.filter(x=>x!==c):[...v,c])}
 async function finish(){
  if(!user||saving)return;
  setSaving(true);setDone("");
  try{
   await finalizeSmartAttendance(user.uid,{
    won,value:Number(value.replace(/\./g,"").replace(",","."))||0,
    productCodes:codes,approach,objection:objection.trim(),stage,notes,
    additionalItems:Math.max(0,codes.length-1)
   });
   setDone(won?"✅ Venda registrada e aprendizado atualizado.":"📉 Venda perdida registrada para aprendizado.");
   setValue("");setCodes([]);setObjection("");
  }catch(e:any){setDone(`Erro ao finalizar: ${e?.message||"falha desconhecida"}`)}
  finally{setSaving(false)}
 }
 return <section className="smartClose">
  <div className="smartCloseHead"><div><span className="step">🏁 Módulo 34</span><h3>Fechamento Inteligente</h3></div><span className={closing.temperature}>Venda {closing.temperature} • {closing.score}%</span></div>
  <div className="closeSummary"><article><small>Perfil detectado</small><strong>{profile.label}</strong></article><article><small>Etapa atual</small><strong>{stage}</strong></article><article><small>Anotações</small><strong>{notes.length}</strong></article><article><small>Produtos selecionados</small><strong>{codes.length}</strong></article></div>
  <div className="closeForm">
   <label>Resultado<select value={won?"won":"lost"} onChange={e=>setWon(e.target.value==="won")}><option value="won">✅ Venda fechada</option><option value="lost">❌ Venda não fechou</option></select></label>
   <label>Valor final<input value={value} onChange={e=>setValue(e.target.value)} placeholder="R$ 0,00"/></label>
   <label>Abordagem usada<select value={approach} onChange={e=>setApproach(e.target.value)}><option>Descoberta primeiro</option><option>Foco em benefício</option><option>Foco em parcela</option><option>Comparação de produtos</option><option>Demonstração física</option><option>Venda combinada</option></select></label>
   <label>Objeção principal<input value={objection} onChange={e=>setObjection(e.target.value)} placeholder="Opcional se a venda fechou"/></label>
  </div>
  <div className="closeProducts"><strong>Produtos do atendimento</strong><div>{products.slice(0,20).map(p=><button key={p.code} className={codes.includes(p.code)?"selected":""} onClick={()=>toggle(p.code)}>{p.name||p.code}<small>{p.code}</small></button>)}</div></div>
  <div className="autoLearning"><strong>🧠 Ao finalizar, o XVendas alimenta automaticamente:</strong><span>📊 desempenho e conversão</span><span>🛒 combos e adicionais</span><span>💬 banco de objeções</span><span>📉 motivos de perda</span><span>🎯 abordagem utilizada</span><span>📚 histórico do atendimento</span></div>
  <button className="primary finalButton" onClick={finish} disabled={!user||saving}>{saving?"Salvando...":won?"🏁 Finalizar venda e aprender":"📉 Registrar perda e aprender"}</button>
  {done&&<div className="closeDone">{done}</div>}
  <p className="closePrivacy">Não registre CPF, senha, dados completos de cartão ou outras credenciais nas anotações. O histórico deve guardar somente informações necessárias ao aprendizado de vendas.</p>
 </section>
}
