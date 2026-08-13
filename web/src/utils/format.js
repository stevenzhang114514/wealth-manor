/** 金额/百分比格式化工具 */

export function formatMoney(n) {
  return '¥' + Math.round(n).toLocaleString('zh-CN')
}

export function formatSigned(n) {
  return (n >= 0 ? '+' : '') + formatMoney(n)
}

export function formatPct(p, digits = 2) {
  return (p * 100).toFixed(digits) + '%'
}

export function formatWan(n) {
  const w = n / 10000
  return w >= 100 ? Math.round(w) + '万' : w.toFixed(1) + '万'
}
