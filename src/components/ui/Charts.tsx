'use client'

import { useTheme } from '@/components/providers'
import { memo, useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ── Shared color palettes ──

const CHART_COLORS_LIGHT = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  grid: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
}

const CHART_COLORS_DARK = {
  primary: '#60a5fa',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  pink: '#f472b6',
  grid: '#374151',
  tooltipBg: '#1f2937',
  tooltipBorder: '#374151',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
}

function useChartColors() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === 'dark' ? CHART_COLORS_DARK : CHART_COLORS_LIGHT
}

// ── Types ──

export interface TrendPoint {
  candidates: number
  companies: number
  jobs: number
  label: string
}

export interface StatusDistItem {
  count: number
  label: string
}

export interface PipelineItem {
  count: number
  label: string
}

// ── Trend Area Chart ──

export const TrendAreaChart = memo(function TrendAreaChart({
  data,
  height = 260,
}: {
  data: TrendPoint[]
  height?: number
}) {
  const colors = useChartColors()

  if (!data.length) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: colors.textSecondary }}>
        暂无趋势数据
      </div>
    )
  }

  return (
    <ResponsiveContainer height={height} width="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="fillCompanies" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.24} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillJobs" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.success} stopOpacity={0.24} />
            <stop offset="100%" stopColor={colors.success} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillCandidates" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.warning} stopOpacity={0.24} />
            <stop offset="100%" stopColor={colors.warning} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" strokeOpacity={0.5} />
        <Legend
          align="left"
          formatter={(value: string) => <span style={{ color: colors.text, fontSize: 13 }}>{value}</span>}
          iconType="circle"
          verticalAlign="top"
          wrapperStyle={{ paddingBottom: 8 }}
        />
        <XAxis
          axisLine={false}
          dataKey="label"
          fontSize={12}
          stroke={colors.textSecondary}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          fontSize={12}
          stroke={colors.textSecondary}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            color: colors.text,
            fontSize: 13,
          }}
        />
        <Area
          dataKey="companies"
          fill="url(#fillCompanies)"
          name="新增企业"
          stroke={colors.primary}
          strokeWidth={2}
          type="monotone"
        />
        <Area
          dataKey="jobs"
          fill="url(#fillJobs)"
          name="新增岗位"
          stroke={colors.success}
          strokeWidth={2}
          type="monotone"
        />
        <Area
          dataKey="candidates"
          fill="url(#fillCandidates)"
          name="新增候选人"
          stroke={colors.warning}
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})

// ── Status Donut Chart ──

const PIE_PALETTE_LIGHT = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const PIE_PALETTE_DARK = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee']

export const StatusPieChart = memo(function StatusPieChart({
  data,
  height = 220,
  innerRadius = 52,
  title,
}: {
  data: StatusDistItem[]
  height?: number
  innerRadius?: number
  title?: string
}) {
  const { resolvedTheme } = useTheme()
  const palette = resolvedTheme === 'dark' ? PIE_PALETTE_DARK : PIE_PALETTE_LIGHT
  const colors = useChartColors()

  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data])

  if (!data.length || total === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: colors.textSecondary }}>
        暂无数据
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <ResponsiveContainer height={height + 32} width="100%">
        <PieChart margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <Pie
            cx="50%"
            cy="45%"
            data={data}
            dataKey="count"
            innerRadius={innerRadius}
            nameKey="label"
            outerRadius={86}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell fill={palette[index % palette.length]} key={`cell-${index}`} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: 8,
              color: colors.text,
              fontSize: 13,
            }}
          />
          <Legend
            align="center"
            formatter={(value: string) => (
              <span style={{ color: colors.text, fontSize: 12 }}>{value}</span>
            )}
            iconSize={10}
            iconType="circle"
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 4 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          top: '37%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
          {total}
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {title || '总计'}
        </div>
      </div>
    </div>
  )
})

// ── Pipeline Funnel Bar Chart ──

export const PipelineBarChart = memo(function PipelineBarChart({
  data,
  height = 240,
}: {
  data: PipelineItem[]
  height?: number
}) {
  const colors = useChartColors()
  const { resolvedTheme } = useTheme()
  const palette = resolvedTheme === 'dark' ? PIE_PALETTE_DARK : PIE_PALETTE_LIGHT

  if (!data.length) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: colors.textSecondary }}>
        暂无 Pipeline 数据
      </div>
    )
  }

  return (
    <ResponsiveContainer height={height} width="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={colors.grid} strokeOpacity={0.4} />
        <XAxis
          allowDecimals={false}
          axisLine={false}
          fontSize={12}
          stroke={colors.textSecondary}
          tickLine={false}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="label"
          fontSize={13}
          stroke={colors.text}
          tickLine={false}
          type="category"
          width={80}
        />
        <Tooltip
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 8,
            color: colors.text,
            fontSize: 13,
          }}
        />
        <Bar dataKey="count" maxBarSize={36} name="人数" radius={[0, 6, 6, 0]}>
          {data.map((_, index) => (
            <Cell fill={palette[index % palette.length]} key={`cell-${index}`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

// ── Match Score Distribution ──

export const ScoreHistogram = memo(function ScoreHistogram({
  data,
  height = 200,
}: {
  data: StatusDistItem[]
  height?: number
}) {
  const colors = useChartColors()

  if (!data.length) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: colors.textSecondary }}>
        暂无匹配数据
      </div>
    )
  }

  return (
    <ResponsiveContainer height={height} width="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" strokeOpacity={0.4} />
        <XAxis
          axisLine={false}
          dataKey="label"
          fontSize={12}
          stroke={colors.textSecondary}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          fontSize={12}
          stroke={colors.textSecondary}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 8,
            color: colors.text,
            fontSize: 13,
          }}
        />
        <Bar dataKey="count" fill={colors.primary} maxBarSize={40} name="匹配数" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              fill={index >= data.length - 2 ? colors.success : colors.primary}
              key={`cell-${index}`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})
