'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createCompany, updateCompany } from '@/app/actions'
import {
  FormCheckboxGroup,
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

const cityOptions = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '苏州',
  '南京',
  '成都',
  '武汉',
  '西安',
  '其他',
]
const statusOptions = ['待沟通', '已联系', '合作中', '暂停合作', '已结束']
const sourceOptions = ['人力聚合平台', '禾蛙网', '手工录入']

function selectedValues(value?: string | null) {
  return (value ?? '')
    .split(/[、/]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function CompanyForm({
  company,
  onClose,
  redirectTo,
  hideActions,
  formId,
  onSubmitRef,
}: {
  company?: {
    address: string | null
    city: string | null
    companyContactName: string | null
    companyContactPhone: string | null
    cooperationStatus: string | null
    id: number
    industry: string | null
    name: string
    note: string | null
    projectContactName: string | null
    projectContactPhone: string | null
    projectContactWechat: string | null
    source: string | null
    attachments: string | null
    avatar: string | null
    link: string | null
  }
  onClose?: () => void
  redirectTo?: string
  hideActions?: boolean
  formId?: string
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const router = useRouter()
  const isEdit = Boolean(company)
  const action = isEdit ? updateCompany : createCompany
  const { formAction, isPending, state } = useFormAction(action)
  const formRef = useRef<HTMLFormElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const avatarSrc = avatarRemoved ? null : (avatarPreview ?? company?.avatar ?? null)

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

  return (
    <form action={formAction} className="form-grid company-form" ref={formRef} id={formId ?? undefined}>
      {company ? <input name="id" type="hidden" value={company.id} /> : null}
      <div className="form-avatar-preview">
        <label className="avatar-upload-label">
          <Avatar type="company" size="md" src={avatarSrc} />
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
        defaultValue={company?.name}
        error={state?.success === false ? state.errors?.name : undefined}
        label="企业名称"
        name="name"
        required
      />
      <FormInput
        defaultValue={company?.industry ?? ''}
        error={state?.success === false ? state.errors?.industry : undefined}
        label="行业"
        name="industry"
      />
      <FormCheckboxGroup
        error={state?.success === false ? state.errors?.city : undefined}
        label="城市"
        name="city"
        options={cityOptions}
        selectedValues={selectedValues(company?.city)}
      />
      <FormInput
        defaultValue=""
        error={state?.success === false ? state.errors?.customCity : undefined}
        label="新增城市"
        name="customCity"
        placeholder="没有的城市填这里"
      />
      <FormInput
        defaultValue={company?.address ?? ''}
        error={state?.success === false ? state.errors?.address : undefined}
        label="公司地址"
        name="address"
        placeholder="填写公司办公地址"
      />
      <FormInput
        defaultValue={company?.companyContactName ?? ''}
        error={state?.success === false ? state.errors?.companyContactName : undefined}
        label="公司联系人名称"
        name="companyContactName"
      />
      <FormInput
        defaultValue={company?.companyContactPhone ?? ''}
        error={state?.success === false ? state.errors?.companyContactPhone : undefined}
        label="公司联系人电话"
        name="companyContactPhone"
        type="tel"
      />
      <FormInput
        defaultValue={company?.projectContactName ?? ''}
        error={state?.success === false ? state.errors?.projectContactName : undefined}
        label="项目人名称"
        name="projectContactName"
      />
      <FormInput
        defaultValue={company?.projectContactPhone ?? ''}
        error={state?.success === false ? state.errors?.projectContactPhone : undefined}
        label="项目联系人电话"
        name="projectContactPhone"
        type="tel"
      />
      <FormInput
        defaultValue={company?.projectContactWechat ?? ''}
        error={state?.success === false ? state.errors?.projectContactWechat : undefined}
        label="项目联系人微信"
        name="projectContactWechat"
      />
      <FormSelect
        defaultValue={company?.source ?? '手工录入'}
        error={state?.success === false ? state.errors?.source : undefined}
        label="来源"
        name="source"
      >
        {sourceOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FormSelect>
      <FormCheckboxGroup
        error={state?.success === false ? state.errors?.cooperationStatus : undefined}
        label="合作状态"
        name="cooperationStatus"
        options={statusOptions}
        selectedValues={selectedValues(company?.cooperationStatus)}
      />
      <FormTextarea
        defaultValue={company?.note ?? ''}
        error={state?.success === false ? state.errors?.note : undefined}
        label="公司简介"
        name="note"
        placeholder="填写企业主营业务、规模、优势、招聘方向等"
      />
      <FormInput
        defaultValue={company?.link ?? ''}
        error={state?.success === false ? state.errors?.link : undefined}
        label="链接"
        name="link"
        placeholder="企业官网或相关链接"
      />
      <FileAttachments existing={parseAttachments(company?.attachments ?? null)} />
      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>{company ? '保存修改' : '保存企业'}</FormSubmitButton>
      )}
    </form>
  )
}
