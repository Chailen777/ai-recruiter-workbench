/**
 * 工作台统一使用北京时间。
 *
 * datetime-local 不携带时区；如果直接在 Vercel（UTC）上 new Date(value)，
 * 用户输入的 15:30 会被当成 UTC，回到中国浏览器后显示成 23:30。
 */
export const APP_TIME_ZONE = 'Asia/Shanghai'
const APP_UTC_OFFSET = '+08:00'
export type AppRepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'halfyearly' | 'workday' | 'weekday' | 'custom'

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

/** 仅日期部分（不含时间）：2026年07月01日 周三 */
export function formatAppDate(value: string | Date): string {
  const { year, month, day, weekday } = getAppDateParts(value)
  return `${year}年${month}月${day}日 ${weekday}`
}

/** 把数据库 ISO 时间转换为 datetime-local 可回显的北京时间。 */
export function toAppDateTimeLocal(value: string | Date): string {
  const { year, month, day, hour, minute } = getAppDateParts(value)
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function createAppDateTime(
  year: number,
  month: number,
  day: number,
  hour: string,
  minute: string,
): Date {
  return assertValidDate(
    new Date(
      `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hour}:${minute}:00${APP_UTC_OFFSET}`,
    ),
    `${year}-${month}-${day} ${hour}:${minute}`,
  )
}

/**
 * 从首个待办时间计算第 N 个重复时间。
 *
 * 每月、每年始终以首日为锚点，避免 1 月 31 日经过 2 月后漂移成 3 月 28 日。
 * 如果目标月份没有该日，则使用当月最后一天。
 */
export function addAppRepeatInterval(
  start: Date,
  repeatType: AppRepeatType,
  intervalCount: number,
  customNum?: number,
  weekdayMask?: number[], // [0,2,4] = 周一三五
): Date {
  if (!Number.isInteger(intervalCount) || intervalCount < 0) {
    throw new Error('重复间隔必须是非负整数')
  }

  // 每天
  if (repeatType === 'daily') {
    return new Date(start.getTime() + intervalCount * 24 * 60 * 60 * 1000)
  }

  // 每周 / 自定义每周几
  if (repeatType === 'weekly') {
    if (weekdayMask && weekdayMask.length > 0) {
      // 按周几掩码找到第 intervalCount 个匹配的日期
      const msPerDay = 24 * 60 * 60 * 1000
      let d = new Date(start)
      let matched = 0
      // 先跳过 start 当天（不算）
      d = new Date(d.getTime() + msPerDay)
      while (matched < intervalCount) {
        const wd = d.getDay() === 0 ? 7 : d.getDay() // 周日=7
        if (weekdayMask.includes(wd)) matched++
        if (matched < intervalCount) d = new Date(d.getTime() + msPerDay)
      }
      return d
    }
    return new Date(start.getTime() + intervalCount * 7 * 24 * 60 * 60 * 1000)
  }

  // 每周几（自定义多选）
  if (repeatType === 'weekday') {
    const mask = weekdayMask && weekdayMask.length > 0 ? weekdayMask : [1, 2, 3, 4, 5]
    const msPerDay = 24 * 60 * 60 * 1000
    let d = new Date(start)
    let counted = 0
    d = new Date(d.getTime() + msPerDay)
    while (counted < intervalCount) {
      const wd = d.getDay() === 0 ? 7 : d.getDay() // 周日=7
      if (mask.includes(wd)) counted++
      if (counted < intervalCount) d = new Date(d.getTime() + msPerDay)
    }
    return d
  }

  // 工作日（周一到周五）
  if (repeatType === 'workday') {
    const msPerDay = 24 * 60 * 60 * 1000
    let d = new Date(start)
    let counted = 0
    d = new Date(d.getTime() + msPerDay)
    while (counted < intervalCount) {
      const wd = d.getDay()
      if (wd >= 1 && wd <= 5) counted++
      if (counted < intervalCount) d = new Date(d.getTime() + msPerDay)
    }
    return d
  }

  const parts = getAppDateParts(start)
  const startYear = Number(parts.year)
  const startMonth = Number(parts.month)
  const startDay = Number(parts.day)

  // 每季度
  if (repeatType === 'quarterly') {
    const totalMonths = startYear * 12 + (startMonth - 1) + intervalCount * 3
    const targetYear = Math.floor(totalMonths / 12)
    const targetMonth = (totalMonths % 12) + 1
    const targetDay = Math.min(startDay, daysInMonth(targetYear, targetMonth))
    return createAppDateTime(targetYear, targetMonth, targetDay, parts.hour, parts.minute)
  }

  // 每半年
  if (repeatType === 'halfyearly') {
    const totalMonths = startYear * 12 + (startMonth - 1) + intervalCount * 6
    const targetYear = Math.floor(totalMonths / 12)
    const targetMonth = (totalMonths % 12) + 1
    const targetDay = Math.min(startDay, daysInMonth(targetYear, targetMonth))
    return createAppDateTime(targetYear, targetMonth, targetDay, parts.hour, parts.minute)
  }

  // 自定义（每 N 天）
  if (repeatType === 'custom' && customNum) {
    return new Date(start.getTime() + intervalCount * customNum * 24 * 60 * 60 * 1000)
  }

  // 每月
  if (repeatType === 'monthly') {
    const totalMonths = startYear * 12 + (startMonth - 1) + intervalCount
    const targetYear = Math.floor(totalMonths / 12)
    const targetMonth = (totalMonths % 12) + 1
    const targetDay = Math.min(startDay, daysInMonth(targetYear, targetMonth))
    return createAppDateTime(targetYear, targetMonth, targetDay, parts.hour, parts.minute)
  }

  // 每年（默认）
  const targetYear = startYear + intervalCount
  const targetDay = Math.min(startDay, daysInMonth(targetYear, startMonth))
  return createAppDateTime(targetYear, startMonth, targetDay, parts.hour, parts.minute)
}

/** 生成重复计划；超过上限时不返回不完整结果。 */
export function createAppRepeatDates(
  start: Date,
  end: Date,
  repeatType: AppRepeatType,
  frequency: number,
  maxOccurrences = 365,
  customNum?: number,
  weekdayMask?: number[],
): { dates: Date[]; exceedsLimit: boolean } {
  if (!Number.isInteger(frequency) || frequency < 1) {
    throw new Error('重复频率必须是正整数')
  }
  if (!Number.isInteger(maxOccurrences) || maxOccurrences < 1) {
    throw new Error('重复数量上限必须是正整数')
  }
  if (end < start) return { dates: [], exceedsLimit: false }

  const dates: Date[] = []
  let occurrenceIndex = 0
  while (true) {
    const current = addAppRepeatInterval(
      start,
      repeatType,
      occurrenceIndex * frequency,
      customNum,
      weekdayMask,
    )
    if (current > end) return { dates, exceedsLimit: false }
    if (dates.length >= maxOccurrences) return { dates: [], exceedsLimit: true }
    dates.push(current)
    occurrenceIndex += 1
  }
}
