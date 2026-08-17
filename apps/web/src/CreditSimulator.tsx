import React,{useState} from "react";
const ROBOT_URL="http://localhost:8081";

export function CreditSimulator({defaultCode=""}:{defaultCode?:string}){
  const [code,setCode]=useState(defaultCode);
  const [customer,setCustomer]=useState<"novo"|"tradicional">("tradicional");
  const [withEntry,setWithEntry]=useState(false);
  const [installments,setInstallments]=useState(10);
  const [entry,setEntry]=useState("");
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);

  const plan=customer==="novo"?"48":withEntry?"CT2":"CT1";

  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setResult(null);
    try{
      const r=await fetch(`${ROBOT_URL}/api/credit/simulate`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({code,plan,installments,downPayment:Number(entry||0)})
      });
      const data=await r.json();
      setResult(data);
    }catch(e){setResult({error:e instanceof Error?e.message:"Erro"});}
    finally{setLoading(false);}
  }

  return <section className="creditBox">
    <div className="creditTitle"><span>💳 Simulador de Crediário</span><b>{plan}</b></div>
    <form onSubmit={submit} className="creditForm">
      <label>Código<input value={code} onChange={e=>setCode(e.target.value)} required/></label>
      <label>Cliente<select value={customer} onChange={e=>{setCustomer(e.target.value as any);setWithEntry(false)}}>
        <option value="tradicional">Tradicional</option><option value="novo">Novo — 48</option>
      </select></label>
      {customer==="tradicional"&&<label>Condição<select value={withEntry?"sim":"nao"} onChange={e=>setWithEntry(e.target.value==="sim")}>
        <option value="nao">Sem entrada — CT1</option><option value="sim">Com entrada — CT2</option>
      </select></label>}
      <label>{plan==="CT1"?"Parcelas":"Pagamentos totais"}<input type="number" min={plan==="CT1"?1:2} max="24" value={installments} onChange={e=>setInstallments(Number(e.target.value))}/></label>
      {(plan==="CT2"||plan==="48")&&<label>Entrada (R$)<input type="number" min="0.01" step="0.01" value={entry} onChange={e=>setEntry(e.target.value)} required/></label>}
      <button className="primary" disabled={loading}>{loading?"Simulando...":"Simular crediário"}</button>
    </form>
    {result&&<div className={result.error?"creditResult error":"creditResult"}>
      {result.error?<><strong>A automação precisa ser calibrada</strong><p>{result.error}</p>{result.diagnostic&&<code>{result.diagnostic}</code>}</>:<pre>{JSON.stringify(result,null,2)}</pre>}
    </div>}
  </section>
}
