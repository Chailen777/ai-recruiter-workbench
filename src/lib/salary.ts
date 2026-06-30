/**
 * 薪资范围解析工具
 * 支持格式：
 * - "10k-20k" / "10K-20K"：范围
 * - "30k以上" / "30k+"：最低薪资
 * - "20k"：固定薪资
 * - "面议" / "协商"：无法解析
 */

/**
 * 从薪资范围字符串中提取最大薪资（单位：k）
 * 如果无法解析，返回 0
 */
export function salaryMax(salaryRange: string | null | undefined): number {
  if (!salaryRange) return 0

  const normalized = salaryRange.toLowerCase().trim()

  // 面议、协商等无法解析的情况
  if (['面议', '协商', ' negotiable'].some((k) => normalized.includes(k))) {
    return 0
  }

  // 匹配 "数字k以上" 或 "数字k+"
  const minPattern = /(\d+(?:\.\d+)?)\s*k\s*(?:以上|以上|>|\+)/i
  const minMatch = normalized.match(minPattern)
  if (minMatch) {
    return Number(minMatch[1])
  }

  // 匹配 "数字k-数字k" 或 "数字k~数字k"
  const rangePattern = /(\d+(?:\.\d+)?)\s*k\s*[-~至到]\s*(\d+(?:\.\d+)?)\s*k?/i
  const rangeMatch = normalized.match(rangePattern)
  if (rangeMatch) {
    return Number(rangeMatch[2])
  }

  // 匹配单个数字 "数字k"
  const singlePattern = /(\d+(?:\.\d+)?)\s*k?/i
  const singleMatch = normalized.match(singlePattern)
  if (singleMatch) {
    return Number(singleMatch[1])
  }

  return 0
}

/**
 * 从薪资范围字符串中提取最小薪资（单位：k）
 * 如果无法解析，返回 0
 */
export function salaryMin(salaryRange: string | null | undefined): number {
  if (!salaryRange) return 0

  const normalized = salaryRange.toLowerCase().trim()

  // 面议、协商等无法解析的情况
  if (['面议', '协商', 'negotiable'].some((k) => normalized.includes(k))) {
    return 0
  }

  // 匹配 "数字k以上" 或 "数字k+"
  const minPattern = /(\d+(?:\.\d+)?)\s*k\s*(?:以上|以上|>|\+)/i
  const minMatch = normalized.match(minPattern)
  if (minMatch) {
    return Number(minMatch[1])
  }

  // 匹配 "数字k-数字k" 或 "数字k~数字k"
  const rangePattern = /(\d+(?:\.\d+)?)\s*k\s*[-~至到]\s*(\d+(?:\.\d+)?)\s*k?/i
  const rangeMatch = normalized.match(rangePattern)
  if (rangeMatch) {
    return Number(rangeMatch[1])
  }

  // 匹配单个数字 "数字k"
  const singlePattern = /(\d+(?:\.\d+)?)\s*k?/i
  const singleMatch = normalized.match(singlePattern)
  if (singleMatch) {
    return Number(singleMatch[1])
  }

  return 0
}

/**
 * 格式化薪资显示
 * @param salaryRange 薪资范围字符串
 * @returns 格式化后的薪资字符串（如 "10-20k"）
 */
export function formatSalary(salaryRange: string | null | undefined): string {
  if (!salaryRange) return '面议'
  return salaryRange
}
