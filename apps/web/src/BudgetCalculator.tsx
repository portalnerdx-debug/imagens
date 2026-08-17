import React,{useMemo,useState} from "react";

export function BudgetCalculator({initialBudget}:{initialBudget?:string}){
 const [budget,setBudget]=useState(initialBudget||"");
 const [entry,setEntry]=useState("");
 const [installments,setInstallments]=useState("10");
 const [items,setItems]=useState([{name:"Produto principal",value:""}]);

 const total=useMemo(()=>items.reduce((s,x)=>s+Number(x.value.replace(",",".")||0),0),[items]);
 const b=Number(budget.replace(",",".")||0), e=Number(entry.replace(",",".")||0), n=Math.max(1,Number(installments)||1);
 const remaining=b?b-total:null;
 const simple=(Math.max(0,total-e)/n);

 return <section className="budgetBox">
  <div><span className="step">💰 Calculadora de Orçamento</span><h3>Monte a compra pelo limite do cliente</h3></div>
  <div className="budgetInputs">
   <label>Orçamento total<input value={budget} onChange={x=>setBudget(x.target.value)} placeholder="R$"/></label>
   <label>Entrada planejada<input value={entry} onChange={x=>setEntry(x.target.value)} placeholder="R$"/></label>
   <label>Nº de parcelas<input type="number" min="1" value={installments} onChange={x=>setInstallments(x.target.value)}/></label>
  </div>
  <div className="budgetItems">
   {items.map((item,i)=><div key={i}><input value={item.name} onChange={e=>setItems(v=>v.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/><input value={item.value} onChange={e=>setItems(v=>v.map((x,j)=>j===i?{...x,value:e.target.value}:x))} placeholder="Valor"/><button onClick={()=>setItems(v=>v.filter((_,j)=>j!==i))}>×</button></div>)}
   <button onClick={()=>setItems(v=>[...v,{name:"Complemento",value:""}])}>+ Adicionar item</button>
  </div>
  <div className="budgetSummary">
   <div><small>Total informado</small><strong>R$ {total.toFixed(2).replace(".",",")}</strong></div>
   <div><small>Saldo do orçamento</small><strong>{remaining===null?"—":`R$ ${remaining.toFixed(2).replace(".",",")}`}</strong></div>
   <div><small>Divisão matemática*</small><strong>R$ {simple.toFixed(2).replace(".",",")} × {n}</strong></div>
  </div>
  <p className="budgetNote">*Esta divisão não é uma simulação real de crediário e não inclui juros/regras comerciais. Para condição real, use o módulo de Crediário.</p>
 </section>
}
