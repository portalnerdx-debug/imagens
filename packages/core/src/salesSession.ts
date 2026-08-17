export type AtendimentoEtapa =
  | "abordagem"
  | "descoberta"
  | "selecao"
  | "demonstracao"
  | "negociacao"
  | "fechamento";

export interface AtendimentoProduto {
  code: string;
  name?: string;
  price?: number;
}

export interface AtendimentoNota {
  id: string;
  text: string;
  createdAt: string;
}

export interface AtendimentoSession {
  id: string;
  customerName?: string;
  startedAt: string;
  updatedAt: string;
  stage: AtendimentoEtapa;
  objective: string;
  budget?: number;
  products: AtendimentoProduto[];
  notes: AtendimentoNota[];
  status: "em_atendimento" | "fechada" | "perdida";
}

export const atendimentoEtapas: Array<{
  id: AtendimentoEtapa;
  label: string;
  guidance: string;
}> = [
  { id: "abordagem", label: "Abordagem", guidance: "Receba o cliente e descubra o motivo da visita." },
  { id: "descoberta", label: "Descoberta", guidance: "Pergunte necessidade, prioridade, orçamento e forma de pagamento." },
  { id: "selecao", label: "Seleção", guidance: "Escolha poucas opções que façam sentido para a necessidade." },
  { id: "demonstracao", label: "Demonstração", guidance: "Mostre benefícios ligados ao que o cliente disse." },
  { id: "negociacao", label: "Negociação", guidance: "Trabalhe objeções, orçamento, adicionais e condições." },
  { id: "fechamento", label: "Fechamento", guidance: "Confirme a escolha e conduza o próximo passo." }
];
