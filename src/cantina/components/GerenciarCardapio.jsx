import { useEffect, useRef, useState } from 'react'
import { PRODUTOS, PRODUTO, CATEGORIAS_ITEM, validarItem, precoParaCampo } from '../../shared/produtos.js'
import { adicionarProduto, editarProduto, removerProduto, restaurarProduto, temDisponivel } from '../../shared/store.js'
import { brl } from '../../shared/formato.js'
import { normalizarLink } from '../../shared/links.js'

const VAZIO = { nome: '', desc: '', preco: '', categoria: CATEGORIAS_ITEM[0], link: '' }

// Tela "Cardápio" do painel: a atendente adiciona, edita e remove itens.
export default function GerenciarCardapio({ db }) {
  const [campos, setCampos] = useState(VAZIO)
  const [editando, setEditando] = useState(null) // id do item em edição, ou null para "novo item"
  const [foto, setFoto] = useState('vazio') // 'vazio' | 'carregando' | 'ok' | 'erro'
  const [tentou, setTentou] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [removendo, setRemovendo] = useState(null)
  const formRef = useRef(null)
  const nomeRef = useRef(null)

  const mudar = (campo) => (e) => { setCampos((c) => ({ ...c, [campo]: e.target.value })); setSucesso('') }

  const img = normalizarLink(campos.link)
  const temTexto = campos.link.trim() !== ''
  // Link novo: volta para "carregando" até o <img> confirmar (onLoad) ou falhar (onError)
  useEffect(() => { setFoto(temTexto ? (img ? 'carregando' : 'erro') : 'vazio') }, [img, temTexto])

  // Se o item em edição for removido em outra aba, sai do modo edição
  useEffect(() => {
    if (editando && (!PRODUTO[editando] || PRODUTO[editando].removido)) cancelar()
  }, [db, editando])

  const erros = validarItem(campos, editando)
  erros.img = foto === 'vazio' ? 'Cole o link de uma foto do item.'
    : foto === 'erro' ? 'Esse link não abriu uma imagem. Use “Copiar endereço da imagem”.'
    : foto === 'carregando' ? 'Aguarde a foto carregar.' : ''
  const valido = !Object.values(erros).some(Boolean)

  function cancelar() {
    setCampos(VAZIO); setEditando(null); setTentou(false); setErro('')
  }

  function editar(p) {
    setCampos({ nome: p.nome, desc: p.desc || '', preco: precoParaCampo(p.preco), categoria: p.categoria, link: p.img || '' })
    setEditando(p.id); setTentou(false); setErro(''); setSucesso(''); setRemovendo(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => nomeRef.current?.focus({ preventScroll: true }), 50)
  }

  function enviar(e) {
    e.preventDefault()
    setTentou(true); setErro(''); setSucesso('')
    if (!valido) return
    const dados = { nome: campos.nome, desc: campos.desc, preco: campos.preco, categoria: campos.categoria, img }
    const r = editando ? editarProduto(editando, dados) : adicionarProduto(dados)
    if (!r.ok) { setErro(r.erro); return }
    setSucesso(editando
      ? `Alterações em “${r.produto.nome}” salvas. O cardápio dos alunos já foi atualizado.`
      : `“${r.produto.nome}” foi adicionado ao cardápio e já aparece para os alunos.`)
    cancelar()
  }

  const mostrar = (campo) => tentou && erros[campo]

  return (
    <section className="adm" aria-label="Gerenciar cardápio">
      <form ref={formRef} className={'adm-form' + (editando ? ' editando' : '')} onSubmit={enviar} noValidate>
        <h2>{editando ? 'Editar item' : 'Adicionar item ao cardápio'}</h2>
        {editando && <p className="fdica">Você está alterando <b>{PRODUTO[editando]?.nome}</b>. As mudanças valem para os próximos pedidos.</p>}

        <label className="flb" htmlFor="adm-link">Link da foto *</label>
        <input id="adm-link" type="url" className={'fin' + (mostrar('img') ? ' invalido' : '')} value={campos.link}
          onChange={mudar('link')} placeholder="https://… (cole o endereço da imagem)" autoComplete="off" />
        <p className="fdica">No Google Imagens, abra a foto, clique com o botão direito (ou segure o dedo) e escolha <b>“Copiar endereço da imagem”</b>.</p>

        <div className={'upload' + (foto === 'ok' ? ' tem' : '') + (foto === 'erro' || mostrar('img') ? ' invalido' : '')}>
          {img && (
            <img key={img} src={img} alt="Pré-visualização da foto" referrerPolicy="no-referrer"
              style={{ visibility: foto === 'ok' ? 'visible' : 'hidden' }}
              onLoad={() => setFoto('ok')} onError={() => setFoto('erro')} />
          )}
          {foto !== 'ok' && (
            <span className="vazio">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16m-2-2 1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4z" /><circle cx="9" cy="9" r="1.5" />
              </svg>
              <b>{foto === 'carregando' ? 'Carregando foto…' : foto === 'erro' ? 'Não foi possível abrir a imagem' : 'Pré-visualização da foto'}</b>
              <small>{foto === 'erro' ? 'Confira se o link é de uma imagem (.jpg, .png, .webp…) ou tente outra foto.' : 'A foto aparece aqui quando você colar o link.'}</small>
            </span>
          )}
        </div>
        {mostrar('img') && <p className="ferr">{erros.img}</p>}

        <label className="flb" htmlFor="adm-nome">Nome *</label>
        <input id="adm-nome" ref={nomeRef} className={'fin' + (mostrar('nome') ? ' invalido' : '')} value={campos.nome}
          onChange={mudar('nome')} maxLength={40} placeholder="Ex.: Pão de queijo" autoComplete="off" />
        {mostrar('nome') && <p className="ferr">{erros.nome}</p>}

        <label className="flb" htmlFor="adm-desc">Descrição (opcional)</label>
        <input id="adm-desc" className="fin" value={campos.desc} onChange={mudar('desc')} maxLength={60}
          placeholder="Ex.: Porção com 3 unidades" autoComplete="off" />

        <div className="fduas">
          <div>
            <label className="flb" htmlFor="adm-preco">Preço *</label>
            <div className={'fpreco' + (mostrar('preco') ? ' invalido' : '')}>
              <span>R$</span>
              <input id="adm-preco" inputMode="decimal" value={campos.preco} onChange={mudar('preco')} placeholder="0,00" maxLength={8} autoComplete="off" />
            </div>
          </div>
          <div>
            <label className="flb" htmlFor="adm-cat">Categoria</label>
            <select id="adm-cat" className="fin" value={campos.categoria} onChange={mudar('categoria')}>
              {CATEGORIAS_ITEM.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {mostrar('preco') && <p className="ferr">{erros.preco}</p>}

        <div className="fbtns">
          {editando && <button type="button" className="fsec" onClick={cancelar}>Cancelar</button>}
          <button type="submit" className="pbtn">{editando ? 'Salvar alterações' : 'Adicionar ao cardápio'}</button>
        </div>
        {erro && <p className="ferr" role="alert">{erro}</p>}
        {sucesso && <p className="fok" role="status">{sucesso}</p>}
      </form>

      <div className="adm-lista">
        <h2>Itens no cardápio ({PRODUTOS.length})</h2>
        <ul>
          {PRODUTOS.map((p) => {
            const ok = temDisponivel(db, p.id)
            return (
              <li key={p.id} className={'aitem' + (ok ? '' : ' off') + (editando === p.id ? ' sel' : '')}>
                <img src={p.img} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <div className="ainfo">
                  <b>{p.nome}</b>
                  <span>{p.categoria} · {brl(p.preco)}</span>
                  <span className="atags">
                    <span className={'atag' + (ok ? ' ok' : '')}>{ok ? 'Disponível' : 'Esgotado'}</span>
                    {p.extra && <span className="atag novo">Adicionado</span>}
                    {p.editado && <span className="atag novo">Alterado</span>}
                  </span>
                  {p.desc && <small>{p.desc}</small>}
                </div>
                {removendo === p.id ? (
                  <div className="arem">
                    <span>Tirar “{p.nome}” do cardápio?</span>
                    <button type="button" className="sim" onClick={() => { removerProduto(p.id); setRemovendo(null) }}>Remover</button>
                    <button type="button" onClick={() => setRemovendo(null)}>Cancelar</button>
                  </div>
                ) : (
                  <div className="aacoes">
                    <button type="button" className="abtn edit" onClick={() => editar(p)} aria-label={`Editar ${p.nome}`}>Editar</button>
                    {p.extra && <button type="button" className="abtn" onClick={() => setRemovendo(p.id)} aria-label={`Remover ${p.nome}`}>Remover</button>}
                    {p.editado && <button type="button" className="abtn edit" onClick={() => { restaurarProduto(p.id); if (editando === p.id) cancelar() }}>Restaurar original</button>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <p className="ahint">Para marcar um item como esgotado, use os botões de “Disponibilidade” acima. Os itens originais do sistema podem ser editados, mas não removidos.</p>
      </div>
    </section>
  )
}
