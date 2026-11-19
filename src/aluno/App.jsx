import { useEffect, useMemo, useRef, useState } from 'react'
import Cardapio from './screens/Cardapio.jsx'
import Revisao from './screens/Revisao.jsx'
import Acompanhamento from './screens/Acompanhamento.jsx'
import MeusPedidos from './screens/MeusPedidos.jsx'
import Perfil from './screens/Perfil.jsx'
import { BarraAbas, NavTopo } from './components/Navegacao.jsx'
import { Folha, Dialogo, Toast, AvisoPronto } from './components/Camadas.jsx'
import { useBanco, enviarPedido, acharPedido, temDisponivel, totalDe } from '../shared/store.js'
import { PRODUTO, RETIRADA, PREVISAO_MIN } from '../shared/produtos.js'
import { hora } from '../shared/formato.js'
import { lerPerfil, salvarPerfil } from './perfil.js'

const CHAVE_CARRINHO = 'cantina-aluno:carrinho'
const TELAS_COM_ABAS = ['cardapio', 'pedidos', 'perfil']

// Item que saiu do cardápio (removido pela cantina) não pode ficar no carrinho
const itemValido = (id) => PRODUTO[id] && !PRODUTO[id].removido

function lerCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || {}
    return Object.fromEntries(Object.entries(salvo).filter(([id]) => itemValido(id)))
  } catch (e) { return {} }
}

export default function App() {
  const db = useBanco()
  const [aluno, setAluno] = useState(lerPerfil)
  const [tela, setTela] = useState('cardapio')
  const [carrinho, setCarrinho] = useState(lerCarrinho)
  const [obs, setObs] = useState('')
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [folha, setFolha] = useState(null)        // 'local' | 'avisos'
  const [dialogo, setDialogo] = useState(null)    // { titulo, mensagem, lista }
  const [toast, setToast] = useState(null)        // { texto, desfazer }
  const [aviso, setAviso] = useState(null)        // número do pedido pronto
  const [acompanhando, setAcompanhando] = useState(null)
  const [recemEnviado, setRecemEnviado] = useState(null)
  const [avisosVistos, setAvisosVistos] = useState(0)

  useEffect(() => {
    try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho)) } catch (e) { /* ignora */ }
  }, [carrinho])

  // A cantina removeu um item do cardápio enquanto ele estava no carrinho
  useEffect(() => {
    const fora = Object.keys(carrinho).filter((id) => !itemValido(id))
    if (!fora.length) return
    setCarrinho((c) => Object.fromEntries(Object.entries(c).filter(([id]) => itemValido(id))))
  }, [db, carrinho])

  // Pedidos deste aluno (em andamento + entregues), mais recentes primeiro
  const meus = useMemo(
    () => [...db.pedidos, ...db.entregues].filter((p) => p.alunoId === aluno.id).sort((a, b) => b.t.recebido - a.t.recebido),
    [db, aluno.id]
  )

  // Avisos: horário de pedidos + o que aconteceu com os pedidos do aluno
  const avisos = useMemo(() => {
    const lista = []
    for (const p of meus) {
      lista.push({ t: p.t.recebido, texto: `Pedido #${p.num} recebido pela cantina. Previsão de retirada ${hora(p.t.recebido + PREVISAO_MIN * 60000)}.` })
      if (p.t.pronto) lista.push({ t: p.t.pronto, texto: `Pedido #${p.num} pronto! Vá ao ${RETIRADA.balcao}.` })
      if (p.t.entregue) lista.push({ t: p.t.entregue, texto: `Pedido #${p.num} entregue. Bom lanche!` })
    }
    return lista.sort((a, b) => b.t - a.t)
  }, [meus])
  const temAvisoNovo = avisos.some((a) => a.t > avisosVistos)

  // Quando a atendente marca "Pronto" no painel: aviso na tela + vibração + notificação do navegador
  const statusAnterior = useRef(null)
  useEffect(() => {
    const atual = Object.fromEntries(meus.map((p) => [p.num, p.status]))
    const antes = statusAnterior.current
    if (antes) {
      for (const p of meus) {
        if (p.status === 'pronto' && antes[p.num] && antes[p.num] !== 'pronto') {
          setAviso(p.num)
          try { navigator.vibrate?.([200, 100, 200]) } catch (e) { /* ignora */ }
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Pedido #${p.num} pronto!`, { body: `Vá ao ${RETIRADA.balcao}.`, icon: '/img/sanduiche.svg' })
            }
          } catch (e) { /* ignora */ }
        }
      }
    }
    statusAnterior.current = atual
  }, [meus])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 8000)
    return () => clearTimeout(t)
  }, [aviso])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Volta ao topo ao trocar de tela
  useEffect(() => { window.scrollTo(0, 0) }, [tela])

  const qtdTotal = Object.values(carrinho).reduce((s, q) => s + q, 0)
  const total = totalDe(Object.entries(carrinho).map(([id, qtd]) => ({ id, qtd })))

  function mudarQtd(id, delta) {
    const qtd = (carrinho[id] || 0) + delta
    if (delta > 0 && (!temDisponivel(db, id) || (db.estoque[id] != null && qtd > db.estoque[id]))) return
    const novo = { ...carrinho }
    if (qtd <= 0) {
      delete novo[id]
      setToast({ texto: `${PRODUTO[id].nome} removido do pedido.`, desfazer: () => setCarrinho((x) => ({ ...x, [id]: 1 })) })
    } else novo[id] = qtd
    setCarrinho(novo)
  }

  function limpar() {
    const anterior = carrinho
    const n = qtdTotal
    setCarrinho({})
    setToast({ texto: `Pedido limpo (${n} ${n === 1 ? 'item removido' : 'itens removidos'}).`, desfazer: () => setCarrinho(anterior) })
  }

  function confirmar() {
    const r = enviarPedido({ aluno, carrinho, obs })
    if (!r.ok) {
      if (r.erro === 'encerrado') setDialogo({ titulo: 'Pedidos encerrados', mensagem: `O horário para pedidos acabou às ${RETIRADA.limite}. Seu pedido não foi enviado.` })
      if (r.erro === 'vazio') setDialogo({ titulo: 'Pedido vazio', mensagem: 'Os itens do seu pedido saíram do cardápio. Escolha outro lanche e confirme de novo.' })
      if (r.erro === 'pausado') setDialogo({ titulo: 'Cantina pausou os pedidos', mensagem: 'A atendente pausou os pedidos por alguns minutos. Seu pedido continua salvo aqui. Tente confirmar de novo daqui a pouco.' })
      if (r.erro === 'esgotou') {
        setCarrinho(r.carrinho)
        setDialogo({ titulo: 'Um item acabou enquanto você pedia', mensagem: 'Ajustamos o pedido antes de enviar. Confira o novo total e confirme de novo.', lista: r.problemas })
      }
      return
    }
    setCarrinho({})
    setObs('')
    setAcompanhando(r.pedido.num)
    setRecemEnviado(r.pedido.num)
    setTela('acompanhar')
    // Pede permissão para avisar com notificação do celular quando o pedido ficar pronto
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission() } catch (e) { /* ignora */ }
  }

  function abrirPedido(num) {
    setAcompanhando(num)
    setAviso(null)
    setTela('acompanhar')
  }

  function abrirFolha(qual) {
    setFolha(qual)
    if (qual === 'avisos') setAvisosVistos(Date.now())
  }

  const ir = (t) => { setTela(t); if (t !== 'acompanhar') setRecemEnviado(null) }

  let conteudo
  if (tela === 'cardapio') conteudo = (
    <Cardapio db={db} carrinho={carrinho} mudarQtd={mudarQtd} busca={busca} setBusca={setBusca}
      categoria={categoria} setCategoria={setCategoria} abrirFolha={abrirFolha} temAvisoNovo={temAvisoNovo}
      ir={ir} qtdTotal={qtdTotal} total={total} />
  )
  if (tela === 'revisao') conteudo = (
    <Revisao db={db} carrinho={carrinho} mudarQtd={mudarQtd} limpar={limpar} obs={obs} setObs={setObs}
      confirmar={confirmar} ir={ir} qtdTotal={qtdTotal} total={total} />
  )
  if (tela === 'acompanhar') conteudo = (
    <Acompanhamento pedido={acharPedido(db, acompanhando) || meus[0]} aluno={aluno} recemEnviado={recemEnviado === acompanhando} ir={ir} />
  )
  if (tela === 'pedidos') conteudo = <MeusPedidos meus={meus} abrir={abrirPedido} />
  if (tela === 'perfil') conteudo = <Perfil aluno={aluno} salvar={(p) => setAluno(salvarPerfil(p))} />

  const comAbas = TELAS_COM_ABAS.includes(tela)

  return (
    <div className={`app tela-${tela}${comAbas ? ' com-abas' : ''}${tela === 'cardapio' && qtdTotal ? ' com-carrinho' : ''}`}>
      <NavTopo tela={tela} ir={ir} aluno={aluno} />
      {conteudo}
      {comAbas && <BarraAbas tela={tela} ir={ir} />}

      {aviso && <AvisoPronto num={aviso} onAbrir={() => abrirPedido(aviso)} />}
      {toast && <Toast texto={toast.texto} onDesfazer={toast.desfazer && (() => { toast.desfazer(); setToast(null) })} />}

      {folha === 'local' && (
        <Folha titulo="Retirar em" onFechar={() => setFolha(null)}>
          <div className="opt"><span><b>{RETIRADA.local}</b><br /><small className="muted">Balcão 1 · intervalo {RETIRADA.intervalo}</small></span><span aria-hidden="true">✓</span></div>
          <p className="muted">Só a cantina do Bloco A atende durante o intervalo.</p>
        </Folha>
      )}
      {folha === 'avisos' && (
        <Folha titulo="Avisos" onFechar={() => setFolha(null)}>
          {avisos.map((a, i) => <div key={i} className="note">{a.texto}<small>{hora(a.t)}</small></div>)}
          <div className="note">Pedidos até {RETIRADA.limite} · preparo {RETIRADA.preparo} · pague na retirada.<small>Intervalo {RETIRADA.intervalo}</small></div>
        </Folha>
      )}
      {dialogo && <Dialogo {...dialogo} onFechar={() => setDialogo(null)} />}
    </div>
  )
}
