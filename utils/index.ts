/**
 * 格式化工时显示
 * @param hours 工时，8.5 表示 8小时30分钟
 * @returns 格式化后的文本，例如 "8小时30分钟"
 */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  if (m === 0) {
    return `${h}小时`
  }

  return `${h}小时${m}分钟`
}
