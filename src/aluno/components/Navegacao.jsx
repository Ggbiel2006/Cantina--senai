// Celular: barra de abas embaixo (como no wireframe). Computador: links no topo.
const ABAS = [
  { id: 'cardapio', rotulo: 'Cardápio', icone: '' },
  { id: 'pedidos', rotulo: 'Meus pedidos', icone: '' },
  { id: 'perfil', rotulo: 'Perfil', icone: 'c' },
]

export function BarraAbas({ tela, ir }) {
  return (
    <nav className="tabs" aria-label="Navegação principal">
      {ABAS.map((a) => (
        <button key={a.id} type="button" onClick={() => ir(a.id)} aria-current={tela === a.id ? 'page' : undefined}>
          <span className={'ti ' + a.icone} aria-hidden="true" />
          {a.rotulo}
        </button>
      ))}
    </nav>
  )
}

export function NavTopo({ tela, ir, aluno }) {
  return (
    <div className="topnav">
      <div className="brand"><b>Cantina · Bloco A</b><span>Olá, {aluno.nome.split(' ')[0]}</span></div>
      <nav aria-label="Navegação principal">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => ir(a.id)} aria-current={tela === a.id ? 'page' : undefined}>{a.rotulo}</button>
        ))}
      </nav>
    </div>
  )
}
