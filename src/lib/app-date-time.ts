/**
 * 工作台统一使用北京时间。
 *
 * datetime-local 不携带时区；如果直接在 Vercel（UTC）上 new Date(value)，
 * 用户输入的 15:30 会被当成 UTC，回到中国浏览器后显示成 23:30。
 */
export const APP_TIME_ZONE = 'Asia/Shanghai'
const APP_UTC_OFFSET = '+08:00'

const DATE_TIME_LOCAL_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
const DATE_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function assertValidDate(date: Date, source: string) {
  if (Number.isNaN(date.getTime())) {
    throw new Error(`无效的日期时间：${source}`)
  }
  return date
}

/** 把 datetime-local 值按北京时间解析为绝对时间。 */
export function parseAppDateTime(value: string): Date {
  const match = DATE_TIME_LOCAL_RE.exec(value)
  if (!match) throw new Error(`无效的日期时间格式：${value}`)

  const [, year, month, day, hour, minute, second = '00'] = match
  return assertValidDate(
    new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${APP_UTC_OFFSET}`),
    value,
  )
}

/** 把 date 值解析为北京时间当天的最后一秒。 */
export function parseAppEndOfDay(value: string): Date {
  const match = DATE_LOCAL_RE.exec(value)
  if (!match) throw new Error(`无效的日期格式：${value}`)

  const [, year, month, day] = match
  return assertValidDate(
    new Date(`${year}-${month}-${day}T23:59:59${APP_UTC_OFFSET}`),
    value,
  )
}

type AppDateParts = {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  weekday: string
}

function getAppDateParts(value: string | Date): AppDateParts {
  const date = typeof value === 'string' ? new Date(value) : value
  assertValidDate(date, String(value))

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date)

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
    weekday: part('weekday'),
  }
}

/** 卡片与时间轴统一显示：2026年07月01日 周三 15:30 */
export function formatAppDateTime(value: string | Date): string {
  const { year, month, day, hour, minute, weekday } = getAppDateParts(value)
  return `${year}年${month}月${day}日 ${weekday} ${hour}:${minute}`
}

/** 把数据库 ISO 时间转换为 datetime-local 可回显的北京时间。 */
export function toAppDateTimeLocal(value: string | Date): string {
  const { year, month, day, hour, minute } = getAppDateParts(value)
  return `${year}-${month}-${day}T${hour}:${minute}`
}
