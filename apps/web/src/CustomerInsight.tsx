import React, { useMemo } from "react";

type Props = {
  notes: string[];
  objective: string;
  budget?: string;
  stage: string;
};

type Signal = {
  id: string;
  label: string;
  score: number;
  evidence: string[];
};

const dictionaries = {
  preco: ["barato","preço","valor","economizar","promoção","desconto","mais em conta","custo"],
  parcela: ["parcela","parcelar","vezes","crediário","entrada","por mês","mensal"],
  qualidade: ["qualidade","durável","durar","resistente","marca","confiável","melhor"],
  tecnologia: ["tecnologia","smart","wifi","app","função","recurso","digital","painel"],
  praticidade: ["prático","prática","fácil","facilidade","limpar","limpeza","rápido","simples"],
  capacidade: ["grande","maior","capacidade","litros","kg","família","muita roupa","muita comida"],
  espaco: ["pequeno","compacto","espaço","apartamento","medida","cabe","largura","altura"],
  urgencia: ["hoje","agora","urgente","preciso logo","quebrou","sem","necessito"]
};

const labels: Record<string,string> = {
  preco: "Foco em preço",
  parcela: "Foco em parcela",
  qualidade: "Foco em qualidade",
  tecnologia: "Perfil técnico/recursos",
  praticidade: "Busca praticidade",
  capacidade: "Busca capacidade",
  espaco: "Restrição de espaço",
  urgencia: "Compra urgente"
};

function analyze(text: string): Signal[] {
  const lower = text.toLowerCase();
  return Object.entries(dictionaries).map(([id, words]) => {
    const evidence = words.filter(w => lower.includes(w));
    return {
      id,
      label: labels[id],
      score: Math.min(100, evidence.length * 28),
      evidence
    };
  }).filter(x => x.score > 0).sort((a,b)=>b.score-a.score);
}

export function CustomerInsight({notes, objective, budget, stage}: Props) {
  const allText = [objective, ...notes].join(" ");
  const signals = useMemo(()=>analyze(allText),[allText]);

  const primary = signals[0];
  const secondary = signals[1];

  const hiddenNeeds = useMemo(() => {
    const result: string[] = [];

    if (primary?.id === "preco" || primary?.id === "parcela") {
      result.push("Pergunte o valor máximo de parcela confortável e se existe entrada disponível.");
    }
    if (signals.some(s=>s.id==="espaco")) {
      result.push("Confirme as medidas do local antes de recomendar o produto.");
    }
    if (signals.some(s=>s.id==="capacidade")) {
      result.push("Pergunte quantas pessoas usam o produto e com que frequência.");
    }
    if (signals.some(s=>s.id==="praticidade")) {
      result.push("Procure produtos fáceis de usar, limpar e manter.");
    }
    if (signals.some(s=>s.id==="tecnologia")) {
      result.push("Descubra quais recursos realmente serão usados para evitar vender função sem valor.");
    }
    if (signals.some(s=>s.id==="urgencia")) {
      result.push("Priorize disponibilidade imediata e opções que resolvam hoje.");
    }
    if (!result.length) {
      result.push("Pergunte o que faria o cliente dizer: “é esse que eu quero”.");
      result.push("Descubra se existe limite de espaço, orçamento ou parcela.");
    }

    return result;
  }, [signals]);

  const suggestedQuestion = useMemo(() => {
    if (primary?.id === "preco") return "Além do preço, o que esse produto precisa ter para valer a pena para você?";
    if (primary?.id === "parcela") return "Qual valor de parcela fica confortável no seu orçamento?";
    if (primary?.id === "qualidade") return "O que faz você considerar um produto realmente bom: durabilidade, marca ou desempenho?";
    if (primary?.id === "tecnologia") return "Qual recurso você realmente pretende usar no dia a dia?";
    if (primary?.id === "praticidade") return "O que mais incomoda no produto que você usa hoje?";
    if (primary?.id === "capacidade") return "Quantas pessoas vão usar e qual é o volume normal de uso?";
    if (primary?.id === "espaco") return "Você sabe as medidas máximas do espaço onde o produto vai ficar?";
    if (primary?.id === "urgencia") return "Você precisa levar/resolver isso hoje ou pode esperar por outra opção?";
    return "O que é mais importante para você nessa compra?";
  }, [primary]);

  const temperature = useMemo(() => {
    const text = allText.toLowerCase();
    const hot = ["vou levar","quero esse","fecha","pode fazer","quanto fica","tem estoque","entrega quando","10x","12x"];
    const warm = ["gostei","interessante","qual a diferença","quanto custa","parcela","garantia"];
    if (hot.some(x=>text.includes(x))) return {label:"Quente",className:"hot"};
    if (warm.some(x=>text.includes(x))) return {label:"Morna",className:"warm"};
    return {label:"Fria",className:"cold"};
  }, [allText]);

  return (
    <section className="insightBox">
      <div className="insightHead">
        <div>
          <span className="step">👤 Módulo 05</span>
          <h3>Perfil do Cliente</h3>
        </div>
        <span className={`temperature ${temperature.className}`}>Chance: {temperature.label}</span>
      </div>

      <div className="profileSummary">
        <div>
          <small>Perfil principal</small>
          <strong>{primary?.label || "Ainda indefinido"}</strong>
        </div>
        <div>
          <small>Perfil secundário</small>
          <strong>{secondary?.label || "Ainda indefinido"}</strong>
        </div>
        <div>
          <small>Etapa atual</small>
          <strong>{stage}</strong>
        </div>
        <div>
          <small>Orçamento informado</small>
          <strong>{budget ? `R$ ${budget}` : "Não informado"}</strong>
        </div>
      </div>

      <div className="signalList">
        {signals.length === 0 ? (
          <p className="muted">Registre mais informações do cliente para o sistema identificar padrões.</p>
        ) : signals.slice(0,5).map(signal => (
          <div className="signal" key={signal.id}>
            <div><strong>{signal.label}</strong><span>{signal.score}%</span></div>
            <div className="bar"><span style={{width:`${signal.score}%`}} /></div>
            <small>Sinais: {signal.evidence.join(", ")}</small>
          </div>
        ))}
      </div>

      <div className="question insightQuestion">
        <span>❓ Melhor pergunta agora</span>
        <strong>{suggestedQuestion}</strong>
      </div>

      <div className="radar">
        <div>
          <span className="step">🔍 Radar de Necessidades Escondidas</span>
          <h4>O que ainda vale descobrir</h4>
        </div>
        <ul>{hiddenNeeds.map(item=><li key={item}>{item}</li>)}</ul>
      </div>
    </section>
  );
}
