import Stepper from './Stepper.jsx'
import { PRODUTO } from '../../shared/produtos.js'
import { brl, plural } from '../../shared/formato.js'

// Só aparece no computador/tablet largo (ao lado do cardápio).
export default function ResumoPedido({ carrinho, mudarQtd, total, qtdTotal, ir }) {
  const ids = Object.keys(carrinho)
  return (
    <div className="box resumo">
      <h3>SEU PEDIDO</h3>
      {ids.length === 0 ? (
        <p className="muted">Toque em “+” para adicionar lanches e bebidas.</p>
      ) : (
        <ul className="rlist">
          {ids.map((id) => (
            <li key={id} className="rv">
              <div className="meta"><div className="nm">{PRODUTO[id].nome}</div><div className="sub">{brl(PRODUTO[id].preco * carrinho[id])}</div></div>
              <Stepper nome={PRODUTO[id].nome} qtd={carrinho[id]} lixeira onMenos={() => mudarQtd(id, -1)} onMais={() => mudarQtd(id, +1)} />
            </li>
          ))}
        </ul>
      )}
      <hr />
      <div className="row"><span>{plural(qtdTotal, 'item', 'itens')}</span><b>{brl(total)}</b></div>
      <button type="button" className="primary" disabled={!qtdTotal} onClick={() => ir('revisao')}>Ver pedido →</button>
    </div>
  )
}
