'use client'

import { useEffect, useRef } from 'react'

import { createProject, updateProject } from '@/app/actions'
import { parseAttachments } from '@/lib/attachment-utils'
import { FormError, FormSubmitButton } from '@/components/ui/Form'
import { FileAttachments } from './FileAttachments'
import { useFormAction } from '@/hooks/useFormAction'
import type { ProjectRow } from '@/app/projects/page'

const PROJECT_TYPE_OPTIONS = ['高端猎头', 'RPO', '背景调查', '咨询', '人才Mapping', '其他']
const PRIORITY_OPTIONS = ['P0-紧急', 'P1-高', 'P2-中', 'P3-低']
const STATUS_OPTIONS = ['洽谈中', '已签约', '进行中', '暂停', '已完成', '已终止']
const CHARGING_OPTIONS = ['按年薪比例', '固定服务费', '分期', '其他']
const PAYMENT_OPTIONS = ['未开票', '已开票待回款', '部分回款', '已结清']

export function ProjectForm({
  project,
  onClose,
  hideActions,
  onSubmitRef,
}: {
  project?: ProjectRow
  onClose?: () => void
  hideActions?: boolean
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const isEdit = Boolean(project)
  const action = isEdit ? updateProject : createProject
  const { formAction, isPending, state } = useFormAction(action)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (onSubmitRef && formRef.current) {
      onSubmitRef(() => { formRef.current?.requestSubmit() })
    }
  }, [onSubmitRef])

  useEffect(() => {
    if (state?.success && onClose) { onClose() }
  }, [state, onClose])

  const dt = (val: Date | string | null | undefined) => {
    if (!val) return ''
    const d = new Date(val)
    return d.toISOString().slice(0, 10)
  }

  return (
    <form action={formAction} className="form-grid two" ref={formRef}>
      {isEdit && <input name="id" type="hidden" value={project!.id} />}

      {/* ── 基础信息 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>基础信息</div>

      <div className="form-field span-full">
        <label htmlFor="name">项目名称 *</label>
        <input defaultValue={project?.name ?? ''} id="name" name="name" required type="text" placeholder="请输入项目名称" />
      </div>

      <div className="form-field">
        <label htmlFor="code">项目编号</label>
        <input defaultValue={project?.code ?? ''} id="code" name="code" type="text" placeholder="自动生成" />
      </div>

      <div className="form-field">
        <label htmlFor="clientCompany">客户公司</label>
        <input defaultValue={project?.clientCompany ?? ''} id="clientCompany" name="clientCompany" type="text" placeholder="请输入客户公司" />
      </div>

      <div className="form-field">
        <label htmlFor="clientContact">客户方对接人</label>
        <input defaultValue={project?.clientContact ?? ''} id="clientContact" name="clientContact" type="text" placeholder="请输入对接人" />
      </div>

      <div className="form-field">
        <label htmlFor="projectType">项目类型</label>
        <select defaultValue={project?.projectType ?? ''} id="projectType" name="projectType">
          <option value="">请选择</option>
          {PROJECT_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="industry">行业</label>
        <input defaultValue={project?.industry ?? ''} id="industry" name="industry" type="text" placeholder="请输入行业" />
      </div>

      <div className="form-field">
        <label htmlFor="priority">优先级</label>
        <select defaultValue={project?.priority ?? ''} id="priority" name="priority">
          <option value="">请选择</option>
          {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="status">项目状态</label>
        <select defaultValue={project?.status ?? '洽谈中'} id="status" name="status">
          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* ── 时间 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>时间</div>

      <div className="form-field">
        <label htmlFor="startDate">启动日期</label>
        <input defaultValue={dt(project?.startDate)} id="startDate" name="startDate" type="date" />
      </div>

      <div className="form-field">
        <label htmlFor="expectedEndDate">预计完成日期</label>
        <input defaultValue={dt(project?.expectedEndDate)} id="expectedEndDate" name="expectedEndDate" type="date" />
      </div>

      <div className="form-field">
        <label htmlFor="actualEndDate">实际完成日期</label>
        <input defaultValue={dt(project?.actualEndDate)} id="actualEndDate" name="actualEndDate" type="date" />
      </div>

      {/* ── 财务 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>财务</div>

      <div className="form-field">
        <label htmlFor="contractAmount">合同金额</label>
        <input defaultValue={project?.contractAmount ?? ''} id="contractAmount" name="contractAmount" type="text" placeholder="请输入金额" />
      </div>

      <div className="form-field">
        <label htmlFor="chargingModel">收费模式</label>
        <select defaultValue={project?.chargingModel ?? ''} id="chargingModel" name="chargingModel">
          <option value="">请选择</option>
          {CHARGING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="paymentStatus">回款状态</label>
        <select defaultValue={project?.paymentStatus ?? ''} id="paymentStatus" name="paymentStatus">
          <option value="">请选择</option>
          {PAYMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="paidAmount">已回款金额</label>
        <input defaultValue={project?.paidAmount ?? ''} id="paidAmount" name="paidAmount" type="text" placeholder="请输入金额" />
      </div>

      {/* ── 岗位与进展 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>岗位与进展</div>

      <div className="form-field span-full">
        <label htmlFor="relatedJobs">关联岗位</label>
        <input defaultValue={project?.relatedJobs ?? ''} id="relatedJobs" name="relatedJobs" type="text" placeholder="岗位ID逗号分隔" />
      </div>

      <div className="form-field">
        <label htmlFor="totalHeadcount">总需求人数</label>
        <input defaultValue={project?.totalHeadcount ?? ''} id="totalHeadcount" name="totalHeadcount" type="number" placeholder="0" />
      </div>

      <div className="form-field">
        <label htmlFor="recommendedCount">已推荐人数</label>
        <input defaultValue={project?.recommendedCount ?? ''} id="recommendedCount" name="recommendedCount" type="number" placeholder="0" />
      </div>

      <div className="form-field">
        <label htmlFor="interviewedCount">已面试人数</label>
        <input defaultValue={project?.interviewedCount ?? ''} id="interviewedCount" name="interviewedCount" type="number" placeholder="0" />
      </div>

      <div className="form-field">
        <label htmlFor="hiredCount">已入职人数</label>
        <input defaultValue={project?.hiredCount ?? ''} id="hiredCount" name="hiredCount" type="number" placeholder="0" />
      </div>

      <div className="form-field">
        <label htmlFor="completionRate">项目完成度</label>
        <input defaultValue={project?.completionRate ?? ''} id="completionRate" name="completionRate" type="text" placeholder="如：60%" />
      </div>

      {/* ── 沟通与文档 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>沟通与文档</div>

      <div className="form-field">
        <label htmlFor="lastReportDate">上次汇报日期</label>
        <input defaultValue={dt(project?.lastReportDate)} id="lastReportDate" name="lastReportDate" type="date" />
      </div>

      <div className="form-field">
        <label htmlFor="nextReportDate">下次汇报日期</label>
        <input defaultValue={dt(project?.nextReportDate)} id="nextReportDate" name="nextReportDate" type="date" />
      </div>

      <div className="form-field span-full">
        <label htmlFor="painPoints">项目痛点</label>
        <textarea className="ui-form-control" defaultValue={project?.painPoints ?? ''} id="painPoints" name="painPoints" placeholder="这个项目的难点在哪" rows={3} />
      </div>

      <div className="form-field span-full">
        <label htmlFor="competitorInfo">竞品信息</label>
        <textarea className="ui-form-control" defaultValue={project?.competitorInfo ?? ''} id="competitorInfo" name="competitorInfo" placeholder="客户也在跟哪家猎头合作" rows={3} />
      </div>

      {/* ── 其他 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>其他</div>

      <div className="form-field span-full">
        <label htmlFor="tags">标签</label>
        <input defaultValue={project?.tags ?? ''} id="tags" name="tags" type="text" placeholder="逗号分隔" />
      </div>

      <FileAttachments existing={parseAttachments(project?.attachments ?? null)} />

      <div className="form-field span-full">
        <label htmlFor="note">备注</label>
        <textarea className="ui-form-control" defaultValue={project?.note ?? ''} id="note" name="note" placeholder="请输入备注" rows={4} />
      </div>

      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>{isEdit ? '保存修改' : '保存项目'}</FormSubmitButton>
      )}
    </form>
  )
}
