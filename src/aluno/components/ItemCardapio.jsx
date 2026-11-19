import Stepper from './Stepper.jsx'
import { brl } from '../../shared/formato.js'
import { temDisponivel, ultimasUnidades } from '../../shared/store.js'

export default function ItemCardapio({ produto, db, qtd, onMais, onMenos }) {
  const ok = temDisponivel(db, produto.id)
  const limite = db.estoque[produto.id] != null && qtd >= db.estoque[produto.id]
  return (
    <li className={'item' + (ok ? '' : ' off')}>
      <div className="pic"><img src={produto.img} alt={ok ? produto.nome : `${produto.nome} (esgotado)`} loading="lazy" decoding="async" referrerPolicy="no-referrer" /></div>
      <div className="meta">
        <div className="nm">{produto.nome}</div>
        {!ok && <span className="badge">ESGOTADO</span>}
        {ok && produto.desc && <div className="ds">{produto.desc}</div>}
        {ok && ultimasUnidades(db, produto.id) && <div><span className="badge last">últimas unidades</span></div>}
        <div className="pr">{brl(produto.preco)}</div>
      </div>
      {!ok ? (
        <button type="button" className="plus" disabled aria-label={`${produto.nome} esgotado`}>+</button>
      ) : qtd > 0 ? (
        <Stepper nome={produto.nome} qtd={qtd} onMenos={onMenos} onMais={onMais} maisDesativado={limite} />
      ) : (
        <button type="button" className="plus" onClick={onMais} aria-label={`Adicionar ${produto.nome}`}>+</button>
      )}
    </li>
  )
}
