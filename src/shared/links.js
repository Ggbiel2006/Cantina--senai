/**
 * Limpa o link colado pela atendente.
 * - Link da página de resultados do Google Imagens (google.com/imgres?imgurl=...): extrai o link da imagem.
 * - Aceita http(s), "data:image" (o Google às vezes copia assim) e caminhos internos ("/img/...").
 */
export function normalizarLink(txt) {
  const link = String(txt ?? '').trim()
  if (!link) return ''
  if (link.startsWith('data:image/')) return link
  if (link.startsWith('/') && !link.startsWith('//')) return link
  try {
    const u = new URL(link)
    if (!/^https?:$/.test(u.protocol)) return ''
    const interno = u.searchParams.get('imgurl')
    if (/google\./.test(u.hostname) && interno) return interno
    return u.href
  } catch (e) {
    return ''
  }
}
