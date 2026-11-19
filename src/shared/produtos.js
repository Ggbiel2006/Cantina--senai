// Cardápio da cantina.
// BASE: itens fixos do sistema. Pelo painel (tela "Cardápio") a atendente pode:
//   - adicionar itens novos  → ficam em db.extras
//   - editar qualquer item   → itens novos são alterados em db.extras; itens da BASE
//                              guardam só as mudanças em db.ajustes (dá para restaurar)
// sincronizarProdutos() junta tudo aqui, para o app inteiro enxergar a mesma lista.
const BASE = [
  { id: 'sand',  nome: 'Sanduíche natural', curto: 'Sanduíche',       chip: 'Sanduíche',    desc: 'Pão integral, frango, alface', preco: 6.0, categoria: 'Lanches', img: '/img/sanduiche.webp', fem: false },
  { id: 'misto', nome: 'Misto quente',      curto: 'Misto quente',    chip: 'Misto quente', desc: 'Presunto e queijo',            preco: 5.0, categoria: 'Lanches', img: '/img/misto-quente.jpg', fem: false },
  { id: 'cox',   nome: 'Coxinha',           curto: 'Coxinha',         chip: 'Coxinha',      desc: '',                             preco: 4.5, categoria: 'Lanches', img: '/img/coxinha.jpg', fem: true },
  { id: 'suco',  nome: 'Suco de laranja',   curto: 'Suco de laranja', chip: 'Suco',         desc: '',                             preco: 4.0, categoria: 'Bebidas', img: '/img/suco-laranja.jpg', fem: false },
  { id: 'agua',  nome: 'Água mineral',      curto: 'Água',            chip: 'Água',         desc: '',                             preco: 2.5, categoria: 'Bebidas', img: '/img/agua.webp', fem: true },
]
const BASE_POR_ID = Object.fromEntries(BASE.map((p) => [p.id, p]))

export const CATEGORIAS = ['Todos', 'Lanches', 'Bebidas', 'Doces']
export const CATEGORIAS_ITEM = CATEGORIAS.filter((c) => c !== 'Todos')

/** Itens visíveis no cardápio (base + adicionados, sem os removidos). */
export const PRODUTOS = [...BASE]

/** Consulta por id. Inclui itens removidos, para pedidos antigos continuarem mostrando o nome. */
export const PRODUTO = Object.fromEntries(BASE.map((p) => [p.id, p]))

/** Item da base com as alterações feitas pela atendente aplicadas. */
function aplicarAjuste(base, ajuste) {
  if (!ajuste) return base
  const p = { ...base, ...ajuste, editado: true }
  if (ajuste.nome && ajuste.nome !== base.nome) { p.curto = ajuste.nome; p.chip = ajuste.nome; p.fem = null }
  return p
}

/** Chamado pelo store sempre que os dados mudam (nesta aba ou em outra). */
export function sincronizarProdutos(extras = [], ajustes = {}) {
  PRODUTOS.length = 0
  for (const b of BASE) {
    PRODUTO[b.id] = aplicarAjuste(b, ajustes[b.id])
    PRODUTOS.push(PRODUTO[b.id])
  }
  for (const p of extras) {
    PRODUTO[p.id] = { ...p, extra: true }
    if (!p.removido) PRODUTOS.push(PRODUTO[p.id])
  }
}

export const ehItemBase = (id) => id in BASE_POR_ID
export const itemOriginal = (id) => BASE_POR_ID[id]

/** Nome do item para mostrar em pedidos, mesmo que ele não exista mais. */
export const nomeDe = (id, campo = 'nome') => PRODUTO[id]?.[campo] ?? 'Item indisponível'

/* ---------------- validação (usada no painel e nos testes) ---------------- */

export const PRECO_MAX = 999.99

/** "4,50", "4.5", "R$ 4,50" → 4.5. Qualquer outra coisa (ex.: "1e2", "4,555", "-2") → NaN. */
export function lerPreco(txt) {
  const limpo = String(txt ?? '').replace(/R\$/i, '').replace(/\s/g, '')
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(limpo)) return NaN
  return Math.round(Number(limpo.replace(',', '.')) * 100) / 100
}

/** Preço para mostrar dentro de um campo de texto: 4.5 → "4,50". */
export const precoParaCampo = (n) => n.toFixed(2).replace('.', ',')

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const limparTexto = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

/** Confere os campos de um item. Devolve { nome, preco, img } com as mensagens de erro (vazias se estiver ok). */
export function validarItem({ nome, preco, categoria }, idIgnorar = null) {
  const n = limparTexto(nome)
  const valor = lerPreco(preco)
  const repetido = n && PRODUTOS.some((p) => p.id !== idIgnorar && semAcento(p.nome) === semAcento(n))
  return {
    nome: !n ? 'Escreva o nome do item.'
      : n.length < 2 ? 'Nome muito curto.'
      : repetido ? 'Já existe um item com esse nome no cardápio.' : '',
    preco: !String(preco ?? '').trim() ? 'Informe o preço.'
      : Number.isNaN(valor) ? 'Preço inválido. Use só números, por exemplo 4,50.'
      : valor <= 0 ? 'O preço precisa ser maior que zero.'
      : valor > PRECO_MAX ? 'Preço muito alto.' : '',
    categoria: CATEGORIAS_ITEM.includes(categoria) ? '' : 'Escolha uma categoria.',
  }
}

export const RETIRADA = { local: 'Cantina · Bloco A', balcao: 'balcão 1', limite: '9h50', preparo: '~5 min', intervalo: '9h40–10h00' }
export const PREVISAO_MIN = 6 // minutos entre o pedido e a previsão de retirada
