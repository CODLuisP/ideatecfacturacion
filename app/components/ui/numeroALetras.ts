export function numeroALetras(monto: number, moneda: string = 'SOLES'): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  const convertirGrupo = (n: number): string => {
    if (n === 0) return ''
    if (n === 100) return 'CIEN'
    if (n < 10) return unidades[n]
    if (n < 20) return especiales[n - 10]
    if (n < 100) {
      const d = Math.floor(n / 10)
      const u = n % 10
      return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`
    }
    const c = Math.floor(n / 100)
    const resto = n % 100
    return resto === 0 ? centenas[c] : `${centenas[c]} ${convertirGrupo(resto)}`
  }

  const entero = Math.floor(monto)
  const centavos = Math.round((monto - entero) * 100)

  let resultado = ''
  if (entero === 0) {
    resultado = 'CERO'
  } else if (entero < 1000) {
    resultado = convertirGrupo(entero)
  } else if (entero < 1000000) {
    const miles = Math.floor(entero / 1000)
    const resto = entero % 1000
    const strMiles = miles === 1 ? 'MIL' : `${convertirGrupo(miles)} MIL`
    resultado = resto === 0 ? strMiles : `${strMiles} ${convertirGrupo(resto)}`
  }

  const strCentavos = String(centavos).padStart(2, '0')
  return `SON ${resultado} CON ${strCentavos}/100 ${moneda}`
}