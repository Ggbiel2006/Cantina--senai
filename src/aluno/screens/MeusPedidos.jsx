import { brl, hora } from '../../shared/formato.js'
import { textoItens } from '../../shared/store.js'

const PILULA = { recebido: ['Recebido', ''], preparo: ['Em preparo', ''], pronto: ['Pronto', 'ready'], entregue: ['Entregue', 'done'] }

export default function MeusPedidos({ meus, abrir }) {
  return (
    <>
      <header className="hdr"><h1 className="left">Meus pedidos</h1></header>
      <main className="content narrow">
        {meus.length === 0 ? (
          <div className="empty">Você ainda não fez pedidos hoje.<br />Os pedidos confirmados aparecem aqui com o número de retirada.</div>
        ) : (
          <ul className="orders">
            {meus.map((p) => (
              <li key={p.num}>
                <button type="button" className="ord" onClick={() => abrir(p.num)}>
                  <span>
                    <span className="nb">#{p.num}</span>
                    <span className="s">{textoItens(p.itens)} · {brl(p.total)}</span>
                    <span className="s">Feito às {hora(p.t.recebido)}</span>
                  </span>
                  <span className={'pill ' + PILULA[p.status][1]}>{PILULA[p.status][0]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
