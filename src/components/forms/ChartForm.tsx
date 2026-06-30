'use client'

import { useEffect, useRef } from 'react'

import { createChart, updateChart } from '@/app/actions'
import { parseAttachments } from '@/lib/attachment-utils'
import { CoverUpload } from '@/components/ui/CoverUpload'
import { FormError, FormSubmitButton } from '@/components/ui/Form'
import { FileAttachments } from './FileAttachments'
import { useFormAction } from '@/hooks/useFormAction'
import type { ChartRow } from '@/app/charts/page'

const STAT_PERIOD_OPTIONS = ['日', '周', '季', '年']
const STAT_DIMENSION_OPTIONS = ['金额', '人数', '订单', '销量']
const COMPARE_PERIOD_OPTIONS = ['同比', '环比', '无对比']
const DATA_SOURCE_OPTIONS = ['业务系统', '手动录入', '第三方导出']

export function ChartForm({
  chart,
  onClose,
  hideActions,
  onSubmitRef,
}: {
  chart?: ChartRow
  onClose?: () => void
  hideActions?: boolean
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const isEdit = Boolean(chart)
  const action = isEdit ? updateChart : createChart
  const { formAction, isPending, state } = useFormAction(action)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (onSubmitRef && formRef.current) {
      onSubmitRef(() => {
        formRef.current?.requestSubmit()
      })
    }
  }, [onSubmitRef])

  useEffect(() => {
    if (state?.success && onClose) {
      onClose()
    }
  }, [state, onClose])

  return (
    <form action={formAction} className="form-grid two" ref={formRef}>
      {isEdit && <input name="id" type="hidden" value={chart!.id} />}

      <div className="form-field span-full">
        <label>封面图片</label>
        <CoverUpload
          current={chart?.cover ?? null}
          name="cover"
        />
      </div>

      <div className="form-field">
        <label htmlFor="title">图表标题 *</label>
        <input
          defaultValue={chart?.title ?? ''}
          id="title"
          name="title"
          placeholder="请输入图表标题"
          required
          type="text"
        />
      </div>

      <div className="form-field span-full content-block">
        <label htmlFor="content">内容</label>
        <textarea
          className="ui-form-control"
          defaultValue={chart?.content ?? ''}
          id="content"
          name="content"
          placeholder="请输入图表描述与数据说明"
          rows={9}
        />
      </div>

      <div className="form-field">
        <label htmlFor="statPeriod">统计周期</label>
        <select defaultValue={chart?.statPeriod ?? ''} id="statPeriod" name="statPeriod">
          <option value="">请选择</option>
          {STAT_PERIOD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="statDimension">统计维度</label>
        <select defaultValue={chart?.statDimension ?? ''} id="statDimension" name="statDimension">
          <option value="">请选择</option>
          {STAT_DIMENSION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="comparePeriod">对比周期</label>
        <select defaultValue={chart?.comparePeriod ?? ''} id="comparePeriod" name="comparePeriod">
          <option value="">请选择</option>
          {COMPARE_PERIOD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="creator">创建人/制表人</label>
        <input
          defaultValue={chart?.creator ?? ''}
          id="creator"
          name="creator"
          placeholder="请输入创建人"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="dataSource">数据来源</label>
        <select defaultValue={chart?.dataSource ?? ''} id="dataSource" name="dataSource">
          <option value="">请选择</option>
          {DATA_SOURCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="indicatorTotal">数据指标总数</label>
        <input
          defaultValue={chart?.indicatorTotal ?? ''}
          id="indicatorTotal"
          name="indicatorTotal"
          placeholder="请输入指标总数"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="statUnit">统计单位</label>
        <input
          defaultValue={chart?.statUnit ?? ''}
          id="statUnit"
          name="statUnit"
          placeholder="请输入统计单位"
          type="text"
        />
      </div>

      <div className="form-field span-full">
        <label htmlFor="link">链接</label>
        <input
          defaultValue={chart?.link ?? ''}
          id="link"
          name="link"
          placeholder="请输入图表链接"
          type="url"
        />
      </div>

      <div className="form-field span-full">
        <label htmlFor="dataSourceNote">数据来源标注</label>
        <textarea
          className="ui-form-control"
          defaultValue={chart?.dataSourceNote ?? ''}
          id="dataSourceNote"
          name="dataSourceNote"
          placeholder="请输入数据来源标注"
          rows={6}
        />
      </div>

      <div className="form-field span-full">
        <label htmlFor="note">备注</label>
        <textarea
          className="ui-form-control"
          defaultValue={chart?.note ?? ''}
          id="note"
          name="note"
          placeholder="请输入备注"
          rows={6}
        />
      </div>

      <FileAttachments existing={parseAttachments(chart?.attachments ?? null)} />

      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>
          {isEdit ? '保存修改' : '保存图表'}
        </FormSubmitButton>
      )}
    </form>
  )
}
