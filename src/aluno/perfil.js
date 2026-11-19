// Dados do aluno neste aparelho (nome e turma aparecem no pedido e no painel).
const CHAVE = 'cantina-aluno:perfil'

const turmaCurta = (turma) => turma.replace(/\s*ano\s*/i, ' ').replace(/\s+/g, ' ').trim()

export function lerPerfil() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE))
    if (salvo?.id) return { ...salvo, turmaCurta: turmaCurta(salvo.turma) }
  } catch (e) { /* ignora */ }
  const novo = { id: 'aluno-' + Math.random().toString(36).slice(2, 9), nome: 'Ana Souza', turma: '2º ano B' }
  try { localStorage.setItem(CHAVE, JSON.stringify(novo)) } catch (e) { /* ignora */ }
  return { ...novo, turmaCurta: turmaCurta(novo.turma) }
}

export function salvarPerfil(perfil) {
  const { id, nome, turma } = perfil
  try { localStorage.setItem(CHAVE, JSON.stringify({ id, nome, turma })) } catch (e) { /* ignora */ }
  return { id, nome, turma, turmaCurta: turmaCurta(turma) }
}
