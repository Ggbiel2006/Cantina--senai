export const brl = (valor) => 'R$ ' + valor.toFixed(2).replace('.', ',')

export const hora = (ms) => {
  const d = new Date(ms)
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
}

export const haQuanto = (ms, agora = Date.now()) => {
  const min = Math.floor((agora - ms) / 60000)
  return min <= 0 ? 'agora' : `há ${min} min`
}

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
