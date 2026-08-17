import type { SmartSaleGuide } from "./SmartSaleGuide";

export function SmartAttendanceGuide({ guide }: { guide: SmartSaleGuide }) {
  return <section className="smartGuide" aria-label="Orientação inteligente do atendimento">
    <div className="smartGuideHead">
      <div><span className="step">⚡ Atendimento inteligente</span><h3>Plano rápido para esta venda</h3></div>
      <span className="smartGuideLive">Atualiza com o atendimento</span>
    </div>
    <div className="smartGuideGrid">
      <article className="smartGuidePrimary"><span>🎯 Próximo passo</span><strong>{guide.nextAction}</strong></article>
      <article><span>📦 Produto ideal</span><p>{guide.productDirection}</p></article>
      <article><span>💬 Argumento</span><p>{guide.argument}</p></article>
      <article><span>➕ Complemento</span><p>{guide.complement}</p></article>
      <article><span>🛡️ Objeção provável</span><p>{guide.likelyObjection}</p></article>
    </div>
  </section>;
}
