import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {useLiveProducts} from "./LiveProductContext";
import {listPerformanceSales,savePerformanceSale} from "./PerformanceStore";
import {confidenceLabel,learnPairs,learnStrategies} from "./SalesIntelligence";

const money=(n:number)=>`R$ ${n.toFixed(2).replace(".",",")}`;
export function SalesIntelligencePanel(){
 const {user}=useAuth(),{products}=useLiveProducts();
 const [rows,setRows]=useState<any[]>([]);
 const [codes,setCodes]=useState<string[]>([]),[approach,setApproach]=useState("Descoberta primeiro"),[objection,setObjection]=useState(""),[value,setValue]=useState(""),[won,setWon]=useState(true);
 async function load(){if(user)setRows(await listPerformanceSales(user.uid))}
 useEffect(()=>{load().catch(()=>{})},[user?.uid]);
 const pairs=useMemo(()=>learnPairs(rows),[rows]);
 const strategies=useMemo(()=>learnStrategies(rows),[rows]);
 const names=new Map(products.map(p=>[p.code,p.name||p.code]));
 function toggle(c:string){setCodes(v=>v.includes(c)?v.filter(x=>x!==c):[...v,c].slice(-5))}
 async function save(){
  if(!user)return;
  await savePerformanceSale(user.uid,{value:Number(value.replace(/\./g,"").replace(",","."))||0,additionalItems:Math.max(0,codes.length-1),won,productCodes:codes,approach,objection:objection.trim()});
  setCodes([]);setValue("");setObjection("");await load();
 }
 const best=pairs[0],bestStrategy=strategies.filter(x=>x.name!=="Não informado")[0];
 return <section className="salesIntel">
  <div className="intelHead"><div><span className="step">📈 Módulo 32</span><h3>Inteligência das Suas Próprias Vendas</h3></div><span>{rows.length} registros analisados</span></div>
  <div className="intelHighlights">
   <article><small>🛒 Combinação aprendida</small><strong>{best?`${names.get(best.a)||best.a} + ${names.get(best.b)||best.b}`:"Ainda sem dados suficientes"}</strong>{best&&<span>{best.wins} vendas • {best.rate}% conversão • confiança {confidenceLabel(best.count)}</span>}</article>
   <article><small>🧠 Abordagem com melhor resultado</small><strong>{bestStrategy?.name||"Ainda sem dados suficientes"}</strong>{bestStrategy&&<span>{bestStrategy.rate}% conversão • ticket {money(bestStrategy.avgTicket)} • confiança {confidenceLabel(bestStrategy.count)}</span>}</article>
  </div>
  <div className="intelRegister"><h4>Ensinar o sistema com um atendimento</h4><div className="intelProducts">{products.slice(0,12).map(p=><button key={p.code} className={codes.includes(p.code)?"selected":""} onClick={()=>toggle(p.code)}>{p.name||p.code}<small>{p.code}</small></button>)}</div>
   <div className="intelFields"><select value={approach} onChange={e=>setApproach(e.target.value)}><option>Descoberta primeiro</option><option>Foco em benefício</option><option>Foco em parcela</option><option>Comparação de produtos</option><option>Demonstração física</option><option>Venda combinada</option></select><input value={objection} onChange={e=>setObjection(e.target.value)} placeholder="Objeção principal (opcional)"/><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Valor final R$"/><select value={won?"won":"lost"} onChange={e=>setWon(e.target.value==="won")}><option value="won">Fechou</option><option value="lost">Não fechou</option></select><button className="primary" onClick={save} disabled={!user}>Registrar aprendizado</button></div>
  </div>
  <div className="intelTables">
   <article><h4>🔗 Produtos que funcionam juntos</h4>{pairs.length?pairs.slice(0,6).map(x=><div key={x.a+x.b}><strong>{names.get(x.a)||x.a} + {names.get(x.b)||x.b}</strong><span>{x.wins}/{x.count} fechadas</span><b>{x.rate}%</b></div>):<p>Registre vendas com dois ou mais produtos para o XVendas descobrir combinações.</p>}</article>
   <article><h4>🎯 Abordagens que convertem</h4>{strategies.filter(x=>x.name!=="Não informado").length?strategies.filter(x=>x.name!=="Não informado").slice(0,6).map(x=><div key={x.name}><strong>{x.name}</strong><span>{x.wins}/{x.count} fechadas</span><b>{x.rate}%</b></div>):<p>Registre a abordagem usada para começar a comparar resultados.</p>}</article>
  </div>
  <p className="intelNote">Os padrões são descritivos do seu próprio histórico. Amostras pequenas podem enganar; por isso o painel mostra confiança baixa, média ou alta conforme aumenta o número de registros.</p>
 </section>
}
