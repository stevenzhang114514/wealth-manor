/** 轻量 Toast（无第三方依赖，样式见 theme.css .wm-toast） */
let el = null
let timer = null

export function toast(message, type = 'info') {
  if (!el) {
    el = document.createElement('div')
    el.className = 'wm-toast'
    document.body.appendChild(el)
  }
  el.textContent = message
  el.dataset.type = type
  el.classList.add('show')
  clearTimeout(timer)
  timer = setTimeout(() => el.classList.remove('show'), 2200)
}

/** 金币飞入动画（奖励入账反馈，样式见 theme.css .coin-fly） */
export function flyCoin(text = '+10 🪙') {
  const coin = document.createElement('span')
  coin.className = 'coin-fly'
  coin.textContent = text
  document.body.appendChild(coin)
  setTimeout(() => coin.remove(), 1200)
}
