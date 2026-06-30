'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createJob, updateJob } from '@/app/actions'
import {
  FormError,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from '@/components/ui/Form'
import { useFormAction } from '@/hooks/useFormAction'
import { parseAttachments } from '@/lib/attachment-utils'
import { Avatar } from '@/components/ui'
import { FileAttachments } from './FileAttachments'

const jobStatuses = ['进行中', '待发布', '已关闭']
const deliveryModes = ['面试单', '入职单', '入职保过单', '年费会员单', '项目制', '其他']
const jobSources = ['人力聚合平台', '禾蛙网', '人工录入']

export function JobForm({
  job,
  onClose,
  preselectedCompanyName,
  redirectTo,
  hideActions,
  formId,
  onSubmitRef,
}: {
  job?: {
    ageRequirement: string | null
    city: string | null
    commission: string | null
    commissionRules: string | null
    companyId: number | null
    companyName: string
    deliveryMode: string | null
    educationRequirement: string | null
    exclusions: string | null
    experienceRequirement: string | null
    guaranteePeriod: string | null
    headcount: number | null
    highlights: string | null
    id: number
    jdRaw: string | null
    jobCategory: string | null
    mustHave: string | null
    niceToHave: string | null
    orderNotes: string | null
    requirements: string | null
    responsibilities: string | null
    salaryRange: string | null
    skillKeywords: string | null
    source: string | null
    status: string
    tags: string | null
    title: string
    workLocation: string | null
    attachments: string | null
    avatar: string | null
    link: string | null
    website: string | null
    industry: string | null
  }
  onClose?: () => void
  preselectedCompanyName?: string
  redirectTo?: string
  hideActions?: boolean
  formId?: string
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const router = useRouter()
  const isEdit = Boolean(job)
  const action = isEdit ? updateJob : createJob
  const { formAction, isPending, state } = useFormAction(action)
  const formRef = useRef<HTMLFormElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const avatarSrc = avatarRemoved ? null : (avatarPreview ?? job?.avatar ?? null)

  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef(() => formRef.current?.requestSubmit())
    }
  }, [onSubmitRef])

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      if (redirectTo) router.push(redirectTo)
      onClose?.()
      if (!isEdit) formRef.current?.reset()
    }
  }, [isEdit, onClose, redirectTo, router, state])

  const defaultCompanyName = job?.companyName ?? preselectedCompanyName ?? ''

  return (
    <form action={formAction} className="form-grid two" ref={formRef} id={formId ?? undefined}>
      {job ? <input name="id" type="hidden" value={job.id} /> : null}
      <div className="form-avatar-preview span-full">
        <label className="avatar-upload-label">
          <Avatar type="job" size="md" src={avatarSrc} />
          <input
            accept="image/*"
            hidden
            name="avatar"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) { setAvatarPreview(URL.createObjectURL(file)); setAvatarRemoved(false) }
            }}
            type="file"
          />
          <span className="avatar-upload-hint">点击上传头像</span>
          {avatarSrc ? (
            <button
              type="button"
              className="avatar-remove-btn"
              title="删除头像"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAvatarPreview(null); setAvatarRemoved(true) }}
            >
              ✕
            </button>
          ) : null}
        </label>
        <input type="hidden" name="avatarRemove" value={avatarRemoved ? '1' : '0'} />
      </div>
      <FormInput
        className="span-full"
        defaultValue={job?.companyName ?? defaultCompanyName}
        error={state?.success === false ? (state.errors?.companyName || state.errors?.companyId) : undefined}
        label="企业名称"
        name="companyName"
        placeholder="输入企业名称，自动匹配企业库"
        required
      />
      <FormInput
        defaultValue={job?.title}
        error={state?.success === false ? state.errors?.title : undefined}
        label="岗位名称"
        name="title"
        required
      />
      <FormInput
        defaultValue={job?.city ?? ''}
        error={state?.success === false ? state.errors?.city : undefined}
        label="城市"
        name="city"
      />
      <FormInput
        defaultValue={job?.salaryRange ?? ''}
        error={state?.success === false ? state.errors?.salaryRange : undefined}
        label="薪资范围"
        name="salaryRange"
        placeholder="例如：20-35K"
      />
      <FormInput
        defaultValue={job?.experienceRequirement ?? ''}
        error={state?.success === false ? state.errors?.experienceRequirement : undefined}
        label="经验要求"
        name="experienceRequirement"
        placeholder="例如：3年以上"
      />
      <FormInput
        defaultValue={job?.educationRequirement ?? ''}
        error={state?.success === false ? state.errors?.educationRequirement : undefined}
        label="学历要求"
        name="educationRequirement"
        placeholder="例如：本科以上"
      />
      <FormInput
        defaultValue={job?.skillKeywords ?? ''}
        error={state?.success === false ? state.errors?.skillKeywords : undefined}
        label="技能要求"
        name="skillKeywords"
        placeholder="例如：Java, 销售, 无人机"
      />
      <FormSelect
        defaultValue={job?.status ?? '待发布'}
        error={state?.success === false ? state.errors?.status : undefined}
        label="状态"
        name="status"
      >
        {jobStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </FormSelect>
      <FormInput
        defaultValue={job?.tags ?? ''}
        error={state?.success === false ? state.errors?.tags : undefined}
        label="标签"
        name="tags"
        placeholder="例如：高薪, 急招"
      />
      <FormInput
        defaultValue={job?.guaranteePeriod ?? ''}
        error={state?.success === false ? state.errors?.guaranteePeriod : undefined}
        label="保证期"
        name="guaranteePeriod"
        placeholder="例如：1个月 / 3个月"
      />
      <FormInput
        defaultValue={job?.commission ?? ''}
        error={state?.success === false ? state.errors?.commission : undefined}
        label="佣金"
        name="commission"
        placeholder="例如：20% / 3万"
      />
      <FormInput
        defaultValue={job?.ageRequirement ?? ''}
        error={state?.success === false ? state.errors?.ageRequirement : undefined}
        label="年龄要求"
        name="ageRequirement"
        placeholder="例如：25-35"
      />
      <FormInput
        defaultValue={job?.jobCategory ?? ''}
        error={state?.success === false ? state.errors?.jobCategory : undefined}
        label="职位类别"
        name="jobCategory"
        placeholder="例如：技术 / 销售 / 产品"
      />
      <FormInput
        defaultValue={job?.headcount ? String(job.headcount) : ''}
        error={state?.success === false ? state.errors?.headcount : undefined}
        label="招聘人数"
        min="1"
        name="headcount"
        type="number"
      />
      <FormInput
        defaultValue={job?.workLocation ?? ''}
        error={state?.success === false ? state.errors?.workLocation : undefined}
        label="工作地点"
        name="workLocation"
        placeholder="例如：深圳南山 / 远程"
      />
      <FormSelect
        defaultValue={job?.deliveryMode ?? ''}
        error={state?.success === false ? state.errors?.deliveryMode : undefined}
        label="交付模式"
        name="deliveryMode"
      >
        <option value="">请选择交付模式</option>
        {deliveryModes.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={job?.source ?? ''}
        error={state?.success === false ? state.errors?.source : undefined}
        label="来源"
        name="source"
      >
        <option value="">请选择来源</option>
        {jobSources.map((src) => (
          <option key={src} value={src}>
            {src}
          </option>
        ))}
      </FormSelect>
      <FormInput
        defaultValue={job?.link ?? ''}
        error={state?.success === false ? state.errors?.link : undefined}
        label="岗位链接"
        name="link"
        placeholder="岗位详情页URL"
      />
      <FormInput
        defaultValue={job?.website ?? ''}
        error={state?.success === false ? state.errors?.website : undefined}
        label="官网"
        name="website"
        placeholder="企业官网地址"
      />
      <FormInput
        defaultValue={job?.industry ?? ''}
        error={state?.success === false ? state.errors?.industry : undefined}
        label="所属行业"
        name="industry"
        placeholder="例如：互联网/金融/制造业"
      />
      <FormTextarea
        className="span-full textarea-job-detail"
        defaultValue={job?.highlights ?? ''}
        error={state?.success === false ? state.errors?.highlights : undefined}
        label="职位亮点"
        name="highlights"
        placeholder="例如：期权激励、双休、扁平管理、核心技术岗"
      />
      <FormTextarea
        className="span-full textarea-job-detail"
        defaultValue={job?.responsibilities ?? ''}
        error={state?.success === false ? state.errors?.responsibilities : undefined}
        label="工作职责"
        name="responsibilities"
        placeholder="描述该岗位日常负责的工作内容"
      />
      <FormTextarea
        className="span-full textarea-job-detail"
        defaultValue={job?.requirements ?? ''}
        error={state?.success === false ? state.errors?.requirements : undefined}
        label="任职要求"
        name="requirements"
        placeholder="描述候选人必须具备的条件"
      />
      <FormTextarea
        className="span-full"
        defaultValue={job?.mustHave ?? ''}
        error={state?.success === false ? state.errors?.mustHave : undefined}
        label="硬性要求"
        name="mustHave"
      />
      <FormTextarea
        className="span-full"
        defaultValue={job?.niceToHave ?? ''}
        error={state?.success === false ? state.errors?.niceToHave : undefined}
        label="加分项"
        name="niceToHave"
      />
      <FormTextarea
        className="span-full"
        defaultValue={job?.exclusions ?? ''}
        error={state?.success === false ? state.errors?.exclusions : undefined}
        label="排除项"
        name="exclusions"
      />
      <FormTextarea
        className="span-full textarea-job-detail"
        defaultValue={job?.orderNotes ?? ''}
        error={state?.success === false ? state.errors?.orderNotes : undefined}
        label="做单须知"
        name="orderNotes"
        placeholder="例如：推荐前需先发简历、面试流程为2轮技术面+1轮HR面"
      />
      <FormTextarea
        className="span-full"
        defaultValue={job?.commissionRules ?? ''}
        error={state?.success === false ? state.errors?.commissionRules : undefined}
        label="佣金规则"
        name="commissionRules"
        placeholder="例如：入职15个工作日内支付100%佣金；保证期3个月"
      />
      <FormTextarea
        className="span-full"
        defaultValue={job?.jdRaw ?? ''}
        error={state?.success === false ? state.errors?.jdRaw : undefined}
        label="JD原文"
        name="jdRaw"
      />
      <FileAttachments existing={parseAttachments(job?.attachments ?? null)} />
      <FormError className="span-full">{state?.success === false ? state.message : null}</FormError>
      {!hideActions ? (
        <FormSubmitButton className="span-full" loading={isPending}>
          {job ? '保存修改' : '保存岗位'}
        </FormSubmitButton>
      ) : null}
    </form>
  )
}
