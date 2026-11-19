import ItemCardapio from '../components/ItemCardapio.jsx'
import ResumoPedido from '../components/ResumoPedido.jsx'
import { PRODUTOS, CATEGORIAS, RETIRADA } from '../../shared/produtos.js'
import { brl, plural } from '../../shared/formato.js'

export default function Cardapio({ db, carrinho, mudarQtd, busca, setBusca, categoria, setCategoria, abrirFolha, temAvisoNovo, ir, qtdTotal, total }) {
  const termo = busca.trim().toLowerCase()
  const combina = (p) => !termo || `${p.nome} ${p.desc} ${p.categoria}`.toLowerCase().includes(termo)
  // "Todos" mostra só as categorias que têm itens (Doces aparece quando a cantina cadastrar algum)
  const secoes = categoria === 'Todos'
    ? CATEGORIAS.filter((c) => c !== 'Todos' && PRODUTOS.some((p) => p.categoria === c))
    : [categoria]

  const conteudo = []
  for (const sec of secoes) {
    const temNaCategoria = PRODUTOS.some((p) => p.categoria === sec)
    if (!temNaCategoria && !termo) {
      conteudo.push(
        <section key={sec}>
          <h2 className="sec">{sec.toUpperCase()}</h2>
          <div className="empty">Nenhum item em {sec} hoje.<br />Veja os outros itens em “Todos”.</div>
        </section>
      )
      continue
    }
    const itens = PRODUTOS.filter((p) => p.categoria === sec && combina(p))
    if (!itens.length) continue
    conteudo.push(
      <section key={sec}>
        <h2 className="sec">{sec.toUpperCase()}</h2>
        <ul className="list">
          {itens.map((p) => (
            <ItemCardapio key={p.id} produto={p} db={db} qtd={carrinho[p.id] || 0}
              onMais={() => mudarQtd(p.id, +1)} onMenos={() => mudarQtd(p.id, -1)} />
          ))}
        </ul>
      </section>
    )
  }

  return (
    <>
      <header className="hdr">
        <button type="button" className="loc" onClick={() => abrirFolha('local')}>
          Retirar em: <b>{RETIRADA.local}</b> ▾
        </button>
        <button type="button" className="avisos" onClick={() => abrirFolha('avisos')}>
          Avisos{temAvisoNovo && <span className="dot" aria-label="novo aviso" />}
        </button>
      </header>

      <div className="layout">
        <main className="content">
          <label className="search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
            <input type="search" placeholder="Buscar lanche ou bebida" aria-label="Buscar lanche ou bebida"
              value={busca} onChange={(e) => setBusca(e.target.value)} autoComplete="off" />
          </label>

          <div className="chips" role="group" aria-label="Categorias">
            {CATEGORIAS.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={categoria === c} onClick={() => setCategoria(c)}>{c}</button>
            ))}
          </div>

          <FaixaInfo db={db} />

          {conteudo.length ? conteudo : (
            <div className="empty">Nenhum item encontrado para “{busca}”.<br />Tente outro nome, como “suco” ou “misto”.</div>
          )}
        </main>

        {/* Computador: o pedido fica sempre visível ao lado do cardápio */}
        <aside className="aside">
          <ResumoPedido carrinho={carrinho} mudarQtd={mudarQtd} total={total} qtdTotal={qtdTotal} ir={ir} />
        </aside>
      </div>

      {qtdTotal > 0 && (
        <button type="button" className="cartbar" onClick={() => ir('revisao')}>
          <span className="cnt"><i>{qtdTotal}</i>{plural(qtdTotal, 'item', 'itens')}</span>
          <b>Ver pedido →</b>
          <span>{brl(total)}</span>
        </button>
      )}
    </>
  )
}

export function FaixaInfo({ db }) {
  if (db.encerrado) return <div className="info stop">Pedidos encerrados às <b>{RETIRADA.limite}</b>. Os pedidos já feitos continuam sendo preparados.</div>
  if (db.pausado) return <div className="info stop">A cantina pausou os pedidos por alguns minutos. Você pode montar o pedido e enviar quando reabrir.</div>
  return <div className="info">Pedidos até <b>{RETIRADA.limite}</b> · preparo {RETIRADA.preparo} · pague na retirada</div>
}
