import React,{useMemo,useState} from "react";

type ProductInfo={
  code:string; name:string; category:string; price?:number;
  features:string[]; benefits:string[]; audience:string[];
  arguments:string[]; demonstration:string[];
};

const initial:ProductInfo[]=[
 {code:"DEMO-FOGAO",name:"Fogão demonstrativo",category:"Fogão",
  features:["Acendimento automático","Forno com visor amplo","Mesa de fácil limpeza"],
  benefits:["Mais praticidade no uso diário","Permite acompanhar o preparo sem abrir o forno","Facilita a limpeza depois de cozinhar"],
  audience:["Famílias que cozinham com frequência","Cliente que valoriza praticidade"],
  arguments:["Bom para quem quer facilitar a rotina da cozinha.","O benefício principal aqui é praticidade no dia a dia."],
  demonstration:["Mostre o acendimento","Abra o forno e mostre espaço/grades","Mostre como a mesa facilita a limpeza"]},
 {code:"DEMO-LAVADORA",name:"Lavadora demonstrativa",category:"Lavadora",
  features:["Programas de lavagem","Ciclos para diferentes tecidos","Seleção de nível de água"],
  benefits:["Adapta a lavagem ao tipo de roupa","Ajuda a cuidar melhor das peças","Evita usar mais água que o necessário"],
  audience:["Famílias","Quem lava roupas variadas durante a semana"],
  arguments:["A vantagem é conseguir adaptar a lavagem à rotina da casa.","Não é só quantidade de programas: é escolher melhor como cada roupa será lavada."],
  demonstration:["Mostre o painel","Explique 2 ou 3 ciclos úteis","Mostre seleção de nível de água"]},
];

export function ProductIntelligence({searchedCode}:{searchedCode?:string}){
 const [code,setCode]=useState(searchedCode||"");
 const [custom,setCustom]=useState<ProductInfo[]>([]);
 const [editing,setEditing]=useState(false);
 const [name,setName]=useState(""); const [category,setCategory]=useState("");
 const [features,setFeatures]=useState("");
 const all=[...custom,...initial];
 const product=useMemo(()=>all.find(p=>p.code.toLowerCase()===code.trim().toLowerCase()),[code,custom]);

 function save(){
   const fs=features.split("\n").map(x=>x.trim()).filter(Boolean);
   if(!code.trim()||!name.trim())return;
   setCustom(v=>[{code:code.trim(),name:name.trim(),category:category.trim()||"Produto",features:fs,
     benefits:fs.map(f=>`Transforme "${f}" em uma vantagem ligada à necessidade do cliente.`),
     audience:["Defina pelo que o cliente valoriza no atendimento"],
     arguments:["Pergunte a prioridade do cliente antes de apresentar as características."],
     demonstration:["Mostre fisicamente os recursos mais ligados ao que o cliente pediu."]},...v]);
   setEditing(false);
 }
 return <section className="intelBox">
   <div className="intelHead"><div><span className="step">📦 Módulo 04</span><h3>Ficha Inteligente do Produto</h3></div><button onClick={()=>setEditing(!editing)}>{editing?"Cancelar":"+ Cadastrar ficha"}</button></div>
   <div className="intelSearch"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código do produto"/><span>A ficha pode usar o mesmo código pesquisado na Plataforma Click.</span></div>
   {editing&&<div className="editor">
     <label>Nome<input value={name} onChange={e=>setName(e.target.value)}/></label>
     <label>Categoria<input value={category} onChange={e=>setCategory(e.target.value)}/></label>
     <label className="wide">Características — uma por linha<textarea value={features} onChange={e=>setFeatures(e.target.value)}/></label>
     <button className="primary" onClick={save}>Salvar ficha nesta sessão</button>
   </div>}
   {!product&&!editing&&<div className="emptyIntel"><strong>Ficha ainda não cadastrada</strong><p>Pesquise um código cadastrado ou crie a ficha. Para testar agora: <button onClick={()=>setCode("DEMO-FOGAO")}>DEMO-FOGAO</button> ou <button onClick={()=>setCode("DEMO-LAVADORA")}>DEMO-LAVADORA</button>.</p></div>}
   {product&&<div className="productIntel">
     <div className="productHero"><div><span>{product.category}</span><h4>{product.name}</h4><small>Código {product.code}</small></div></div>
     <div className="intelGrid">
       <article><h5>⚙️ Características</h5><ul>{product.features.map(x=><li key={x}>{x}</li>)}</ul></article>
       <article><h5>❤️ Benefícios</h5><ul>{product.benefits.map(x=><li key={x}>{x}</li>)}</ul></article>
       <article><h5>🎯 Para quem faz sentido</h5><ul>{product.audience.map(x=><li key={x}>{x}</li>)}</ul></article>
       <article><h5>💬 Argumentos de venda</h5><ul>{product.arguments.map(x=><li key={x}>{x}</li>)}</ul></article>
     </div>
     <article className="demoCard"><h5>👀 O que demonstrar no produto</h5><ol>{product.demonstration.map(x=><li key={x}>{x}</li>)}</ol></article>
   </div>}
 </section>
}
