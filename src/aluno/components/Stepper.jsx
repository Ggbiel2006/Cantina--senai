// Botões − / + de 44px (melhoria do teste). Com 1 unidade na revisão, o "−" vira lixeira.
export default function Stepper({ nome, qtd, onMenos, onMais, lixeira = false, maisDesativado = false }) {
  const usarLixeira = lixeira && qtd === 1
  return (
    <div className="step">
      <button type="button" onClick={onMenos} aria-label={usarLixeira ? `Remover ${nome}` : `Diminuir ${nome}`}>
        {usarLixeira ? <IconeLixeira /> : '−'}
      </button>
      <span aria-live="polite">{qtd}</span>
      <button type="button" onClick={onMais} disabled={maisDesativado} aria-label={`Adicionar mais ${nome}`}>+</button>
    </div>
  )
}

export function IconeLixeira() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  )
}
