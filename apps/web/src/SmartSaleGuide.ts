import type { CustomerSignalId } from "./CustomerSignalModel";
export type SalePriority = "preco" | "qualidade" | "recursos" | "parcela" | "durabilidade" | "";
export type PaymentPreference = "pix" | "cartao" | "crediario" | "indefinido" | "";
export type PurchaseTiming = "hoje" | "pesquisando" | "orcamento" | "";
export type SmartStage = "abordagem" | "descoberta" | "selecao" | "demonstracao" | "negociacao" | "fechamento";

export type SmartSaleGuide = {
  question: string;
  productDirection: string;
  argument: string;
  complement: string;
  likelyObjection: string;
  nextAction: string;
};

const priorityLabels: Record<Exclude<SalePriority, "">, string> = {
  preco: "preço",
  qualidade: "qualidade",
  recursos: "recursos",
  parcela: "parcela",
  durabilidade: "durabilidade"
};

function detectCategory(objective: string) {
  const value = objective.toLowerCase();
  if (/fog[aã]o|cooktop/.test(value)) return "fogao";
  if (/geladeira|refrigerador/.test(value)) return "geladeira";
  if (/lavadora|m[aá]quina.*lav|lava.*roup/.test(value)) return "lavadora";
  if (/tv|televis/.test(value)) return "tv";
  if (/celular|smartphone|iphone/.test(value)) return "celular";
  if (/cama|colch[aã]o/.test(value)) return "colchao";
  if (/sof[aá]/.test(value)) return "sofa";
  if (/guarda.?roupa|roupeiro/.test(value)) return "guardaRoupa";
  if (/arm[aá]rio|cozinha/.test(value)) return "armario";
  if (/micro.?ondas/.test(value)) return "microondas";
  return "geral";
}

function complementFor(objective: string) {
  const category = detectCategory(objective);
  const complements: Record<string, string> = {
    fogao: "Veja se faz sentido oferecer armário/balcão de cozinha, jogo de panelas ou depurador.",
    geladeira: "Considere oferecer suporte/organizador de cozinha, filtro ou outro item que complete a cozinha.",
    lavadora: "Considere cesto de roupa, varal ou móvel organizador para a lavanderia.",
    tv: "Considere painel/rack, suporte de parede ou soundbar conforme o espaço do cliente.",
    celular: "Considere capa, película, carregador ou proteção/serviço disponível na loja.",
    colchao: "Considere cama/base, travesseiros ou protetor de colchão.",
    sofa: "Considere rack/painel ou mesa de centro/lateral para completar o ambiente.",
    guardaRoupa: "Considere cama, cômoda ou colchão de acordo com o quarto.",
    armario: "Considere fogão/cooktop ou outro módulo que complete a cozinha.",
    microondas: "Considere suporte/nicho ou outro eletrodoméstico complementar de cozinha.",
    geral: "Pergunte onde o produto será usado e ofereça apenas um item que resolva uma necessidade do mesmo ambiente."
  };
  return complements[category];
}

function directionFor(priority: SalePriority, budget: string) {
  const budgetText = budget ? ` dentro de aproximadamente R$ ${budget}` : " dentro do orçamento real do cliente";
  switch (priority) {
    case "preco": return `Separe 2 ou 3 opções com bom custo-benefício${budgetText}; evite começar pelo modelo mais caro.`;
    case "qualidade": return `Priorize construção, acabamento, confiabilidade e benefícios percebidos${budgetText}.`;
    case "recursos": return `Priorize modelos com funções que o cliente realmente usará${budgetText}; não venda recurso só por quantidade.`;
    case "parcela": return `Procure opções que mantenham a parcela confortável${budgetText} e compare valor mensal antes do preço total.`;
    case "durabilidade": return `Priorize materiais, robustez, garantia e facilidade de manutenção${budgetText}.`;
    default: return `Separe somente 2 ou 3 opções coerentes com a necessidade${budgetText} e descubra o critério decisivo antes de demonstrar.`;
  }
}

function argumentFor(priority: SalePriority) {
  switch (priority) {
    case "preco": return "Mostre economia sem transformar a conversa em desconto: compare o que ele leva pelo valor pago.";
    case "qualidade": return "Conecte acabamento e qualidade ao uso diário: menos incômodo, melhor experiência e compra mais segura.";
    case "recursos": return "Demonstre no máximo 2 ou 3 recursos ligados ao problema que o cliente quer resolver.";
    case "parcela": return "Traduza a escolha para o valor mensal e confirme qual parcela cabe com tranquilidade.";
    case "durabilidade": return "Mostre o que torna o produto resistente e por que isso reduz a chance de trocar cedo demais.";
    default: return "Repita a necessidade do cliente e ligue cada benefício apresentado diretamente a ela.";
  }
}

function objectionFor(priority: SalePriority, timing: PurchaseTiming) {
  if (timing === "pesquisando") return "Provável: “Vou pesquisar em outras lojas.” Prepare uma comparação simples e dê um motivo concreto para decidir aqui.";
  if (timing === "orcamento") return "Provável: “Só queria saber o preço.” Descubra o que faria esse orçamento virar compra e deixe uma opção clara para retorno.";
  switch (priority) {
    case "preco": return "Provável: “Está caro.” Compare valor, benefício e alternativa inferior antes de oferecer desconto.";
    case "parcela": return "Provável: “A parcela ficou alta.” Trabalhe entrada, quantidade de parcelas ou uma opção próxima com menor mensalidade.";
    case "qualidade": return "Provável: dúvida se a diferença de preço vale a pena. Mostre diferenças concretas, não adjetivos.";
    case "recursos": return "Provável: dúvida entre modelos parecidos. Volte ao recurso que resolve a necessidade principal.";
    case "durabilidade": return "Provável: receio sobre marca, material ou assistência. Reforce evidências e garantia disponíveis.";
    default: return "Descubra a objeção real perguntando: “Além do valor, tem mais alguma coisa que está te deixando em dúvida?”";
  }
}

function questionFor(stage: SmartStage, priority: SalePriority, payment: PaymentPreference, timing: PurchaseTiming) {
  const priorityName = priority ? priorityLabels[priority] : "o que é mais importante";
  const questions: Record<SmartStage, string> = {
    abordagem: timing === "hoje" ? "Perfeito. Para eu acertar de primeira: o que você precisa que esse produto resolva hoje?" : "O que você está procurando e o que fez você começar a pesquisar isso agora?",
    descoberta: priority ? `Você comentou que ${priorityName} pesa mais. O que seria uma opção boa para você nesse ponto?` : "O que pesa mais na escolha: preço, qualidade, recursos, durabilidade ou valor da parcela?",
    selecao: payment === "crediario" ? "Vou separar poucas opções e já comparar pensando na parcela. Qual valor mensal ficaria confortável?" : "Entre essas opções, qual combina mais com o que você me disse que precisa?",
    demonstracao: `Esse benefício melhora justamente ${priorityName === "o que é mais importante" ? "o seu uso" : priorityName} para você?`,
    negociacao: payment === "pix" ? "Se essa for a opção certa, o que precisamos ajustar na condição à vista para você levar hoje?" : "O que ainda falta ficar bom: produto, valor total ou condição de pagamento?",
    fechamento: timing === "hoje" ? "Essa opção atende o que você veio resolver. Podemos seguir com ela?" : "Entre o que você viu, essa é a opção que mais faz sentido para você?"
  };
  return questions[stage];
}

function nextActionFor(stage: SmartStage, timing: PurchaseTiming) {
  if (stage === "abordagem") return "Confirme a necessidade principal antes de falar de modelos ou preço.";
  if (stage === "descoberta") return "Defina o critério nº 1 e limite a seleção a poucas opções.";
  if (stage === "selecao") return "Escolha uma opção principal e uma alternativa; não transforme a venda em catálogo.";
  if (stage === "demonstracao") return "Peça confirmação do benefício: faça o cliente dizer se aquilo resolve a necessidade.";
  if (stage === "negociacao") return "Isole a objeção real e resolva uma coisa por vez antes de alterar preço.";
  return timing === "pesquisando" ? "Tente obter um próximo passo concreto: decisão, retorno ou condição que faria fechar." : "Confirme a escolha e conduza imediatamente para pagamento/crediário e conclusão da venda.";
}

export function buildSmartSaleGuide(params: {
  objective: string;
  budget: string;
  priority: SalePriority;
  payment: PaymentPreference;
  timing: PurchaseTiming;
  stage: SmartStage;
  signals?: CustomerSignalId[];
}): SmartSaleGuide {
  const signals = new Set(params.signals || []);
  let question = questionFor(params.stage, params.priority, params.payment, params.timing);
  let productDirection = directionFor(params.priority, params.budget);
  let argument = argumentFor(params.priority);
  let likelyObjection = objectionFor(params.priority, params.timing);
  let nextAction = nextActionFor(params.stage, params.timing);

  if (signals.has("pronto_fechar")) {
    question = "Perfeito. Posso seguir com essa opção e preparar a condição para você?";
    nextAction = "Pare de acrescentar informação. Confirme a escolha e conduza diretamente para a conclusão da venda.";
    argument = "Reforce em uma frase o principal benefício escolhido pelo cliente e avance para o fechamento.";
  } else if (signals.has("achou_caro") || signals.has("quer_desconto")) {
    question = "Entendi. O que pesou mais para você: o valor total ou a condição de pagamento?";
    nextAction = "Isole a objeção de preço antes de oferecer desconto. Descubra se o problema é valor total, parcela ou percepção de benefício.";
    likelyObjection = "Preço é a barreira atual. Compare benefício, condição e uma alternativa coerente antes de reduzir preço.";
    argument = "Volte ao motivo da compra e mostre o que o cliente recebe pelo valor; só depois trabalhe condição ou alternativa.";
  } else if (signals.has("parcela_menor")) {
    question = "Qual valor de parcela ficaria confortável para você sem apertar o orçamento?";
    nextAction = "Traga a conversa para uma parcela-alvo e procure a melhor combinação entre entrada, prazo e produto.";
    productDirection = "Priorize opções que preservem a necessidade principal e aproximem a parcela do valor mensal informado pelo cliente.";
    likelyObjection = "A parcela mensal está acima do confortável. Evite insistir no mesmo plano sem mudar a condição.";
  } else if (signals.has("comparando_concorrente")) {
    question = "O que você viu na outra opção que mais chamou sua atenção: preço, condição ou algum recurso?";
    nextAction = "Descubra exatamente o critério da comparação e compare somente os pontos que realmente mudam a decisão.";
    argument = "Não ataque o concorrente. Mostre diferenças verificáveis e conecte-as à necessidade que o cliente declarou.";
    likelyObjection = "O cliente pode sair para comparar. Dê clareza sobre a diferença e um motivo concreto para decidir aqui.";
  } else if (signals.has("esta_indeciso")) {
    question = "Entre as opções, qual ponto ainda está te deixando em dúvida?";
    nextAction = "Reduza a escolha a duas opções e peça ao cliente para dizer qual critério decidirá entre elas.";
    productDirection = "Evite apresentar novos modelos agora. Simplifique a decisão usando apenas a opção principal e uma alternativa.";
  } else if (signals.has("gostou_produto")) {
    question = "Esse é o que mais gostou até agora? O que nele fez mais sentido para você?";
    nextAction = "Transforme o interesse em compromisso: confirme o benefício decisivo e avance para condição de pagamento ou fechamento.";
  } else if (signals.has("tem_pressa")) {
    question = "Para resolver isso hoje, qual é o ponto que não pode faltar no produto?";
    nextAction = "Encurte a jornada: confirme o requisito indispensável, apresente poucas opções e conduza rapidamente para decisão.";
    productDirection = "Priorize disponibilidade e aderência à necessidade essencial; evite ampliar demais a comparação.";
  }

  return {
    question,
    productDirection,
    argument,
    complement: complementFor(params.objective),
    likelyObjection,
    nextAction
  };
}
