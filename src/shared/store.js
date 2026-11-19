// "Banco de dados" compartilhado entre os dois sistemas.
// Os dados ficam no localStorage do navegador e cada mudança é avisada para as
// outras abas (BroadcastChannel + evento storage). Assim, o pedido feito no
// sistema do aluno aparece na hora no painel da cantina, e vice-versa.
import { useSyncExternalStore } from 'react'
import { PRODUTO, sincronizarProdutos, nomeDe, ehItemBase, itemOriginal, validarItem, lerPreco, limparTexto } from './produtos.js'

const CHAVE = 'cantina-pedidos:v1'
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cantina-pedidos') : null
const ouvintes = new Set()

function dadosIniciais() {
  const agora = Date.now()
  const min = 60000
  return {
    disponivel: { sand: true, misto: true, cox: false, suco: true, agua: true },
    estoque: { suco: 5 }, // itens com contagem: mostram "últimas unidades"
    pedidos: [
      {
        num: 'A25', alunoId: 'exemplo-bia', nome: 'Bia Costa', turma: '2º A',
        itens: [{ id: 'suco', qtd: 2 }], obs: '', total: 8,
        status: 'pronto', t: { recebido: agora - 6 * min, preparo: agora - 5 * min, pronto: agora - 1 * min },
      },
    ],
    entregues: [],
    entreguesAntes: 12,
    proximoNumero: 27,
    pausado: false,
    encerrado: false,
    extras: [], // itens adicionados pela atendente (tela "Cardápio" do painel)
    ajustes: {}, // alterações feitas pela atendente nos itens originais
  }
}

function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo)
  } catch (e) { /* sem acesso ao armazenamento: usa os dados iniciais */ }
  return dadosIniciais()
}

let estado

function usar(novo) {
  // dados salvos por versões anteriores não têm estes campos
  if (!novo.extras || !novo.ajustes) novo = { ...novo, extras: novo.extras || [], ajustes: novo.ajustes || {} }
  sincronizarProdutos(novo.extras, novo.ajustes)
  estado = novo
}

usar(carregar())

function avisar() { ouvintes.forEach((fn) => fn()) }

/** Salva e avisa as outras abas. Devolve false se o navegador não conseguiu salvar (ex.: sem espaço). */
function gravar(novo) {
  let salvou = true
  try { localStorage.setItem(CHAVE, JSON.stringify(novo)) } catch (e) { salvou = false }
  usar(novo)
  canal?.postMessage('mudou')
  avisar()
  return salvou
}

function recarregar() { usar(carregar()); avisar() }
if (canal) canal.onmessage = recarregar
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === CHAVE) recarregar() })
}

function assinar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn) }

/** Hook React: devolve os dados atuais e re-renderiza quando qualquer aba muda algo. */
export function useBanco() {
  return useSyncExternalStore(assinar, () => estado)
}

/* ---------------- regras de negócio ---------------- */

export const temDisponivel = (db, id) =>
  db.disponivel[id] && (db.estoque[id] == null || db.estoque[id] > 0)

export const ultimasUnidades = (db, id) =>
  db.estoque[id] != null && db.estoque[id] > 0 && db.estoque[id] <= 5

export const textoItens = (itens, campo = 'curto') =>
  itens.map((i) => `${i.qtd}× ${nomeDe(i.id, campo)}`).join(', ')

// Soma em centavos para não aparecer erro de arredondamento (ex.: 0,1 + 0,2 = 0,30000000000000004)
export const totalDe = (itens) =>
  itens.reduce((s, i) => s + Math.round((PRODUTO[i.id]?.preco ?? 0) * 100) * i.qtd, 0) / 100

/**
 * Envia o pedido do aluno. Antes de enviar, confere de novo a disponibilidade:
 * se algo acabou nesse meio-tempo, devolve o erro e o carrinho ajustado.
 */
export function enviarPedido({ aluno, carrinho, obs }) {
  const db = estado
  if (db.encerrado) return { ok: false, erro: 'encerrado' }
  if (db.pausado) return { ok: false, erro: 'pausado' }

  const problemas = []
  const ajustado = {}
  for (const [id, qtd] of Object.entries(carrinho)) {
    if (!PRODUTO[id]) continue // item que não existe mais no cardápio
    if (!temDisponivel(db, id)) { problemas.push(`${PRODUTO[id].nome}: esgotou`); continue }
    const resta = db.estoque[id]
    if (resta != null && qtd > resta) { problemas.push(`${PRODUTO[id].nome}: ${resta === 1 ? 'só resta 1' : `só restam ${resta}`}`); ajustado[id] = resta; continue }
    ajustado[id] = qtd
  }
  if (problemas.length) return { ok: false, erro: 'esgotou', problemas, carrinho: ajustado }

  const itens = Object.entries(carrinho).filter(([id, qtd]) => PRODUTO[id] && qtd > 0).map(([id, qtd]) => ({ id, qtd }))
  if (!itens.length) return { ok: false, erro: 'vazio' }
  const pedido = {
    num: 'A' + db.proximoNumero,
    alunoId: aluno.id, nome: aluno.nome, turma: aluno.turmaCurta,
    itens, obs: obs.trim(), total: totalDe(itens),
    status: 'recebido', t: { recebido: Date.now() },
  }
  const estoque = { ...db.estoque }
  itens.forEach((i) => { if (estoque[i.id] != null) estoque[i.id] = Math.max(0, estoque[i.id] - i.qtd) })

  gravar({ ...db, estoque, pedidos: [...db.pedidos, pedido], proximoNumero: db.proximoNumero + 1 })
  return { ok: true, pedido }
}

/** Painel: Recebido → Em preparo → Pronto. */
export function avancarPedido(num) {
  const db = estado
  const pedidos = db.pedidos.map((p) => {
    if (p.num !== num) return p
    if (p.status === 'recebido') return { ...p, status: 'preparo', t: { ...p.t, preparo: Date.now() } }
    if (p.status === 'preparo') return { ...p, status: 'pronto', t: { ...p.t, pronto: Date.now() } }
    return p
  })
  gravar({ ...db, pedidos })
}

/** Painel: entrega conferida e paga. O pedido sai da coluna "Prontos". */
export function entregarPedido(num) {
  const db = estado
  const p = db.pedidos.find((x) => x.num === num)
  if (!p) return
  const entregue = { ...p, status: 'entregue', t: { ...p.t, entregue: Date.now() } }
  gravar({ ...db, pedidos: db.pedidos.filter((x) => x.num !== num), entregues: [...db.entregues, entregue] })
}

/** Painel: liga/desliga um item. O cardápio do aluno atualiza na hora. */
export function alternarItem(id) {
  const db = estado
  if (db.estoque[id] === 0) { // repõe um item que acabou pela contagem
    gravar({ ...db, estoque: { ...db.estoque, [id]: 5 }, disponivel: { ...db.disponivel, [id]: true } })
    return
  }
  gravar({ ...db, disponivel: { ...db.disponivel, [id]: !db.disponivel[id] } })
}

export const alternarPausa = () => gravar({ ...estado, pausado: !estado.pausado })
export const alternarEncerrado = () => gravar({ ...estado, encerrado: !estado.encerrado })
// Reinicia pedidos e disponibilidade, mas mantém os itens que a atendente adicionou ao cardápio.
export const reiniciarDados = () => {
  const { extras, ajustes } = estado
  const ini = dadosIniciais()
  const disponivel = { ...ini.disponivel }
  extras.forEach((p) => { disponivel[p.id] = !p.removido })
  gravar({ ...ini, extras, ajustes, disponivel })
}

/** Volta tudo ao início, inclusive o cardápio (usado pelos testes). */
export const apagarTudo = () => gravar(dadosIniciais())

/* ---------------- cardápio (painel da atendente) ---------------- */

/** Lê e confere os campos digitados no formulário do painel. */
function camposLimpos(campos, idIgnorar) {
  const erros = validarItem(campos, idIgnorar)
  const img = String(campos.img ?? '').trim()
  if (!img) erros.img = 'Informe a foto do item.'
  const primeiro = Object.values(erros).find(Boolean)
  if (primeiro) return { erro: primeiro }
  return {
    dados: {
      nome: limparTexto(campos.nome), desc: limparTexto(campos.desc),
      preco: lerPreco(campos.preco), categoria: campos.categoria, img,
    },
  }
}

/** Salva; se o navegador não tiver espaço, volta ao estado anterior. */
function gravarOuDesfazer(novo, anterior) {
  if (gravar(novo)) return true
  gravar(anterior)
  return false
}

/**
 * Adiciona um item novo ao cardápio. `img` é o link da foto (ex.: copiado do Google Imagens).
 * `preco` pode vir como texto do formulário ("4,50") ou número.
 * Devolve { ok: true, produto } ou { ok: false, erro: 'mensagem' }.
 */
export function adicionarProduto(campos) {
  const db = estado
  const { dados, erro } = camposLimpos({ ...campos, preco: String(campos.preco) })
  if (erro) return { ok: false, erro }
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  const produto = { id, ...dados, curto: dados.nome, chip: dados.nome, fem: null, criadoEm: Date.now() }
  const novo = { ...db, extras: [...db.extras, produto], disponivel: { ...db.disponivel, [id]: true } }
  if (!gravarOuDesfazer(novo, db)) return { ok: false, erro: 'Não há mais espaço para salvar neste navegador.' }
  return { ok: true, produto }
}

/** Altera nome, descrição, preço, categoria ou foto de qualquer item do cardápio. */
export function editarProduto(id, campos) {
  const db = estado
  if (!PRODUTO[id] || PRODUTO[id].removido) return { ok: false, erro: 'Esse item não está mais no cardápio.' }
  const { dados, erro } = camposLimpos({ ...campos, preco: String(campos.preco) }, id)
  if (erro) return { ok: false, erro }

  let novo
  if (ehItemBase(id)) {
    // guarda só o que ficou diferente do original
    const orig = itemOriginal(id)
    const ajuste = Object.fromEntries(Object.entries(dados).filter(([k, v]) => orig[k] !== v))
    const ajustes = { ...db.ajustes }
    if (Object.keys(ajuste).length) ajustes[id] = ajuste
    else delete ajustes[id]
    novo = { ...db, ajustes }
  } else {
    novo = { ...db, extras: db.extras.map((p) => (p.id === id ? { ...p, ...dados, curto: dados.nome, chip: dados.nome } : p)) }
  }
  if (!gravarOuDesfazer(novo, db)) return { ok: false, erro: 'Não há mais espaço para salvar neste navegador.' }
  return { ok: true, produto: PRODUTO[id] }
}

/** Desfaz as alterações feitas num item original do sistema. */
export function restaurarProduto(id) {
  const ajustes = { ...estado.ajustes }
  delete ajustes[id]
  gravar({ ...estado, ajustes })
}

/** Tira do cardápio um item adicionado. Ele continua registrado para os pedidos antigos. */
export function removerProduto(id) {
  const db = estado
  gravar({
    ...db,
    extras: db.extras.map((p) => (p.id === id ? { ...p, removido: true, img: null } : p)),
    disponivel: { ...db.disponivel, [id]: false },
  })
}

/** Busca um pedido em andamento ou já entregue. */
export const acharPedido = (db, num) =>
  db.pedidos.find((p) => p.num === num) || db.entregues.find((p) => p.num === num)
