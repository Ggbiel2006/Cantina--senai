import { useEffect, useState } from 'react'
import CartaoPedido from './components/CartaoPedido.jsx'
import Disponibilidade from './components/Disponibilidade.jsx'
import GerenciarCardapio from './components/GerenciarCardapio.jsx'
import { useBanco, alternarPausa, alternarEncerrado, reiniciarDados, textoItens } from '../shared/store.js'
import { RETIRADA } from '../shared/produtos.js'
import { brl, hora } from '../shared/formato.js'

window.__painelAberto = Date.now()

const COLUNAS = [
  { id: 'recebido', titulo: 'RECEBIDOS', vazio: 'Nenhum pedido novo. Os pedidos feitos no sistema do aluno aparecem aqui na hora.' },
  { id: 'preparo', titulo: 'EM PREPARO', vazio: 'Toque em “Iniciar preparo” num pedido recebido.' },
  { id: 'pronto', titulo: 'PRONTOS', vazio: null },
]

export default function App() {
  const db = useBanco()
  const agora = useRelogio()
  const [vista, setVista] = useState('pedidos') // 'pedidos' | 'entregues' | 'cardapio'
  const [colunaCelular, setColunaCelular] = useState('recebido') // no celular, uma coluna por vez
  const [confirmarReinicio, setConfirmarReinicio] = useState(false)

  const porStatus = (s) => db.pedidos.filter((p) => p.status === s).sort((a, b) => a.t.recebido - b.t.recebido)
  const totalEntregues = db.entreguesAntes + db.entregues.length
  const novosRecebidos = porStatus('recebido').length

  // Título da aba mostra quantos pedidos novos estão esperando
  useEffect(() => {
    document.title = (novosRecebidos ? `(${novosRecebidos}) ` : '') + 'Cantina · Painel da atendente'
  }, [novosRecebidos])

  return (
    <div className="painel">
      <header className="phd">
        <div>
          <h1>Painel da cantina</h1>
          <div className="sub">Intervalo {RETIRADA.intervalo} · Entregues: {totalEntregues} · agora {hora(agora)}</div>
        </div>
        <div className="pbtns">
          {vista !== 'pedidos' && (
            <button type="button" className="obtn" onClick={() => setVista('pedidos')}>← Voltar aos pedidos</button>
          )}
          {vista !== 'cardapio' && (
            <button type="button" className="obtn" onClick={() => setVista('cardapio')}>+ Cardápio</button>
          )}
          {vista !== 'entregues' && (
            <button type="button" className="obtn" onClick={() => setVista('entregues')}>Ver entregues</button>
          )}
          <button type="button" className="obtn alerta" aria-pressed={db.pausado} onClick={alternarPausa}>
            {db.pausado ? 'Retomar pedidos' : 'Pausar pedidos'}
          </button>
        </div>
      </header>

      <Disponibilidade db={db} />

      {db.pausado && <div className="faixa" role="status">Pedidos pausados. Os estudantes veem o aviso e não conseguem enviar novos pedidos.</div>}
      {db.encerrado && <div className="faixa" role="status">Horário de pedidos encerrado ({RETIRADA.limite}). Termine os pedidos que já chegaram.</div>}

      {vista === 'cardapio' ? (
        <GerenciarCardapio db={db} />
      ) : vista === 'entregues' ? (
        <section className="dlist" aria-label="Pedidos entregues">
          <h2>Entregues hoje ({totalEntregues})</h2>
          {[...db.entregues].reverse().map((p) => (
            <div key={p.num} className="drow">
              <span><b>#{p.num}</b> · {p.nome} · {p.turma}<br /><small>{textoItens(p.itens)}</small></span>
              <span>{brl(p.total)} · {hora(p.t.entregue)}</span>
            </div>
          ))}
          <div className="drow muted"><span>Pedidos entregues antes de abrir este painel</span><span>{db.entreguesAntes}</span></div>
        </section>
      ) : (
        <>
          {/* Celular: abas para escolher a coluna */}
          <div className="colabas" role="tablist" aria-label="Situação dos pedidos">
            {COLUNAS.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={colunaCelular === c.id} onClick={() => setColunaCelular(c.id)}>
                {c.titulo.charAt(0) + c.titulo.slice(1).toLowerCase()} <span>{porStatus(c.id).length}</span>
              </button>
            ))}
          </div>

          <div className="cols">
            {COLUNAS.map((c) => {
              const lista = porStatus(c.id)
              return (
                <section key={c.id} className={'col' + (colunaCelular === c.id ? ' ativa' : '')} aria-label={c.titulo}>
                  <h2>{c.titulo} ({lista.length})</h2>
                  {lista.map((p) => <CartaoPedido key={p.num} pedido={p} agora={agora} />)}
                  {!lista.length && c.vazio && <div className="hint">{c.vazio}</div>}
                  {c.id === 'pronto' && <div className="hint">Após entregar, o card sai daqui e vai para “Entregues”.</div>}
                </section>
              )
            })}
          </div>
        </>
      )}

      <footer className="pfoot">
        <span>Ferramentas de demonstração:</span>
        <button type="button" onClick={alternarEncerrado}>{db.encerrado ? 'Reabrir horário de pedidos' : 'Encerrar horário de pedidos'}</button>
        {confirmarReinicio ? (
          <>
            <span>Apagar todos os pedidos e voltar ao início?</span>
            <button type="button" onClick={() => { reiniciarDados(); setConfirmarReinicio(false) }}>Sim, reiniciar</button>
            <button type="button" onClick={() => setConfirmarReinicio(false)}>Cancelar</button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmarReinicio(true)}>Reiniciar dados</button>
        )}
      </footer>
    </div>
  )
}

// Atualiza "há X min" a cada 20 segundos
function useRelogio() {
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 20000)
    return () => clearInterval(id)
  }, [])
  return agora
}
