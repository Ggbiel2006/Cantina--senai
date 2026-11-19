// Testes das regras do sistema (preços, cardápio, pedidos e estoque).
// Rodar com: npm test
// O "banco" usa o localStorage do navegador; aqui ele é simulado em memória.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const memoria = new Map()
let limiteBytes = Infinity // para simular "sem espaço no navegador"
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => {
    if (String(v).length > limiteBytes) throw new Error('QuotaExceededError')
    memoria.set(k, String(v))
  },
  removeItem: (k) => memoria.delete(k),
}
globalThis.BroadcastChannel = undefined
globalThis.window = { addEventListener() {} }

const P = await import('../src/shared/produtos.js')
const S = await import('../src/shared/store.js')
const { brl } = await import('../src/shared/formato.js')
const { normalizarLink } = await import('../src/shared/links.js')

const IMG = 'https://exemplo.com/foto.jpg'
// lê o estado salvo (mesmo objeto que os componentes recebem)
function estadoAtual() { return JSON.parse(localStorage.getItem('cantina-pedidos:v1')) }
const aluno = { id: 'teste', nome: 'Teste Silva', turmaCurta: '2º B' }

beforeEach(() => {
  limiteBytes = Infinity
  S.apagarTudo() // cada teste começa do zero, sem itens adicionados nem edições
})

/* ---------------- preço ---------------- */

test('lerPreco aceita formatos comuns de preço', () => {
  assert.equal(P.lerPreco('4,50'), 4.5)
  assert.equal(P.lerPreco('4.5'), 4.5)
  assert.equal(P.lerPreco('R$ 4,50'), 4.5)
  assert.equal(P.lerPreco(' 10 '), 10)
  assert.equal(P.lerPreco('0,10'), 0.1)
  assert.equal(P.lerPreco('999,99'), 999.99)
})

test('lerPreco recusa preços estranhos', () => {
  for (const ruim of ['', 'abc', '1e2', '-2', '4,555', '4,5,0', '1.234,56', '1000', ',50', '4,', 'Infinity', 'NaN', '0x10']) {
    assert.ok(Number.isNaN(P.lerPreco(ruim)), `deveria recusar "${ruim}"`)
  }
})

test('brl formata em reais', () => {
  assert.equal(brl(4.5), 'R$ 4,50')
  assert.equal(brl(0), 'R$ 0,00')
  assert.equal(brl(0.1 + 0.2), 'R$ 0,30')
})

test('total do pedido não tem erro de arredondamento', () => {
  const r = S.adicionarProduto({ nome: 'Bala', desc: '', preco: '0,10', categoria: 'Doces', img: IMG })
  assert.ok(r.ok)
  const total = S.totalDe([{ id: r.produto.id, qtd: 3 }])
  assert.equal(total, 0.3) // 0.1 * 3 em ponto flutuante daria 0.30000000000000004
  assert.equal(S.totalDe([{ id: 'sand', qtd: 1 }, { id: 'cox', qtd: 2 }, { id: 'agua', qtd: 1 }]), 17.5)
})

/* ---------------- validação de itens ---------------- */

test('validarItem aponta campos vazios e inválidos', () => {
  const e = P.validarItem({ nome: '  ', preco: '', categoria: 'Lanches' })
  assert.ok(e.nome); assert.ok(e.preco)
  assert.ok(P.validarItem({ nome: 'X', preco: '2', categoria: 'Lanches' }).nome, 'nome de 1 letra')
  assert.ok(P.validarItem({ nome: 'Bolo', preco: '0', categoria: 'Doces' }).preco, 'preço zero')
  assert.ok(P.validarItem({ nome: 'Bolo', preco: '2', categoria: 'Pizza' }).categoria, 'categoria inexistente')
  const ok = P.validarItem({ nome: 'Bolo de cenoura', preco: '3,50', categoria: 'Doces' })
  assert.deepEqual(Object.values(ok).filter(Boolean), [])
})

test('não deixa cadastrar nome repetido (ignora maiúsculas, acentos e espaços)', () => {
  for (const nome of ['Coxinha', 'COXINHA', '  coxinha  ', 'agua mineral', 'Água   Mineral']) {
    assert.ok(P.validarItem({ nome, preco: '3', categoria: 'Lanches' }).nome, `"${nome}" deveria ser repetido`)
  }
  // editando o próprio item, o nome dele não conta como repetido
  assert.equal(P.validarItem({ nome: 'Coxinha', preco: '3', categoria: 'Lanches' }, 'cox').nome, '')
})

test('links de foto', () => {
  assert.equal(normalizarLink(''), '')
  assert.equal(normalizarLink('  https://site.com/a.jpg  '), 'https://site.com/a.jpg')
  assert.equal(normalizarLink('javascript:alert(1)'), '')
  assert.equal(normalizarLink('ftp://site.com/a.jpg'), '')
  assert.equal(normalizarLink('foto.jpg'), '')
  assert.equal(normalizarLink('/img/coxinha.jpg'), '/img/coxinha.jpg')
  assert.equal(normalizarLink('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA')
  assert.equal(
    normalizarLink('https://www.google.com/imgres?imgurl=https%3A%2F%2Ffotos.com%2Fbolo.jpg&imgrefurl=x'),
    'https://fotos.com/bolo.jpg',
  )
})

/* ---------------- adicionar, editar, remover ---------------- */

test('adicionar item: aparece no cardápio, disponível, com texto limpo', () => {
  const r = S.adicionarProduto({ nome: '  Pão   de queijo ', desc: ' 3 unidades ', preco: '3,5', categoria: 'Lanches', img: IMG })
  assert.ok(r.ok, r.erro)
  assert.equal(r.produto.nome, 'Pão de queijo')
  assert.equal(r.produto.desc, '3 unidades')
  assert.equal(r.produto.preco, 3.5)
  assert.ok(P.PRODUTOS.some((p) => p.id === r.produto.id))
  assert.ok(S.temDisponivel(estadoAtual(), r.produto.id))
})

test('adicionar item recusa dados inválidos', () => {
  assert.equal(S.adicionarProduto({ nome: 'Bolo', desc: '', preco: '1e2', categoria: 'Doces', img: IMG }).ok, false)
  assert.equal(S.adicionarProduto({ nome: 'Bolo', desc: '', preco: '3', categoria: 'Doces', img: '' }).ok, false)
  assert.equal(S.adicionarProduto({ nome: 'Coxinha', desc: '', preco: '3', categoria: 'Lanches', img: IMG }).ok, false)
  assert.equal(P.PRODUTOS.length, 5)
})

test('dois itens adicionados ao mesmo tempo têm ids diferentes', () => {
  const a = S.adicionarProduto({ nome: 'Bolo', desc: '', preco: '3', categoria: 'Doces', img: IMG })
  const b = S.adicionarProduto({ nome: 'Brigadeiro', desc: '', preco: '2', categoria: 'Doces', img: IMG })
  assert.notEqual(a.produto.id, b.produto.id)
})

test('editar preço e descrição de item original e restaurar', () => {
  const r = S.editarProduto('misto', { nome: 'Misto quente', desc: 'Presunto, queijo e orégano', preco: '5,50', categoria: 'Lanches', img: '/img/misto-quente.jpg' })
  assert.ok(r.ok, r.erro)
  assert.equal(P.PRODUTO.misto.preco, 5.5)
  assert.equal(P.PRODUTO.misto.desc, 'Presunto, queijo e orégano')
  assert.equal(P.PRODUTO.misto.editado, true)
  assert.deepEqual(estadoAtual().ajustes.misto, { desc: 'Presunto, queijo e orégano', preco: 5.5 }) // só o que mudou
  assert.equal(S.totalDe([{ id: 'misto', qtd: 2 }]), 11)
  S.restaurarProduto('misto')
  assert.equal(P.PRODUTO.misto.preco, 5)
  assert.equal(P.PRODUTO.misto.editado, undefined)
})

test('editar sem mudar nada não marca o item como alterado', () => {
  const m = P.PRODUTO.misto
  assert.ok(S.editarProduto('misto', { nome: m.nome, desc: m.desc, preco: '5,00', categoria: m.categoria, img: m.img }).ok)
  assert.equal(estadoAtual().ajustes.misto, undefined)
})

test('editar item adicionado e bloquear nome repetido', () => {
  const { produto } = S.adicionarProduto({ nome: 'Bolo', desc: '', preco: '3', categoria: 'Doces', img: IMG })
  assert.ok(S.editarProduto(produto.id, { nome: 'Bolo de chocolate', desc: 'Fatia', preco: '4', categoria: 'Doces', img: IMG }).ok)
  assert.equal(P.PRODUTO[produto.id].nome, 'Bolo de chocolate')
  assert.equal(P.PRODUTO[produto.id].chip, 'Bolo de chocolate')
  const dup = S.editarProduto(produto.id, { nome: 'Coxinha', desc: '', preco: '4', categoria: 'Doces', img: IMG })
  assert.equal(dup.ok, false)
  assert.equal(P.PRODUTO[produto.id].nome, 'Bolo de chocolate')
})

test('pedido antigo mantém o valor cobrado mesmo após mudar o preço', () => {
  const r = S.enviarPedido({ aluno, carrinho: { misto: 1 }, obs: '' })
  assert.ok(r.ok)
  S.editarProduto('misto', { nome: 'Misto quente', desc: 'Presunto e queijo', preco: '9', categoria: 'Lanches', img: '/img/misto-quente.jpg' })
  assert.equal(estadoAtual().pedidos.find((p) => p.num === r.pedido.num).total, 5)
})

test('remover item: some do cardápio, mas pedidos antigos continuam mostrando o nome', () => {
  const { produto } = S.adicionarProduto({ nome: 'Pipoca', desc: '', preco: '2', categoria: 'Lanches', img: IMG })
  const r = S.enviarPedido({ aluno, carrinho: { [produto.id]: 2 }, obs: '' })
  assert.ok(r.ok)
  S.removerProduto(produto.id)
  assert.ok(!P.PRODUTOS.some((p) => p.id === produto.id))
  assert.equal(S.textoItens(r.pedido.itens), '2× Pipoca')
  assert.equal(S.editarProduto(produto.id, { nome: 'Pipoca', desc: '', preco: '2', categoria: 'Lanches', img: IMG }).ok, false)
  // nome do item removido pode ser usado de novo
  assert.ok(S.adicionarProduto({ nome: 'Pipoca', desc: '', preco: '2', categoria: 'Lanches', img: IMG }).ok)
})

test('item desconhecido não quebra a tela', () => {
  assert.equal(S.textoItens([{ id: 'nao-existe', qtd: 1 }]), '1× Item indisponível')
  assert.equal(S.totalDe([{ id: 'nao-existe', qtd: 1 }]), 0)
})

test('sem espaço no navegador: avisa e não perde os dados', () => {
  limiteBytes = JSON.stringify(estadoAtual()).length + 10
  const r = S.adicionarProduto({ nome: 'Bolo', desc: '', preco: '3', categoria: 'Doces', img: IMG })
  assert.equal(r.ok, false)
  assert.match(r.erro, /espaço/)
  assert.equal(P.PRODUTOS.length, 5)
})

/* ---------------- pedidos e estoque ---------------- */

test('fluxo completo: pedido → preparo → pronto → entregue', () => {
  const r = S.enviarPedido({ aluno, carrinho: { sand: 1, agua: 2 }, obs: '  sem alface ' })
  assert.ok(r.ok)
  assert.equal(r.pedido.total, 11)
  assert.equal(r.pedido.obs, 'sem alface')
  S.avancarPedido(r.pedido.num)
  assert.equal(S.acharPedido(estadoAtual(), r.pedido.num).status, 'preparo')
  S.avancarPedido(r.pedido.num)
  assert.equal(S.acharPedido(estadoAtual(), r.pedido.num).status, 'pronto')
  S.avancarPedido(r.pedido.num) // clicar de novo não pula etapa
  assert.equal(S.acharPedido(estadoAtual(), r.pedido.num).status, 'pronto')
  S.entregarPedido(r.pedido.num)
  assert.equal(S.acharPedido(estadoAtual(), r.pedido.num).status, 'entregue')
})

test('números de pedido não se repetem', () => {
  const a = S.enviarPedido({ aluno, carrinho: { agua: 1 }, obs: '' })
  const b = S.enviarPedido({ aluno, carrinho: { agua: 1 }, obs: '' })
  assert.notEqual(a.pedido.num, b.pedido.num)
})

test('estoque: não vende mais do que tem e esgota ao chegar em zero', () => {
  const muito = S.enviarPedido({ aluno, carrinho: { suco: 6 }, obs: '' })
  assert.equal(muito.ok, false)
  assert.equal(muito.erro, 'esgotou')
  assert.equal(muito.carrinho.suco, 5)
  assert.ok(S.enviarPedido({ aluno, carrinho: { suco: 5 }, obs: '' }).ok)
  assert.equal(estadoAtual().estoque.suco, 0)
  assert.equal(S.temDisponivel(estadoAtual(), 'suco'), false)
})

test('mensagem de estoque usa singular quando resta 1', () => {
  S.enviarPedido({ aluno, carrinho: { suco: 4 }, obs: '' })
  const r = S.enviarPedido({ aluno, carrinho: { suco: 2 }, obs: '' })
  assert.deepEqual(r.problemas, ['Suco de laranja: só resta 1'])
})

test('item esgotado (coxinha) não pode ser pedido', () => {
  const r = S.enviarPedido({ aluno, carrinho: { cox: 1 }, obs: '' })
  assert.equal(r.ok, false)
  assert.deepEqual(r.problemas, ['Coxinha: esgotou'])
})

test('carrinho vazio ou com quantidade zero não vira pedido', () => {
  assert.equal(S.enviarPedido({ aluno, carrinho: {}, obs: '' }).erro, 'vazio')
  assert.equal(S.enviarPedido({ aluno, carrinho: { agua: 0 }, obs: '' }).erro, 'vazio')
})

test('pausado e encerrado bloqueiam novos pedidos', () => {
  S.alternarPausa()
  assert.equal(S.enviarPedido({ aluno, carrinho: { agua: 1 }, obs: '' }).erro, 'pausado')
  S.alternarPausa()
  S.alternarEncerrado()
  assert.equal(S.enviarPedido({ aluno, carrinho: { agua: 1 }, obs: '' }).erro, 'encerrado')
})

test('reiniciar dados mantém itens adicionados e edições', () => {
  const { produto } = S.adicionarProduto({ nome: 'Bolo', desc: '', preco: '3', categoria: 'Doces', img: IMG })
  S.editarProduto('agua', { nome: 'Água mineral', desc: '500 ml', preco: '3', categoria: 'Bebidas', img: '/img/agua.webp' })
  S.reiniciarDados()
  assert.ok(P.PRODUTOS.some((p) => p.id === produto.id))
  assert.equal(P.PRODUTO.agua.preco, 3)
  assert.equal(estadoAtual().pedidos.length, 1) // só o pedido de exemplo
})
