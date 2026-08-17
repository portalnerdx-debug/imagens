import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth } from "./firebase";
import "./styles.css";
import { ProductIntelligence } from "./ProductIntelligence";
import { CustomerInsight } from "./CustomerInsight";
import { SalesCopilot } from "./SalesCopilot";
import { SmartBasket } from "./SmartBasket";
import { ProductBattle } from "./ProductBattle";
import { BudgetCalculator } from "./BudgetCalculator";
import { ShareComparison } from "./ShareComparison";
import { SalesLearning } from "./SalesLearning";
import { SalesTraining } from "./SalesTraining";
import { SellerProgress } from "./SellerProgress";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { ComparisonShare } from "./ComparisonShare";
import { SalesIntelligencePanel } from "./SalesIntelligencePanel";
import { AdaptiveSalesCoach } from "./AdaptiveSalesCoach";
import { SmartClosePanel } from "./SmartClosePanel";
import { LiveProductPanel } from "./LiveProductPanel";
import { LiveProductProvider } from "./LiveProductContext";
import { LiveSalesTools } from "./LiveSalesTools";
import { SmartCatalogPanel } from "./SmartCatalogPanel";
import { SmartCrossSell } from "./SmartCrossSell";
import { CrossSellChain } from "./CrossSellChain";
import { CustomerRadarPanel } from "./CustomerRadarPanel";
import { NeedAwareRecommendations } from "./NeedAwareRecommendations";
import { ClosingCoach } from "./ClosingCoach";
import { ConversationMap } from "./ConversationMap";
import { VoiceCopilot } from "./VoiceCopilot";
import { ObjectionBankPanel } from "./ObjectionBankPanel";
import { PersonalTrainerPanel } from "./PersonalTrainerPanel";
import { CustomerSimulatorPanel } from "./CustomerSimulatorPanel";
import { ProductQuizGamification } from "./ProductQuizGamification";
import { AuthProvider } from "./AuthContext";
import { LoginPanel } from "./LoginPanel";
import { CloudSyncPanel } from "./CloudSyncPanel";
import { CloudAttendanceActions } from "./CloudAttendanceActions";
import { CrediarioSimulator } from "./CrediarioSimulator";
import { SecureProductLookup } from "./SecureProductLookup";
import { SalesHistoryPanel } from "./SalesHistoryPanel";
import { SmartAttendanceGuide } from "./SmartAttendanceGuide";
import { CustomerSignalPanel } from "./CustomerSignalPanel";
import { customerSignalDefinitions, signalNotes, type CustomerSignalId } from "./CustomerSignalModel";
import { buildSmartSaleGuide, type PaymentPreference, type PurchaseTiming, type SalePriority } from "./SmartSaleGuide";

const ROBOT_URL = import.meta.env.VITE_ROBOT_URL || "http://localhost:8081";

const stages = [
  ["abordagem", "Abordagem", "Receba o cliente e descubra o motivo da visita."],
  ["descoberta", "Descoberta", "Entenda necessidade, prioridade, orçamento e pagamento."],
  ["selecao", "Seleção", "Pesquise e separe poucas opções que realmente façam sentido."],
  ["demonstracao", "Demonstração", "Conecte características aos benefícios que o cliente procura."],
  ["negociacao", "Negociação", "Trabalhe objeções, condição e produtos complementares."],
  ["fechamento", "Fechamento", "Confirme a escolha e conduza o próximo passo."]
] as const;

type Stage = typeof stages[number][0];
type ProductResult = { found: boolean; code: string; text: string; url?: string; title?: string };
type Workspace = "atendimento" | "produtos" | "credito" | "fechamento" | "treinamento" | "desempenho";
type HomeTool = "atendimento" | "produto" | "credito" | "treinamento" | "metas" | "historico" | null;

const workspaces: Array<{ id: Workspace; label: string; icon: string; description: string }> = [
  { id: "atendimento", label: "Atendimento", icon: "🤝", description: "Cliente, conversa e recomendações" },
  { id: "produtos", label: "Produtos", icon: "📦", description: "Catálogo, comparação e venda cruzada" },
  { id: "credito", label: "Crédito", icon: "💳", description: "Crediário e simulações" },
  { id: "fechamento", label: "Fechamento", icon: "🎯", description: "Objeções e decisão de compra" },
  { id: "treinamento", label: "Treinamento", icon: "🎓", description: "Prática, quiz e evolução" },
  { id: "desempenho", label: "Desempenho", icon: "📈", description: "Metas, inteligência e resultados" }
];

function ToolGroup({ title, description, children, open = false }: { title: string; description: string; children: React.ReactNode; open?: boolean }) {
  return <details className="toolGroup" open={open}>
    <summary><span><strong>{title}</strong><small>{description}</small></span><b aria-hidden="true">⌄</b></summary>
    <div className="toolGroupBody">{children}</div>
  </details>;
}

function App() {
  const [started, setStarted] = useState(false);
  const [homeTool, setHomeTool] = useState<HomeTool>(null);
  const [customer, setCustomer] = useState("");
  const [objective, setObjective] = useState("");
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState<SalePriority>("");
  const [payment, setPayment] = useState<PaymentPreference>("");
  const [timing, setTiming] = useState<PurchaseTiming>("");
  const [stage, setStage] = useState<Stage>("abordagem");
  const [workspace, setWorkspace] = useState<Workspace>("atendimento");
  const [quickMode, setQuickMode] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [customerSignals, setCustomerSignals] = useState<CustomerSignalId[]>([]);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [searchError, setSearchError] = useState("");

  const currentIndex = stages.findIndex(s => s[0] === stage);
  const current = stages[currentIndex];
  const progress = ((currentIndex + 1) / stages.length) * 100;

  const smartGuide = useMemo(() => buildSmartSaleGuide({
    objective, budget, priority, payment, timing, stage, signals: customerSignals
  }), [objective, budget, priority, payment, timing, stage, customerSignals]);

  const enrichedNotes = useMemo(() => [...notes, ...signalNotes(customerSignals)], [notes, customerSignals]);

  function toggleCustomerSignal(signal: CustomerSignalId) {
    setCustomerSignals(current => current.includes(signal) ? current.filter(item => item !== signal) : [...current, signal]);
  }

  const nextQuestion = smartGuide.question;

  async function searchProduct(e: React.FormEvent) {
    e.preventDefault();
    const productCode = code.trim();
    if (!productCode) {
      setSearchError("Informe o código do produto.");
      return;
    }

    setSearching(true);
    setSearchError("");
    setProduct(null);

    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Faça login no XVendas antes de pesquisar.");

      const token = await user.getIdToken();
      const r = await fetch(`${ROBOT_URL}/api/products/${encodeURIComponent(productCode)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = r.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const body = await r.text();
        throw new Error(`Servidor respondeu em formato inesperado. HTTP ${r.status}. ${body.slice(0, 100)}`);
      }

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Não foi possível pesquisar.");

      setProduct(data);
      if (data.found && stage === "descoberta") setStage("selecao");
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erro na pesquisa.");
    } finally {
      setSearching(false);
    }
  }

  function addNote() {
    const value = note.trim();
    if (!value) return;
    setNotes(v => [...v, value]);
    setNote("");
  }

  if (!started) {
    const homeCards: Array<{id:Exclude<HomeTool,null>;icon:string;title:string;description:string;accent?:boolean}> = [
      {id:"atendimento",icon:"🤝",title:"Novo atendimento",description:"Inicie uma venda guiada do começo ao fechamento.",accent:true},
      {id:"produto",icon:"🔎",title:"Pesquisar produto",description:"Consulte um item rapidamente sem abrir um atendimento."},
      {id:"credito",icon:"💳",title:"Simular crediário",description:"Calcule condições e parcelas para o cliente."},
      {id:"treinamento",icon:"🎓",title:"Treinar vendas",description:"Veja seu foco de treinamento e pratique habilidades."},
      {id:"metas",icon:"📈",title:"Minhas metas",description:"Acompanhe evolução, conversão e desempenho."},
      {id:"historico",icon:"🕘",title:"Histórico",description:"Consulte os atendimentos salvos na nuvem."}
    ];
    return <main className="homeShell">
      <header className="homeTop">
        <div className="homeBrand"><span className="brandMark">XV</span><div><strong>XVendas</strong><small>Seu assistente de vendas</small></div></div>
        <LoginPanel />
      </header>
      <section className="homeHero">
        <div><span className="eyebrow">Painel do vendedor</span><h1>O que você precisa fazer agora?</h1><p>Abra só a ferramenta necessária ou comece um atendimento completo.</p></div>
        <div className="homeHeroBadge"><span>⚡</span><strong>Venda com foco</strong><small>Menos telas. Mais ação.</small></div>
      </section>
      <section className="homeCards" aria-label="Atalhos do XVendas">
        {homeCards.map(card=><button key={card.id} className={card.accent?"homeCard primaryCard":"homeCard"} onClick={()=>setHomeTool(card.id)}>
          <span className="homeCardIcon">{card.icon}</span><span><strong>{card.title}</strong><small>{card.description}</small></span><b>→</b>
        </button>)}
      </section>
      {homeTool&&<section className="homeToolPanel">
        <div className="homeToolHeader"><button className="ghost" onClick={()=>setHomeTool(null)}>← Voltar ao início</button><span>{homeCards.find(c=>c.id===homeTool)?.title}</span></div>
        {homeTool==="atendimento"&&<div className="homeStart"><div><span className="step">🤝 Novo atendimento</span><h2>Comece entendendo o cliente</h2><p>Preencha somente o necessário. Você poderá completar o restante durante a conversa.</p></div><form onSubmit={e => { e.preventDefault(); setWorkspace("atendimento"); setStage("abordagem"); setStarted(true); }} className="startForm">
          <label>Nome do cliente <small>(opcional)</small><input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Ex.: Maria" /></label>
          <label>O que ele procura?<input required value={objective} onChange={e => setObjective(e.target.value)} placeholder="Ex.: fogão para apartamento" /></label>
          <label>Orçamento aproximado <small>(opcional)</small><input value={budget} onChange={e => setBudget(e.target.value)} inputMode="decimal" placeholder="Ex.: 1800" /></label>
          <div className="smartStartFields">
            <label>O que mais pesa na escolha?<select value={priority} onChange={e => setPriority(e.target.value as SalePriority)}><option value="">Descobrir durante a conversa</option><option value="preco">Preço</option><option value="qualidade">Qualidade</option><option value="recursos">Recursos/funções</option><option value="parcela">Valor da parcela</option><option value="durabilidade">Durabilidade</option></select></label>
            <label>Como pensa em pagar?<select value={payment} onChange={e => setPayment(e.target.value as PaymentPreference)}><option value="">Ainda não perguntei</option><option value="pix">À vista / Pix</option><option value="cartao">Cartão</option><option value="crediario">Crediário / parcelado</option><option value="indefinido">Ainda não sabe</option></select></label>
            <label>Momento de compra<select value={timing} onChange={e => setTiming(e.target.value as PurchaseTiming)}><option value="">Ainda não sei</option><option value="hoje">Quer comprar hoje</option><option value="pesquisando">Está pesquisando</option><option value="orcamento">Quer só orçamento</option></select></label>
          </div>
          <p className="smartStartHint">⚡ Esses campos são opcionais. Quando preenchidos, o XVendas adapta perguntas, argumentos e próximos passos.</p>
          <button className="primary">Iniciar atendimento inteligente →</button>
        </form></div>}
        {homeTool==="produto"&&<SecureProductLookup />}
        {homeTool==="credito"&&<CrediarioSimulator />}
        {homeTool==="treinamento"&&<PersonalTrainerPanel notes={[]} objective="" budget="" stage="Início" />}
        {homeTool==="metas"&&<><SellerProgress /><PerformanceDashboard /></>}
        {homeTool==="historico"&&<SalesHistoryPanel />}
      </section>}
      <footer className="homeFooter"><span>XVendas</span><small>Use o atendimento guiado quando estiver com o cliente; use os atalhos para consultas rápidas.</small></footer>
    </main>;
  }

  const activeWorkspace = workspaces.find(item => item.id === workspace)!;

  return <main className={quickMode ? "appShell quickModeShell" : "appShell"}>
    <aside className="appSidebar">
      <div className="brandBlock"><span className="brandMark">XV</span><div><strong>XVendas</strong><small>Assistente de vendas</small></div></div>
      <nav className="sidebarNav" aria-label="Áreas do XVendas">
        {workspaces.map(item => <button key={item.id} className={workspace === item.id ? "sidebarItem active" : "sidebarItem"} onClick={() => setWorkspace(item.id)}>
          <span className="sidebarIcon" aria-hidden="true">{item.icon}</span>
          <span><strong>{item.label}</strong><small>{item.description}</small></span>
        </button>)}
      </nav>
      <div className="sidebarFooter"><span>Atendimento atual</span><strong>{customer || "Cliente"}</strong><small>{objective}</small></div>
    </aside>

    <section className="appMain">
      <header className="top appTop">
        <div><span className="eyebrow">Atendimento em andamento</span><h1>{customer || "Cliente"} <small>• {objective}</small></h1></div>
        <div className="topActions">
          <button className={quickMode ? "quickModeToggle active" : "quickModeToggle"} onClick={() => setQuickMode(value => !value)}>{quickMode ? "☰ Modo completo" : "⚡ Modo rápido"}</button>
          <button className="ghost" onClick={() => { setStarted(false); setHomeTool(null); setQuickMode(false); }}>Encerrar</button>
        </div>
      </header>

      <nav className="mobileWorkspaceNav" aria-label="Áreas do XVendas">
        {workspaces.map(item => <button key={item.id} className={workspace === item.id ? "mobileWorkspace active" : "mobileWorkspace"} onClick={() => setWorkspace(item.id)}><span>{item.icon}</span>{item.label}</button>)}
      </nav>

      <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      <section className="stageNav" aria-label="Etapas do atendimento">
        {stages.map(([id, label], i) => <button key={id} className={stage === id ? "stage active" : "stage"} onClick={() => setStage(id)}><b>{i + 1}</b><span>{label}</span></button>)}
      </section>

      <section className="contextStrip">
        <article><small>Área atual</small><strong>{activeWorkspace.icon} {activeWorkspace.label}</strong></article>
        <article><small>Etapa</small><strong>{currentIndex + 1}/{stages.length} · {current[1]}</strong></article>
        <article><small>Orçamento</small><strong>{budget ? `R$ ${budget}` : "Não informado"}</strong></article>
        <article><small>Anotações</small><strong>{notes.length} registro{notes.length === 1 ? "" : "s"}</strong></article>
      </section>

      <section className="layout">
        <article className="mainCard">
          <div className="flowHeader">
            <div><span className="step">Etapa {currentIndex + 1} de {stages.length}</span><h2>{current[1]}</h2><p className="guidance">{current[2]}</p></div>
            <span className="areaBadge">{activeWorkspace.icon} {activeWorkspace.label}</span>
          </div>

          <div className="question"><span>❓ Pergunta sugerida</span><strong>{nextQuestion}</strong></div>

          {quickMode && <section className="quickFocusCard">
            <div className="quickFocusHead"><span>⚡ Atendimento rápido</span><strong>{current[1]}</strong></div>
            <p>{smartGuide.nextAction}</p>
            <div className="quickFacts">
              <span><small>Cliente</small><b>{customer || "Não informado"}</b></span>
              <span><small>Objetivo</small><b>{objective}</b></span>
              <span><small>Orçamento</small><b>{budget ? `R$ ${budget}` : "A descobrir"}</b></span>
            </div>
          </section>}

          <CustomerSignalPanel signals={customerSignals} onToggle={toggleCustomerSignal} />

          <SmartAttendanceGuide guide={smartGuide} />

          <section className="productSearch quickSearch advancedDuringSale">
            <div><span className="step">🔎 Atalho rápido</span><h3>Buscar produto pelo código</h3></div>
            <form onSubmit={searchProduct} className="searchRow">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="Digite o código do produto" required />
              <button className="primary" disabled={searching}>{searching ? "Pesquisando..." : "Pesquisar"}</button>
            </form>
            {searchError && <div className="error">{searchError}</div>}
            {product && <div className={product.found ? "productResult found" : "productResult"}>
              <strong>{product.found ? "Produto localizado" : "Produto não localizado"}</strong><span>Código: {product.code}</span>{product.text && <p>{product.text}</p>}
            </div>}
          </section>

          <section className="workspaceContent advancedDuringSale">
            <div className="workspaceHeading"><div><span className="step">Ferramentas</span><h3>{activeWorkspace.label}</h3></div><p>{activeWorkspace.description}</p></div>

            {workspace === "atendimento" && <>
              <ToolGroup title="Cliente e contexto" description="Resumo, radar e recomendações para conduzir a conversa." open><CustomerRadarPanel notes={enrichedNotes} objective={objective} budget={budget} /><NeedAwareRecommendations notes={enrichedNotes} objective={objective} budget={budget} /><CustomerInsight notes={enrichedNotes} objective={objective} budget={budget} stage={current[1]} /></ToolGroup>
              <ToolGroup title="Copiloto de atendimento" description="Mapa da conversa, voz e sugestões durante a venda."><ConversationMap notes={enrichedNotes} objective={objective} budget={budget} stage={current[1]} /><VoiceCopilot onTranscript={text => setNotes(v => [...v, text])} /><SalesCopilot notes={enrichedNotes} objective={objective} budget={budget} stage={current[1]} /></ToolGroup>
              <ToolGroup title="Nuvem e registro" description="Sincronização e ações do atendimento."><CloudSyncPanel /><CloudAttendanceActions customerName={customer} objective={objective} budget={budget} stage={current[1]} notes={enrichedNotes} productCode={product?.code || code} /></ToolGroup>
            </>}

            {workspace === "produtos" && <>
              <ToolGroup title="Produto atual" description="Consulte informações e inteligência do item em atendimento." open><LiveProductPanel defaultCode={product?.code || code} /><ProductIntelligence searchedCode={product?.code || code} /><SecureProductLookup /></ToolGroup>
              <ToolGroup title="Recomendação e cesta" description="Encontre alternativas e oportunidades de venda complementar."><SmartCatalogPanel /><LiveSalesTools /><SmartBasket objective={objective} budget={budget} searchedCode={product?.code || code} /><SmartCrossSell /><CrossSellChain /></ToolGroup>
              <ToolGroup title="Comparação e orçamento" description="Compare opções, calcule orçamento e compartilhe com o cliente."><ProductBattle budget={budget} /><BudgetCalculator initialBudget={budget} /><ShareComparison /><ComparisonShare /></ToolGroup>
            </>}

            {workspace === "credito" && <><ToolGroup title="Simulações de crédito" description="Crediário, parcelas e condições para o cliente." open><CrediarioSimulator /></ToolGroup></>}

            {workspace === "fechamento" && <>
              <ToolGroup title="Condução do fechamento" description="Sinais, objeções e próxima melhor ação." open><ClosingCoach notes={enrichedNotes} stage={current[1]} budget={budget} /><AdaptiveSalesCoach notes={enrichedNotes} objective={objective} budget={budget} /></ToolGroup>
              <ToolGroup title="Objeções e decisão" description="Respostas de apoio e fechamento estruturado."><ObjectionBankPanel stage={current[1]} /><SmartClosePanel notes={enrichedNotes} objective={objective} budget={budget} stage={current[1]} /></ToolGroup>
            </>}

            {workspace === "treinamento" && <>
              <ToolGroup title="Treino personalizado" description="Pratique situações de atendimento e receba orientação." open><PersonalTrainerPanel notes={enrichedNotes} objective={objective} budget={budget} stage={current[1]} /><CustomerSimulatorPanel /></ToolGroup>
              <ToolGroup title="Aprendizado e quiz" description="Teste conhecimento e acompanhe sua evolução."><ProductQuizGamification /><SalesLearning notes={enrichedNotes} /><SalesTraining /></ToolGroup>
            </>}

            {workspace === "desempenho" && <><ToolGroup title="Resultados e evolução" description="Acompanhe progresso, métricas e inteligência de vendas." open><SellerProgress /><PerformanceDashboard /><SalesIntelligencePanel /></ToolGroup></>}
          </section>

          <section className="notesSection">
            <div className="notesHeader"><div><span className="step">Memória do atendimento</span><h3>Anotações do cliente</h3></div><span>{notes.length} registro{notes.length === 1 ? "" : "s"}</span></div>
            <label className="notesLabel">{quickMode ? "Registre só o essencial" : "Anote o que o cliente disse"}</label>
            <div className="noteRow"><textarea value={note} onChange={e => setNote(e.target.value)} placeholder={quickMode ? "Ex.: quer entrega hoje, prefere inox..." : "Preferências, objeções, necessidades..."} /><button onClick={addNote}>Adicionar</button></div>
          </section>

          <div className="actions stickyActions">
            <button onClick={() => currentIndex > 0 && setStage(stages[currentIndex - 1][0])} disabled={currentIndex === 0}>← Voltar</button>
            <button className="primary" onClick={() => currentIndex < stages.length - 1 && setStage(stages[currentIndex + 1][0])} disabled={currentIndex === stages.length - 1}>Próxima etapa →</button>
          </div>
        </article>

        <aside className="contextAside">
          <section className="sideCard"><span className="sideEyebrow">Cliente</span><h3>Resumo</h3><dl><div><dt>Objetivo</dt><dd>{objective}</dd></div><div><dt>Orçamento</dt><dd>{budget ? `R$ ${budget}` : "Não informado"}</dd></div>{priority && <div><dt>Prioridade</dt><dd>{{preco:"Preço",qualidade:"Qualidade",recursos:"Recursos",parcela:"Parcela",durabilidade:"Durabilidade"}[priority]}</dd></div>}{payment && <div><dt>Pagamento</dt><dd>{{pix:"À vista / Pix",cartao:"Cartão",crediario:"Crediário",indefinido:"Indefinido"}[payment]}</dd></div>}<div><dt>Etapa</dt><dd>{current[1]}</dd></div>{customerSignals.length > 0 && <div><dt>Sinais</dt><dd className="sideSignalList">{customerSignals.map(id => customerSignalDefinitions.find(signal => signal.id === id)).filter(Boolean).map(signal => <span key={signal!.id}>{signal!.icon} {signal!.label}</span>)}</dd></div>}{product?.found && <div><dt>Produto</dt><dd>{product.code}</dd></div>}</dl></section>
          <section className="sideCard next"><span>➡️ Próxima melhor ação</span><strong>{currentIndex < stages.length - 1 ? `Conclua ${current[1].toLowerCase()} e avance para ${stages[currentIndex + 1][1].toLowerCase()}.` : "Peça a confirmação da escolha e conduza o fechamento."}</strong></section>
          <section className="sideCard"><span className="sideEyebrow">Conversa</span><h3>Pontos registrados</h3>{notes.length === 0 ? <p className="muted">As informações importantes aparecerão aqui.</p> : <ul>{notes.slice(-5).map((n, i) => <li key={`${i}-${n}`}>{n}</li>)}</ul>}</section>
        </aside>
      </section>
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <LiveProductProvider>
        <App />
      </LiveProductProvider>
    </AuthProvider>
  </React.StrictMode>
);
