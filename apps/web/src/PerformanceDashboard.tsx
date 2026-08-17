import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {listPerformanceSales,loadGoals,saveGoals,savePerformanceSale,type Goals} from "./PerformanceStore";

const defaults:Goals={sales:30,revenue:30000,ticket:1000,additionals:15};
const money=(n:number)=>`R$ ${n.toFixed(2).replace(".",",")}`;

export function PerformanceDashboard(){
 const {user}=useAuth();
 const [sales,setSales]=useState<any[]>([]),[goals,setGoals]=useState<Goals>(defaults);
 const [value,setValue]=useState(""),[additionals,setAdditionals]=useState("0"),[won,setWon]=useState(true),[editing,setEditing]=useState(false);

 async function load(){if(!user)return;const [a,b]=await Promise.all([listPerformanceSales(user.uid),loadGoals(user.uid)]);setSales(a);setGoals(b)}
 useEffect(()=>{load().catch(()=>{})},[user?.uid]);

 const k=useMemo(()=>{
  const wonSales=sales.filter(x=>x.won),revenue=wonSales.reduce((s,x)=>s+Number(x.value||0),0);
  const add=wonSales.reduce((s,x)=>s+Number(x.additionalItems||0),0);
  return {attempts:sales.length,sales:wonSales.length,revenue,add,ticket:wonSales.length?revenue/wonSales.length:0,conversion:sales.length?wonSales.length/sales.length*100:0};
 },[sales]);

 async function register(){
  if(!user)return;await savePerformanceSale(user.uid,{value:Number(value.replace(/\./g,"").replace(",","."))||0,additionalItems:Number(additionals)||0,won});
  setValue("");setAdditionals("0");await load();
 }
 async function persistGoals(){if(!user)return;await saveGoals(user.uid,goals);setEditing(false)}
 const cards=[
  ["Vendas",k.sales,goals.sales,`${Math.min(100,k.sales/goals.sales*100||0)}%`],
  ["Faturamento",money(k.revenue),money(goals.revenue),`${Math.min(100,k.revenue/goals.revenue*100||0)}%`],
  ["Ticket médio",money(k.ticket),money(goals.ticket),`${Math.min(100,k.ticket/goals.ticket*100||0)}%`],
  ["Adicionais",k.add,goals.additionals,`${Math.min(100,k.add/goals.additionals*100||0)}%`]
 ];
 return <section className="performance">
  <div className="perfHead"><div><span className="step">📊 Módulo 29</span><h3>Metas + Painel de Desempenho</h3></div><button onClick={()=>setEditing(!editing)}>🎯 Editar metas</button></div>
  {editing&&<div className="goalEditor">{(["sales","revenue","ticket","additionals"] as const).map(key=><label key={key}>{key==="sales"?"Vendas":key==="revenue"?"Faturamento":key==="ticket"?"Ticket médio":"Adicionais"}<input type="number" value={goals[key]} onChange={e=>setGoals({...goals,[key]:Number(e.target.value)})}/></label>)}<button className="primary" onClick={persistGoals}>Salvar metas</button></div>}
  <div className="perfCards">{cards.map(([name,current,target,pct]:any)=><article key={name}><small>{name}</small><strong>{current}</strong><span>Meta: {target}</span><div><i style={{width:pct}}/></div><b>{Math.round(parseFloat(pct))}%</b></article>)}</div>
  <div className="conversionCard"><div><span>Conversão registrada</span><strong>{k.conversion.toFixed(1)}%</strong></div><p>{k.sales} vendas em {k.attempts} atendimentos registrados.</p></div>
  <div className="saleRegister"><strong>➕ Registrar resultado de atendimento</strong><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Valor da venda (R$)"/><input type="number" min="0" value={additionals} onChange={e=>setAdditionals(e.target.value)} placeholder="Adicionais"/><select value={won?"won":"lost"} onChange={e=>setWon(e.target.value==="won")}><option value="won">Venda fechada</option><option value="lost">Não fechou</option></select><button className="primary" onClick={register} disabled={!user}>Registrar</button></div>
  <div className="perfInsight"><strong>📈 Leitura rápida</strong><p>{k.conversion>=70?"Conversão forte nos registros atuais. Busque elevar ticket e adicionais sem perder aderência à necessidade.":k.conversion>=40?"Conversão intermediária. Revise as objeções e os atendimentos perdidos para achar o principal gargalo.":"Conversão baixa nos registros atuais. Priorize descoberta e qualificação antes de aumentar a quantidade de ofertas."}</p></div>
  <p className="perfNote">O painel considera somente atendimentos registrados no XVendas. Metas são pessoais e não representam metas oficiais da empresa.</p>
 </section>
}
