import React,{useMemo,useState} from "react";

type Props={objective:string;budget?:string;searchedCode?:string};
type Suggestion={category:string;reason:string;priority:"alta"|"media";estimated:number};

const chains:Record<string,Suggestion[]>={
 "fogão":[
  {category:"Armário de cozinha",reason:"Ajuda a completar a área onde o fogão será usado.",priority:"alta",estimated:699},
  {category:"Mesa",reason:"Complementa a montagem da cozinha/copa.",priority:"media",estimated:599},
  {category:"Depurador/Coifa",reason:"Pode melhorar o conforto no preparo, dependendo do espaço.",priority:"media",estimated:499}
 ],
 "geladeira":[
  {category:"Armário de cozinha",reason:"Pode completar a organização da cozinha.",priority:"media",estimated:699},
  {category:"Micro-ondas",reason:"Combinação comum para equipar a cozinha.",priority:"alta",estimated:549},
  {category:"Mesa",reason:"Ajuda a fechar um conjunto de cozinha/copa.",priority:"media",estimated:599}
 ],
 "lavadora":[
  {category:"Tanquinho",reason:"Pode complementar rotinas específicas de lavagem.",priority:"media",estimated:499},
  {category:"Armário multiuso",reason:"Ajuda na organização da lavanderia.",priority:"alta",estimated:399}
 ],
 "tv":[
  {category:"Rack/Painel",reason:"Cria uma solução completa para instalação da TV.",priority:"alta",estimated:499},
  {category:"Sofá",reason:"Pode completar a sala quando o cliente está montando o ambiente.",priority:"media",estimated:1299}
 ],
 "cama":[
  {category:"Colchão",reason:"É essencial conferir se o cliente também precisa do colchão adequado.",priority:"alta",estimated:899},
  {category:"Guarda-roupa",reason:"Pode fazer sentido para quem está montando o quarto.",priority:"media",estimated:1199}
 ]
};

function detectCategory(text:string){
 const t=text.toLowerCase();
 for(const k of Object.keys(chains)) if(t.includes(k)) return k;
 return "";
}

export function SmartBasket({objective,budget,searchedCode}:Props){
 const [manual,setManual]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const [houseBudget,setHouseBudget]=useState(budget||"");
 const category=detectCategory(`${objective} ${manual}`);
 const suggestions=category?chains[category]:[];

 const budgetValue=Number(String(houseBudget).replace(",",".")||0);
 const chosen=useMemo(()=>suggestions.filter(s=>selected.includes(s.category)),[selected,suggestions]);
 const estimatedTotal=chosen.reduce((sum,x)=>sum+x.estimated,0);
 const remaining=budgetValue>0?budgetValue-estimatedTotal:null;

 function toggle(name:string){
  setSelected(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name]);
 }

 const chain=category?[category,...chosen.map(x=>x.category)].join(" → "):"";

 return <section className="basketBox">
  <div className="basketHead">
   <div><span className="step">🛒 Módulo 07</span><h3>Venda Combinada Inteligente</h3></div>
   <span className="basketCode">{searchedCode?`Produto ${searchedCode}`:"Sem produto selecionado"}</span>
  </div>

  <div className="basketDetect">
   <label>Produto/categoria principal
    <input value={manual} onChange={e=>setManual(e.target.value)} placeholder={category||"Ex.: fogão, geladeira, TV..."}/>
   </label>
   <div><small>Detectado a partir do atendimento</small><strong>{category||"Ainda não identificado"}</strong></div>
  </div>

  {!category?<div className="basketEmpty">Informe a categoria principal ou mencione o produto no objetivo do atendimento para gerar complementos.</div>:
   <>
    <div className="suggestionGrid">
     {suggestions.map(item=><button type="button" key={item.category} onClick={()=>toggle(item.category)} className={selected.includes(item.category)?"suggestion selected":"suggestion"}>
      <div><strong>{item.category}</strong><span>{item.priority==="alta"?"Prioridade alta":"Opcional"}</span></div>
      <p>{item.reason}</p>
      <small>Valor demonstrativo: R$ {item.estimated.toFixed(2).replace(".",",")}</small>
     </button>)}
    </div>

    <div className="chainCard">
     <span>🔗 Venda Cruzada em Cadeia</span>
     <strong>{chain}</strong>
     <p>Sugira complementos somente quando fizerem sentido para a necessidade e o orçamento do cliente.</p>
    </div>
   </>
  }

  <div className="houseBuilder">
   <div><span className="step">🏠 Montador de Casa Completa</span><h4>Trabalhar dentro do orçamento</h4></div>
   <label>Orçamento disponível (R$)<input inputMode="decimal" value={houseBudget} onChange={e=>setHouseBudget(e.target.value)} placeholder="Ex.: 5000"/></label>
   <div className="houseNumbers">
    <div><small>Complementos selecionados</small><strong>R$ {estimatedTotal.toFixed(2).replace(".",",")}</strong></div>
    <div><small>Saldo do orçamento</small><strong className={remaining!==null&&remaining<0?"negative":""}>{remaining===null?"Informe o orçamento":`R$ ${remaining.toFixed(2).replace(".",",")}`}</strong></div>
   </div>
   {remaining!==null&&remaining<0&&<div className="budgetAlert">O conjunto passou do orçamento. Remova um complemento ou procure uma alternativa mais econômica.</div>}
  </div>
 </section>
}
