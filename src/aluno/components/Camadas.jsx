import { useEffect } from 'react'

// Painel que sobe de baixo (celular) ou janela central (computador).
export function Folha({ titulo, onFechar, children }) {
  useEsc(onFechar)
  return (
    <div className="veil" onClick={onFechar}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        {children}
        <button type="button" className="secondary" onClick={onFechar}>Fechar</button>
      </div>
    </div>
  )
}

// Mensagem de erro que precisa de confirmação.
export function Dialogo({ titulo, mensagem, lista, onFechar }) {
  useEsc(onFechar)
  return (
    <div className="veil center">
      <div className="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-titulo">
        <h3 id="dlg-titulo">{titulo}</h3>
        <p>{mensagem}</p>
        {lista?.length > 0 && <ul>{lista.map((x) => <li key={x}>{x}</li>)}</ul>}
        <button type="button" className="primary" onClick={onFechar} autoFocus>Entendi</button>
      </div>
    </div>
  )
}

export function Toast({ texto, onDesfazer }) {
  return (
    <div className="toast" role="status">
      <span>{texto}</span>
      {onDesfazer && <button type="button" onClick={onDesfazer}>Desfazer</button>}
    </div>
  )
}

// Notificação de "pedido pronto" dentro do app.
export function AvisoPronto({ num, onAbrir }) {
  return (
    <button type="button" className="push" onClick={onAbrir} role="alert">
      <span className="push-ic" aria-hidden="true">CA</span>
      <span><small>CANTINA · agora</small><b>Pedido #{num} pronto!</b><span>Vá ao balcão 1.</span></span>
    </button>
  )
}

function useEsc(fn) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') fn() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fn])
}
