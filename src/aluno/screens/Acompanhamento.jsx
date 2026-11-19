import { nomeDe, RETIRADA, PREVISAO_MIN } from '../../shared/produtos.js'
import { brl, hora } from '../../shared/formato.js'

const ETAPAS = [
  { id: 'recebido', rotulo: 'Pedido recebido' },
  { id: 'preparo', rotulo: 'Em preparo' },
  { id: 'pronto', rotulo: 'Pronto para retirar' },
  { id: 'entregue', rotulo: 'Entregue' },
]
const TITULO = { recebido: 'Recebido', preparo: 'Em preparo', pronto: 'Pronto para retirar', entregue: 'Entregue' }

export default function Acompanhamento({ pedido, aluno, recemEnviado, ir }) {
  if (!pedido) {
    return (
      <>
        <header className="hdr"><button type="button" className="hbtn" onClick={() => ir('cardapio')} aria-label="Fechar">✕</button><h1 className="left">Acompanhar pedido</h1></header>
        <main className="content narrow"><div className="empty">Você ainda não tem pedido em andamento.<br />Escolha um lanche no cardápio e confirme o pedido.</div></main>
        <footer className="foot"><button type="button" className="secondary" onClick={() => ir('cardapio')}>Voltar ao cardápio</button></footer>
      </>
    )
  }

  const atual = ETAPAS.findIndex((e) => e.id === pedido.status)
  const pronto = pedido.status === 'pronto'
  const entregue = pedido.status === 'entregue'

  return (
    <>
      <header className="hdr">
        <button type="button" className="hbtn" onClick={() => ir('cardapio')} aria-label="Fechar">✕</button>
        <h1 className="left">Acompanhar pedido</h1>
      </header>

      <main className="content narrow">
        {recemEnviado && pedido.status === 'recebido' && (
          <div className="okbanner" role="status"><span aria-hidden="true">✓</span>
            <span><b>Pedido enviado para a cantina</b>Você recebe um aviso no celular quando ele ficar pronto.</span>
          </div>
        )}

        <div className="box ticket">
          <div className="k">SEU NÚMERO DE RETIRADA</div>
          <div className="num">#{pedido.num}</div>
          <div className="who">{pedido.nome} · {pedido.turma || aluno.turma}</div>
          <div className="tip">Mostre o número e diga seu nome no balcão</div>
        </div>

        <div className={'box status' + (pronto ? ' ready' : '')} aria-live="polite">
          <h3>Status: {TITULO[pedido.status]}</h3>
          {!pronto && !entregue && <div>Previsão de retirada: <b>{hora(pedido.t.recebido + PREVISAO_MIN * 60000)}</b></div>}
          <ul className="steps">
            {ETAPAS.map((e, i) => {
              const feito = i < atual || (entregue && i === atual)
              const agora = i === atual && !entregue
              return (
                <li key={e.id} className={feito ? 'done' : agora ? 'now' : ''}>
                  <span className="sq" aria-hidden="true">{feito ? '✓' : ''}</span>
                  {e.rotulo}
                  {pedido.t[e.id] && (feito || e.id === 'recebido') ? ` · ${hora(pedido.t[e.id])}` : ''}
                  {agora ? ' (agora)' : ''}
                </li>
              )
            })}
          </ul>
          {pronto && <div className="go">Vá ao {RETIRADA.balcao}</div>}
          {entregue && <p className="muted">Pedido retirado e pago às {hora(pedido.t.entregue)}. Bom lanche!</p>}
        </div>

        <div className="box howto">
          <h3>COMO RETIRAR</h3>
          <ul>
            <li>Quando ficar <b>Pronto</b>, vá ao <b>{RETIRADA.balcao}</b>.</li>
            <li>Pague na retirada: <b>{brl(pedido.total)}</b></li>
          </ul>
          <hr />
          <div className="muted">{pedido.itens.map((i) => `${i.qtd}× ${nomeDe(i.id)}`).join(' · ')}</div>
          {pedido.obs && <div className="muted">Obs.: {pedido.obs}</div>}
        </div>
      </main>

      <footer className="foot"><button type="button" className="secondary" onClick={() => ir('cardapio')}>Voltar ao cardápio</button></footer>
    </>
  )
}
