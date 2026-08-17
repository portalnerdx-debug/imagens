import { customerSignalDefinitions, type CustomerSignalId } from "./CustomerSignalModel";

export function CustomerSignalPanel({
  signals,
  onToggle
}: {
  signals: CustomerSignalId[];
  onToggle: (signal: CustomerSignalId) => void;
}) {
  const selected = new Set(signals);
  return <section className="customerSignals" aria-label="Sinais rápidos do cliente">
    <div className="customerSignalsHead">
      <div><span className="step">👀 Leitura do cliente</span><h3>O que você percebeu agora?</h3><p>Marque sinais durante a conversa. O XVendas adapta a estratégia imediatamente.</p></div>
      <span className="signalCount">{signals.length} ativo{signals.length === 1 ? "" : "s"}</span>
    </div>
    <div className="signalButtons">
      {customerSignalDefinitions.map(signal => {
        const active = selected.has(signal.id);
        return <button
          key={signal.id}
          type="button"
          aria-pressed={active}
          className={active ? "signalButton active" : "signalButton"}
          onClick={() => onToggle(signal.id)}
        >
          <span>{signal.icon}</span><strong>{signal.label}</strong>{active && <b>✓</b>}
        </button>;
      })}
    </div>
  </section>;
}
