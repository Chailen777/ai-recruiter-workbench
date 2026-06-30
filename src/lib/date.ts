export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatLongDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date)
}
