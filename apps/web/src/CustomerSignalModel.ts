export type CustomerSignalId =
  | "achou_caro"
  | "gostou_produto"
  | "parcela_menor"
  | "tem_pressa"
  | "comparando_concorrente"
  | "esta_indeciso"
  | "quer_desconto"
  | "pronto_fechar";

export type CustomerSignalDefinition = {
  id: CustomerSignalId;
  icon: string;
  label: string;
  note: string;
};

export const customerSignalDefinitions: CustomerSignalDefinition[] = [
  { id: "achou_caro", icon: "💰", label: "Achou caro", note: "Cliente demonstrou objeção ao preço." },
  { id: "gostou_produto", icon: "❤️", label: "Gostou do produto", note: "Cliente demonstrou forte interesse no produto." },
  { id: "parcela_menor", icon: "💳", label: "Quer parcela menor", note: "Cliente pediu uma condição com parcela mensal menor." },
  { id: "tem_pressa", icon: "⚡", label: "Tem pressa", note: "Cliente demonstrou urgência para resolver a compra." },
  { id: "comparando_concorrente", icon: "⚖️", label: "Comparando concorrente", note: "Cliente está comparando a oferta com outra loja ou concorrente." },
  { id: "esta_indeciso", icon: "🤔", label: "Está indeciso", note: "Cliente ainda está inseguro ou dividido entre opções." },
  { id: "quer_desconto", icon: "🏷️", label: "Quer desconto", note: "Cliente pediu desconto ou melhoria no preço." },
  { id: "pronto_fechar", icon: "✅", label: "Pronto para fechar", note: "Cliente deu sinal de que está pronto para concluir a compra." }
];

export function signalNotes(signals: CustomerSignalId[]) {
  const selected = new Set(signals);
  return customerSignalDefinitions.filter(signal => selected.has(signal.id)).map(signal => signal.note);
}
