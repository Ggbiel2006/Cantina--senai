import { PRODUTOS } from '../../shared/produtos.js'
import { alternarItem } from '../../shared/store.js'

// A atendente liga e desliga cada item; o cardápio do aluno atualiza na hora.
export default function Disponibilidade({ db }) {
  return (
    <div className="disp" role="group" aria-label="Disponibilidade dos itens">
      <b>Disponibilidade:</b>
      <div className="togs">
        {PRODUTOS.map((p) => {
          const ligado = db.disponivel[p.id] && db.estoque[p.id] !== 0
          const resta = db.estoque[p.id]
          const rotulo = !ligado ? `${p.chip} — ${p.fem === true ? 'esgotada' : p.fem === false ? 'esgotado' : 'em falta'}`
            : resta != null ? `${p.chip} · ${resta} ${resta === 1 ? 'restante' : 'restantes'}` : p.chip
          return (
            <button key={p.id} type="button" className="tog" aria-pressed={ligado} onClick={() => alternarItem(p.id)}>
              <span className="cb" aria-hidden="true">{ligado ? '✓' : ''}</span>{rotulo}
            </button>
          )
        })}
      </div>
    </div>
  )
}
