import { useState } from 'react'
import { RETIRADA } from '../../shared/produtos.js'

export default function Perfil({ aluno, salvar }) {
  const [nome, setNome] = useState(aluno.nome)
  const [turma, setTurma] = useState(aluno.turma)
  const [salvo, setSalvo] = useState(false)
  const iniciais = aluno.nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const valido = nome.trim().length >= 2 && turma.trim().length >= 2

  function enviar(e) {
    e.preventDefault()
    if (!valido) return
    salvar({ ...aluno, nome: nome.trim(), turma: turma.trim() })
    setSalvo(true)
  }

  return (
    <>
      <header className="hdr"><h1 className="left">Perfil</h1></header>
      <main className="content narrow">
        <div className="avatar" aria-hidden="true">{iniciais}</div>
        <form className="form" onSubmit={enviar}>
          <label className="lb" htmlFor="nome">Nome no pedido</label>
          <input id="nome" className="input" maxLength={40} autoComplete="name" value={nome} onChange={(e) => { setNome(e.target.value); setSalvo(false) }} />
          <label className="lb" htmlFor="turma">Turma</label>
          <input id="turma" className="input" maxLength={20} value={turma} onChange={(e) => { setTurma(e.target.value); setSalvo(false) }} placeholder="Ex.: 2º ano B" />
          {!valido && <p className="err">Preencha nome e turma para a atendente conferir na entrega.</p>}
          <button type="submit" className="primary" disabled={!valido}>Salvar</button>
          {salvo && <p className="okmsg" role="status">Dados salvos. Eles aparecem nos próximos pedidos.</p>}
        </form>
        <div>
          <div className="prow"><span>Retirada</span><span>{RETIRADA.local}</span></div>
          <div className="prow"><span>Aviso de pedido pronto</span><span>Ligado (com vibração)</span></div>
        </div>
      </main>
    </>
  )
}
