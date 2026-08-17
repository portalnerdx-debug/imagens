import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth } from "./firebase";
import "./styles.css";
import "./app-layout.css";
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
import { AppIcon, type AppIconName } from "./AppIcon";

const ROBOT_URL = (import.meta.env.VITE_ROBOT_URL || "https://xvendas-robot.onrender.com").replace(/\/$/, "");

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

type HomeCard = { id: Exclude<HomeTool, null>; icon: AppIconName; title: string; shortTitle: string; description: string; eyebrow: string; featured?: boolean };

const homeCards: HomeCard[] = [
  { id: "atendimento", icon: "sale", title: "Novo atendimento", shortTitle: "Atender", eyebrow: "Venda guiada", description: "Conduza a conversa do primeiro contato até o fechamento.", featured: true },
  { id: "produto", icon: "search", title: "Pesquisar produto", shortTitle: "Produtos", eyebrow: "Consulta rápida", description: "Consulte preço, estoque, voltagem e informações do produto." },
  { id: "credito", icon: "credit", title: "Simular crediário", shortTitle: "Crédito", eyebrow: "CT1, CT2 e 48", description: "Prepare entrada, parcelas e condições para o cliente." },
  { id: "historico", icon: "history", title: "Histórico", shortTitle: "Histórico", eyebrow: "Atendimentos", description: "Continue acompanhando as conversas salvas na nuvem." },
  { id: "treinamento", icon: "training", title: "Treinar vendas", shortTitle: "Treinar", eyebrow: "Desenvolvimento", description: "Pratique abordagens e evolua suas habilidades comerciais." },
  { id: "metas", icon: "goals", title: "Metas e desempenho", shortTitle: "Metas", eyebrow: "Resultados", description: "Acompanhe evolução, conversão e desempenho de vendas." }
];

const routeByTool: Record<Exclude<HomeTool, null>, string> = {
  atendimento: "atendimento", produto: "produtos", credito: "credito", treinamento: "treinamento", metas: "metas", historico: "historico"
};

function toolFromHash(): HomeTool {
  const route = window.location.hash.replace(/^#\/?/, "").split("/")[0];
  return (Object.entries(routeByTool).find(([, value]) => value === route)?.[0] as HomeTool) || null;
}

function PortalFrame({ active, onNavigate, children }: { active: HomeTool; onNavigate: (tool: HomeTool) => void; children: React.ReactNode }) {
  const activeCard = homeCards.find(card => card.id === active);
  return <main className="portalShell">
    <aside className="portalSidebar">
      <button className="portalBrand" onClick={() => onNavigate(null)} aria-label="Ir para o início"><span className="brandMark">XV</span><span><strong>XVendas</strong><small>Venda com inteligência</small></span></button>
      <nav className="portalNav" aria-label="Menu principal">
        <button className={!active ? "portalNavItem active" : "portalNavItem"} onClick={() => onNavigate(null)}><AppIcon name="home"/><span>Início</span></button>
        {homeCards.map(card => <button key={card.id} className={active === card.id ? "portalNavItem active" : "portalNavItem"} onClick={() => onNavigate(card.id)}><AppIcon name={card.icon}/><span>{card.shortTitle}</span></button>)}
      </nav>
      <div className="portalSidebarTip"><AppIcon name="spark"/><div><strong>Dica rápida</strong><small>Use o atendimento guiado quando estiver falando com o cliente.</small></div></div>
    </aside>
    <section className="portalViewport">
      <header className="portalTopbar">
        <button className="portalMobileBrand" onClick={() => onNavigate(null)}><span className="brandMark">XV</span><strong>XVendas</strong></button>
        <div className="portalBreadcrumb"><small>{activeCard ? activeCard.eyebrow : "Painel do vendedor"}</small><strong>{activeCard?.title || "Visão geral"}</strong></div>
        <LoginPanel />
      </header>
      <div className="portalPage">{children}</div>
      <nav className="portalBottomNav" aria-label="Navegação do aplicativo">
        <button className={!active ? "active" : ""} onClick={() => onNavigate(null)}><AppIcon name="home"/><span>Início</span></button>
        {homeCards.slice(0, 3).map(card => <button key={card.id} className={active === card.id ? "active" : ""} onClick={() => onNavigate(card.id)}><AppIcon name={card.icon}/><span>{card.shortTitle}</span></button>)}
        <button className={active === "historico" ? "active" : ""} onClick={() => onNavigate("historico")}><AppIcon name="history"/><span>Histórico</span></button>
      </nav>
    </section>
  </main>;
}

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
  const [homeTool, setHomeTool] = useState<HomeTool>(() => toolFromHash());
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

  useEffect(() => {
    const syncRoute = () => {
      const route = window.location.hash.replace(/^#\/?/, "").split("/")[0];
      if (route !== "venda") {
        setStarted(false);
        setHomeTool(toolFromHash());
      }
    };
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  function navigatePortal(tool: HomeTool) {
    setHomeTool(tool);
    const route = tool ? `/${routeByTool[tool]}` : "/";
    if (window.location.hash !== `#${route}`) window.location.hash = route;
  }

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
    if (homeTool) {
      const activeCard = homeCards.find(card => card.id === homeTool)!;
      return <PortalFrame active={homeTool} onNavigate={navigatePortal}>
        <section className={`toolPage toolPage-${homeTool}`}>
          <header className="toolPageHero">
            <button className="pageBack" onClick={() => navigatePortal(null)}>← Voltar para o início</button>
            <div className="toolPageTitle"><span className="toolPageIcon"><AppIcon name={activeCard.icon} size={28}/></span><div><span className="eyebrow">{activeCard.eyebrow}</span><h1>{activeCard.title}</h1><p>{activeCard.description}</p></div></div>
          </header>
          <div className="toolPageSurface">
            {homeTool === "atendimento" && <div className="newSalePage"><aside><span className="step">Atendimento inteligente</span><h2>Entenda primeiro.<br/>Venda melhor.</h2><p>Comece com o que você já sabe. O XVendas orienta as próximas perguntas durante a conversa.</p><div className="saleSteps"><span><b>1</b> Identifique a necessidade</span><span><b>2</b> Compare as melhores opções</span><span><b>3</b> Conduza até o fechamento</span></div></aside><form onSubmit={e => { e.preventDefault(); setWorkspace("atendimento"); setStage("abordagem"); setStarted(true); window.location.hash = "/venda"; }} className="startForm appForm">
              <div className="formSectionTitle"><strong>Informações iniciais</strong><small>Leva menos de um minuto</small></div>
              <label>Nome do cliente <small>(opcional)</small><input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Ex.: Maria" /></label>
              <label>O que ele procura?<input required value={objective} onChange={e => setObjective(e.target.value)} placeholder="Ex.: fogão para apartamento" /></label>
              <label>Orçamento aproximado <small>(opcional)</small><input value={budget} onChange={e => setBudget(e.target.value)} inputMode="decimal" placeholder="Ex.: 1800" /></label>
              <div className="smartStartFields">
                <label>Prioridade<select value={priority} onChange={e => setPriority(e.target.value as SalePriority)}><option value="">Descobrir na conversa</option><option value="preco">Preço</option><option value="qualidade">Qualidade</option><option value="recursos">Recursos/funções</option><option value="parcela">Valor da parcela</option><option value="durabilidade">Durabilidade</option></select></label>
                <label>Pagamento<select value={payment} onChange={e => setPayment(e.target.value as PaymentPreference)}><option value="">Ainda não perguntei</option><option value="pix">À vista / Pix</option><option value="cartao">Cartão</option><option value="crediario">Crediário / parcelado</option><option value="indefinido">Ainda não sabe</option></select></label>
                <label>Momento da compra<select value={timing} onChange={e => setTiming(e.target.value as PurchaseTiming)}><option value="">Ainda não sei</option><option value="hoje">Quer comprar hoje</option><option value="pesquisando">Está pesquisando</option><option value="orcamento">Quer só orçamento</option></select></label>
              </div>
              <p className="smartStartHint"><AppIcon name="spark" size={16}/> Campos opcionais deixam as sugestões mais personalizadas.</p>
              <button className="primary appPrimaryAction">Iniciar atendimento <AppIcon name="arrow" size={19}/></button>
            </form></div>}
            {homeTool === "produto" && <SecureProductLookup />}
            {homeTool === "credito" && <CrediarioSimulator />}
            {homeTool === "treinamento" && <PersonalTrainerPanel notes={[]} objective="" budget="" stage="Início" />}
            {homeTool === "metas" && <div className="stackedTools"><SellerProgress /><PerformanceDashboard /></div>}
            {homeTool === "historico" && <SalesHistoryPanel />}
          </div>
        </section>
      </PortalFrame>;
    }

    return <PortalFrame active={null} onNavigate={navigatePortal}>
      <section className="dashboardHero">
        <div className="dashboardHeroCopy"><span className="eyebrow">Seu assistente de vendas</span><h1>Bom trabalho começa com a ferramenta certa.</h1><p>Escolha o que precisa fazer. Cada função abre em uma tela própria, pronta para usar.</p><button className="heroAction" onClick={() => navigatePortal("atendimento")}><span>Começar atendimento</span><AppIcon name="arrow"/></button></div>
        <div className="dashboardVisual" aria-hidden="true"><div className="visualGlow"/><div className="visualCard main"><span><AppIcon name="spark"/></span><small>Próxima ação</small><strong>Descubra a prioridade do cliente</strong></div><div className="visualCard product"><AppIcon name="search"/><span><small>Produto</small><strong>Consulta rápida</strong></span></div><div className="visualCard credit"><AppIcon name="credit"/><span><small>Crediário</small><strong>CT1 • CT2 • 48</strong></span></div></div>
      </section>

      <section className="dashboardSection">
        <div className="sectionHeading"><div><span>Acesso rápido</span><h2>O que vamos fazer agora?</h2></div><small>Selecione uma função para abrir</small></div>
        <div className="appCardGrid">
          {homeCards.map((card, index) => <button key={card.id} className={`appFeatureCard ${card.featured ? "featured" : ""}`} onClick={() => navigatePortal(card.id)} style={{ "--card-order": index } as React.CSSProperties}>
            <span className="featureIcon"><AppIcon name={card.icon} size={25}/></span><span className="featureText"><small>{card.eyebrow}</small><strong>{card.title}</strong><p>{card.description}</p></span><span className="featureArrow"><AppIcon name="arrow" size={20}/></span>
          </button>)}
        </div>
      </section>

      <section className="dashboardFooterCard"><div className="footerCardIcon"><AppIcon name="spark" size={26}/></div><div><small>Fluxo recomendado</small><strong>Atendimento → Produto → Crédito → Fechamento</strong><p>Use o atendimento completo para manter as informações do cliente organizadas durante toda a venda.</p></div><button onClick={() => navigatePortal("atendimento")}>Abrir atendimento</button></section>
    </PortalFrame>;
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
          <button className="ghost" onClick={() => { setStarted(false); setQuickMode(false); navigatePortal(null); }}>Encerrar</button>
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
