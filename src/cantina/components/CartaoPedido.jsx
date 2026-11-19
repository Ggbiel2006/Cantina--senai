import { useEffect, useRef, useState } from 'react'
import { brl, hora, haQuanto } from '../../shared/formato.js'
import { textoItens, avancarPedido, entregarPedido } from '../../shared/store.js'

export default function CartaoPedido({ pedido, agora }) {
  const [conferindo, setConferindo] = useState(false)
  const novo = useNovo(pedido.num)
  const { num, nome, turma, itens, obs, total, status, t } = pedido

  const tempo = status === 'recebido' ? hora(t.recebido)
    : status === 'preparo' ? `${hora(t.recebido)} · ${haQuanto(t.recebido, agora)}`
    : `pronto ${haQuanto(t.pronto, agora)}`

  return (
    <article className={'ocard' + (novo ? ' novo' : '')} aria-label={`Pedido ${num} de ${nome}`}>
      <div className="r1"><b>#{num}</b><span className="t">{tempo}</span></div>
      <div className="who">{nome} · {turma}</div>
      <div className="its">{textoItens(itens)}</div>
      {obs && <div className="obs">Obs.: {obs}</div>}

      {status !== 'pronto' ? (
        <>
          <div className="pay">A pagar: <b>{brl(total)}</b></div>
          <button type="button" className="pbtn" onClick={() => avancarPedido(num)}>
            {status === 'recebido' ? 'Iniciar preparo →' : 'Marcar como pronto →'}
          </button>
        </>
      ) : (
        <>
          <div className="pay">Cobrar: <b>{brl(total)}</b></div>
          {conferindo ? (
            <div className="conf" role="group" aria-label="Conferir entrega">
              <span>Número <b>#{num}</b> e nome <b>{nome}</b> conferidos? Receber <b>{brl(total)}</b>.</span>
              <div className="bt">
                <button type="button" className="no" onClick={() => setConferindo(false)}>Cancelar</button>
                <button type="button" className="yes" onClick={() => entregarPedido(num)}>Entregar e receber</button>
              </div>
            </div>
          ) : (
            <>
              <div className="chk">Conferir número e nome antes de entregar</div>
              <button type="button" className="dbtn" onClick={() => setConferindo(true)}>Confirmar entrega ✓</button>
            </>
          )}
        </>
      )}
    </article>
  )
}

// Destaca o cartão por alguns segundos quando ele acaba de chegar.
function useNovo(chave) {
  const primeira = useRef(true)
  const [novo, setNovo] = useState(false)
  useEffect(() => {
    if (primeira.current && Date.now() - (window.__painelAberto || 0) < 1500) { primeira.current = false; return }
    primeira.current = false
    setNovo(true)
    const t = setTimeout(() => setNovo(false), 1800)
    return () => clearTimeout(t)
  }, [chave])
  return novo
}
