import cors from "cors";
import express from "express";
import crypto from "node:crypto";

type Stage = "abordagem" | "descoberta" | "selecao" | "demonstracao" | "negociacao" | "fechamento";
type Session = {
  id: string;
  customerName?: string;
  objective: string;
  budget?: number;
  stage: Stage;
  status: "em_atendimento" | "fechada" | "perdida";
  products: Array<{code:string; name?:string; price?:number}>;
  notes: Array<{id:string; text:string; createdAt:string}>;
  startedAt: string;
  updatedAt: string;
};

const app = express();
const port = Number(process.env.PORT || 8080);
const sessions = new Map<string, Session>();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "xvendas-api", stage: 1 }));

app.post("/api/atendimentos", (req, res) => {
  const now = new Date().toISOString();
  const session: Session = {
    id: crypto.randomUUID(),
    customerName: String(req.body?.customerName || "").trim() || undefined,
    objective: String(req.body?.objective || "").trim(),
    budget: Number(req.body?.budget) > 0 ? Number(req.body.budget) : undefined,
    stage: "abordagem",
    status: "em_atendimento",
    products: [],
    notes: [],
    startedAt: now,
    updatedAt: now
  };
  sessions.set(session.id, session);
  res.status(201).json(session);
});

app.get("/api/atendimentos/:id", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error:"Atendimento não encontrado."});
  res.json(session);
});

app.patch("/api/atendimentos/:id/etapa", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error:"Atendimento não encontrado."});
  const allowed: Stage[] = ["abordagem","descoberta","selecao","demonstracao","negociacao","fechamento"];
  const stage = req.body?.stage as Stage;
  if (!allowed.includes(stage)) return res.status(400).json({error:"Etapa inválida."});
  session.stage = stage;
  session.updatedAt = new Date().toISOString();
  res.json(session);
});

app.post("/api/atendimentos/:id/notas", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error:"Atendimento não encontrado."});
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({error:"Informe a nota."});
  session.notes.push({id:crypto.randomUUID(), text, createdAt:new Date().toISOString()});
  session.updatedAt = new Date().toISOString();
  res.status(201).json(session);
});

app.post("/api/atendimentos/:id/finalizar", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error:"Atendimento não encontrado."});
  const status = req.body?.status;
  if (!["fechada","perdida"].includes(status)) return res.status(400).json({error:"Resultado inválido."});
  session.status = status;
  session.stage = "fechamento";
  session.updatedAt = new Date().toISOString();
  res.json(session);
});


const productKnowledge = new Map<string, any>();

app.get("/api/produtos/:code/ficha", (req, res) => {
  const item=productKnowledge.get(req.params.code.toLowerCase());
  if(!item) return res.status(404).json({error:"Ficha ainda não cadastrada."});
  res.json(item);
});

app.put("/api/produtos/:code/ficha", (req, res) => {
  const code=req.params.code.trim();
  if(!code) return res.status(400).json({error:"Código obrigatório."});
  const item={...req.body,code,updatedAt:new Date().toISOString()};
  productKnowledge.set(code.toLowerCase(),item);
  res.json(item);
});


app.post("/api/insights/customer", (req, res) => {
  const text = [req.body?.objective, ...(Array.isArray(req.body?.notes) ? req.body.notes : [])]
    .filter(Boolean).join(" ").toLowerCase();

  const groups = {
    preco:["barato","preço","valor","economizar","promoção","desconto"],
    parcela:["parcela","parcelar","vezes","crediário","entrada"],
    qualidade:["qualidade","durável","resistente","marca","confiável"],
    tecnologia:["tecnologia","smart","wifi","app","função","recurso"],
    praticidade:["prático","fácil","limpar","limpeza","rápido","simples"],
    espaco:["pequeno","compacto","espaço","apartamento","medida"],
    urgencia:["hoje","agora","urgente","quebrou"]
  };

  const signals = Object.entries(groups).map(([id, words]) => {
    const evidence = words.filter(word => text.includes(word));
    return { id, score: Math.min(100, evidence.length * 28), evidence };
  }).filter(item => item.score > 0).sort((a,b)=>b.score-a.score);

  res.json({
    primary: signals[0]?.id || null,
    secondary: signals[1]?.id || null,
    signals,
    engine: "rules-v1"
  });
});


app.post("/api/copilot/objection", (req, res) => {
  const said=String(req.body?.said||"").toLowerCase();
  const rules=[
    {keys:["caro","preço alto"],type:"preco",reply:"Antes de olhar só o valor, confirme o que é indispensável para o cliente."},
    {keys:["vou pensar"],type:"adiamento",reply:"Pergunte o que ainda precisa ser avaliado antes da decisão."},
    {keys:["parcela alta"],type:"parcela",reply:"Pergunte qual faixa de parcela fica confortável."},
    {keys:["outra loja","pesquisar"],type:"comparacao",reply:"Descubra o que o cliente pretende comparar e faça uma comparação objetiva."}
  ];
  const match=rules.find(r=>r.keys.some(k=>said.includes(k)));
  res.json(match||{type:"desconhecida",reply:"Faça uma pergunta curta para descobrir a objeção real."});
});


app.post("/api/cross-sell/suggest", (req, res) => {
  const category=String(req.body?.category||"").toLowerCase();
  const map:Record<string,string[]>={
    "fogão":["Armário de cozinha","Mesa","Depurador/Coifa"],
    "geladeira":["Micro-ondas","Armário de cozinha","Mesa"],
    "lavadora":["Armário multiuso","Tanquinho"],
    "tv":["Rack/Painel","Sofá"],
    "cama":["Colchão","Guarda-roupa"]
  };
  res.json({category,suggestions:map[category]||[],engine:"rules-v1"});
});


app.post("/api/comparisons/score", (req, res) => {
  const budget=Number(req.body?.budget||0);
  const products=Array.isArray(req.body?.products)?req.body.products:[];
  const scored=products.map((p:any)=>{
    const price=Number(p.price||0);
    let score=50;
    if(budget>0&&price>0) score+=price<=budget?20:-25;
    return {...p,score:Math.max(0,Math.min(100,score))};
  });
  res.json({products:scored,engine:"rules-v1"});
});

app.post("/api/budget/calculate", (req, res) => {
  const values=(Array.isArray(req.body?.values)?req.body.values:[]).map(Number).filter(Number.isFinite);
  const total=values.reduce((a:number,b:number)=>a+b,0);
  const budget=Number(req.body?.budget||0);
  res.json({total,remaining:budget?budget-total:null});
});


const objectionHistory:any[]=[];
const lostSaleHistory:any[]=[];

app.post("/api/learning/objections", (req,res)=>{
  const item={id:crypto.randomUUID(),...req.body,createdAt:new Date().toISOString()};
  objectionHistory.push(item);
  res.status(201).json(item);
});
app.get("/api/learning/objections", (_req,res)=>res.json(objectionHistory));

app.post("/api/learning/lost-sales", (req,res)=>{
  const item={id:crypto.randomUUID(),...req.body,createdAt:new Date().toISOString()};
  lostSaleHistory.push(item);
  res.status(201).json(item);
});
app.get("/api/learning/lost-sales", (_req,res)=>res.json(lostSaleHistory));


app.post("/api/training/evaluate", (req,res)=>{
  const messages=Array.isArray(req.body?.messages)?req.body.messages:[];
  const seller=messages.filter((x:any)=>x.from==="vendedor").map((x:any)=>String(x.text||"").toLowerCase());
  const joined=seller.join(" ");
  const questions=seller.filter((x:string)=>x.includes("?")).length;
  const empathy=["entendo","claro","sem problema","faz sentido"].some(x=>joined.includes(x));
  const discovery=["importante","procura","precisa","orçamento","parcela","espaço","prioridade"].filter(x=>joined.includes(x)).length;
  const approach=Math.min(10,5+(empathy?2:0)+(questions?2:0));
  const discoveryScore=Math.min(10,3+questions+discovery);
  const argument=Math.min(10,4+Math.floor(discovery/2)+(seller.length>=3?2:0));
  const closing=Math.min(10,3+(joined.includes("podemos")?2:0)+(joined.includes("seguir")?2:0));
  res.json({approach,discovery:discoveryScore,argument,closing,total:(approach+discoveryScore+argument+closing)/4,engine:"rules-v1"});
});


const sellerProgress={xp:0,streak:1,goals:{sales:10,ticket:1500,extras:5}};

app.get("/api/progress/profile", (_req,res)=>res.json(sellerProgress));
app.patch("/api/progress/profile", (req,res)=>{
  Object.assign(sellerProgress,req.body||{});
  res.json(sellerProgress);
});
app.post("/api/progress/xp", (req,res)=>{
  sellerProgress.xp+=Math.max(0,Number(req.body?.amount||0));
  res.json(sellerProgress);
});


const performanceSales:any[]=[];

app.post("/api/performance/sales",(req,res)=>{
 const item={id:crypto.randomUUID(),...req.body,createdAt:new Date().toISOString()};
 performanceSales.push(item);res.status(201).json(item);
});
app.get("/api/performance/sales",(_req,res)=>res.json(performanceSales));
app.get("/api/performance/summary",(_req,res)=>{
 const closed=performanceSales.filter(x=>x.closed);
 const revenue=closed.reduce((s,x)=>s+Number(x.value||0),0);
 res.json({
  attendances:performanceSales.length,
  closed:closed.length,
  conversion:performanceSales.length?closed.length/performanceSales.length:0,
  revenue,
  averageTicket:closed.length?revenue/closed.length:0
 });
});

app.listen(port, () => console.log(`XVendas API em http://localhost:${port}`));
