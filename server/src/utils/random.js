/**
 * 确定性伪随机数生成器（LCG）
 * 用于 Mock 数据的趋势模拟：固定种子 → 每次启动数据一致，便于演示与测试断言。
 */
export function createSeededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

/** 打乱数组（Fisher-Yates，可注入随机源以便测试） */
export function shuffle(arr, rand = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
