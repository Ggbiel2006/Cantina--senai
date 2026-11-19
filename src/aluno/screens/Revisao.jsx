import Stepper from '../components/Stepper.jsx'
import { PRODUTO, RETIRADA } from '../../shared/produtos.js'
import { temDisponivel } from '../../shared/store.js'
import { brl, plural } from '../../shared/formato.js'

export default function Revisao({ db, carrinho, mudarQtd, limpar, obs, setObs, confirmar, ir, qtdTotal, total }) {
  const ids = Object.keys(carrinho)
  return (
    <>
      <header className="hdr">
        <button type="button" className="hbtn" onClick={() => ir('cardapio')} aria-label="Voltar ao cardápio">←</button>
        <h1>Revisão do pedido</h1>
        <button type="button" className="lnk" onClick={limpar} disabled={!qtdTotal}>Limpar</button>
      </header>

      <main className="content narrow">
        <div className="box">
          <div><b>Retirada:</b> {RETIRADA.local}, {RETIRADA.balcao}</div>
          <hr />
          <div><b>Previsão:</b> pronto em {RETIRADA.preparo} após confirmar</div>
        </div>

        {qtdTotal > 0 ? (
          <>
            <div className="box">
              <h3>ITENS DO PEDIDO</h3>
              <ul className="rlist">
                {ids.map((id) => {
                  const p = PRODUTO[id]
                  const q = carrinho[id]
                  const acabou = !temDisponivel(db, id)
                  const limite = db.estoque[id] != null && q >= db.estoque[id]
                  return (
                    <li key={id} className={'rv' + (acabou ? ' bad' : '')}>
                      <div className="pic sm"><img src={p.img} alt="" referrerPolicy="no-referrer" /></div>
                      <div className="meta">
                        <div className="nm">{p.nome}</div>
                        <div className="sub">
                          {acabou ? <b className="err">Esgotou · será removido</b> : <>{q} × {brl(p.preco)} = <b>{brl(q * p.preco)}</b></>}
                        </div>
                      </div>
                      <Stepper nome={p.nome} qtd={q} lixeira maisDesativado={acabou || limite}
                        onMenos={() => mudarQtd(id, -1)} onMais={() => mudarQtd(id, +1)} />
                    </li>
                  )
                })}
              </ul>
              <button type="button" className="add" onClick={() => ir('cardapio')}>+ Adicionar mais itens</button>
            </div>

            <div>
              <label className="lb" htmlFor="obs">Observação (opcional)</label>
              <textarea id="obs" rows={1} placeholder="Ex.: sem alface" value={obs} maxLength={120} onChange={(e) => setObs(e.target.value)} />
            </div>

            <div className="box">
              <div className="row"><span>Subtotal ({plural(qtdTotal, 'item', 'itens')})</span><span>{brl(total)}</span></div>
              <div className="row total"><span>Total</span><span>{brl(total)}</span></div>
              <hr />
              <div className="muted">Pagamento na retirada (Pix, cartão ou dinheiro).</div>
            </div>
          </>
        ) : (
          <div className="empty">Seu pedido está vazio.<br />Volte ao cardápio para escolher um lanche.</div>
        )}
      </main>

      <footer className="foot">
        {qtdTotal > 0
          ? <button type="button" className="primary" onClick={confirmar}>Confirmar pedido · {brl(total)}</button>
          : <button type="button" className="secondary" onClick={() => ir('cardapio')}>Voltar ao cardápio</button>}
      </footer>
    </>
  )
}
