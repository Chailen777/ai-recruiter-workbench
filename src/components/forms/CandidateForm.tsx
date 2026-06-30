'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createCandidate, updateCandidate } from '@/app/actions'
import {
  FormError,
  FormInput,
  FormRadioGroup,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from '@/components/ui/Form'
import { useFormAction } from '@/hooks/useFormAction'
import { parseAttachments } from '@/lib/attachment-utils'
import { Avatar } from '@/components/ui'
import { FileAttachments } from './FileAttachments'

const candidateStatuses = ['新建', '已沟通', '已推荐', '面试中', 'Offer', '入职', '淘汰']

export function CandidateForm({
  candidate,
  onClose,
  redirectTo,
  hideActions,
  formId,
  onSubmitRef,
}: {
  candidate?: {
    age: number | null
    attachments: string | null
    awards: string | null
    avatar: string | null
    certificates: string | null
    city: string | null
    communication: string
    currentCompany: string | null
    currentTitle: string | null
    desiredPosition: string | null
    education: string | null
    educationDetail: string | null
    expectedSalary: string | null
    gender: string | null
    id: number
    industryBg: string | null
    jobSearchStatus: string | null
    languages: string | null
    major: string | null
    name: string
    note: string | null
    otherAbilities: string | null
    phone: string | null
    projects: string | null
    resumeFile: string | null
    resumeRaw: string | null
    schoolName: string | null
    schoolType: string | null
    selfIntro: string | null
    skillTags: string | null
    status: string
    strengths: string | null
    tags: string | null
    workExperience: string | null
    yearsOfWork: number | null
    link: string | null
  }
  onClose?: () => void
  redirectTo?: string
  hideActions?: boolean
  formId?: string
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const router = useRouter()
  const isEdit = Boolean(candidate)
  const action = isEdit ? updateCandidate : createCandidate
  const { formAction, isPending, state } = useFormAction(action)
  const formRef = useRef<HTMLFormElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const avatarSrc = avatarRemoved ? null : (avatarPreview ?? candidate?.avatar ?? null)

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
    <form action={formAction} className="form-grid two" ref={formRef} id={formId ?? undefined}>
      {candidate ? <input name="id" type="hidden" value={candidate.id} /> : null}
      <div className="form-avatar-preview span-full">
        <label className="avatar-upload-label">
          <Avatar
            type="candidate"
            size="md"
            src={avatarSrc}
          />
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
        defaultValue={candidate?.name}
        error={state?.success === false ? state.errors?.name : undefined}
        label="姓名"
        name="name"
        required
      />
      <FormRadioGroup
        error={state?.success === false ? state.errors?.gender : undefined}
        label="性别"
        name="gender"
        options={['男', '女']}
        selectedValue={candidate?.gender ?? ''}
      />
      <FormInput
        defaultValue={candidate?.phone ?? ''}
        error={state?.success === false ? state.errors?.phone : undefined}
        label="电话"
        name="phone"
        type="tel"
      />
      <FormInput
        defaultValue={candidate?.city ?? ''}
        error={state?.success === false ? state.errors?.city : undefined}
        label="城市"
        name="city"
      />
      <FormInput
        defaultValue={candidate?.skillTags ?? ''}
        error={state?.success === false ? state.errors?.skillTags : undefined}
        label="技能"
        name="skillTags"
        placeholder="例如：Java, 销售, 无人机"
      />
      <FormInput
        defaultValue={candidate?.yearsOfWork != null ? String(candidate.yearsOfWork) : ''}
        error={state?.success === false ? state.errors?.yearsOfWork : undefined}
        label="经验"
        min="0"
        name="yearsOfWork"
        type="number"
      />
      <FormInput
        defaultValue={candidate?.desiredPosition ?? ''}
        error={state?.success === false ? state.errors?.desiredPosition : undefined}
        label="求职意向职位"
        name="desiredPosition"
      />
      <FormInput
        defaultValue={candidate?.expectedSalary ?? ''}
        error={state?.success === false ? state.errors?.expectedSalary : undefined}
        label="期望薪资"
        name="expectedSalary"
      />
      <FormSelect
        defaultValue={candidate?.status ?? '新建'}
        error={state?.success === false ? state.errors?.status : undefined}
        label="状态"
        name="status"
      >
        {candidateStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </FormSelect>
      <FormInput
        defaultValue={candidate?.tags ?? ''}
        error={state?.success === false ? state.errors?.tags : undefined}
        label="标签"
        name="tags"
        placeholder="例如：高意向, 可推荐"
      />
      <FormInput
        defaultValue={candidate?.currentTitle ?? ''}
        error={state?.success === false ? state.errors?.currentTitle : undefined}
        label="当前职位"
        name="currentTitle"
      />
      <FormInput
        defaultValue={candidate?.currentCompany ?? ''}
        error={state?.success === false ? state.errors?.currentCompany : undefined}
        label="当前公司"
        name="currentCompany"
      />
      <FormInput
        defaultValue={candidate?.schoolName ?? ''}
        error={state?.success === false ? state.errors?.schoolName : undefined}
        label="学校名称"
        name="schoolName"
      />
      <FormSelect
        defaultValue={candidate?.schoolType ?? ''}
        error={state?.success === false ? state.errors?.schoolType : undefined}
        label="学校类型"
        name="schoolType"
      >
        <option value="">请选择</option>
        <option value="985">985</option>
        <option value="211">211</option>
        <option value="省重点">省重点</option>
        <option value="普通本科">普通本科</option>
        <option value="专科">专科</option>
        <option value="其他">其他</option>
      </FormSelect>
      <FormInput
        defaultValue={candidate?.major ?? ''}
        error={state?.success === false ? state.errors?.major : undefined}
        label="专业"
        name="major"
      />
      <FormInput
        defaultValue={candidate?.education ?? ''}
        error={state?.success === false ? state.errors?.education : undefined}
        label="学历"
        name="education"
      />
      <FormInput
        defaultValue={candidate?.age != null ? String(candidate.age) : ''}
        error={state?.success === false ? state.errors?.age : undefined}
        label="年龄"
        min="0"
        name="age"
        type="number"
      />
      <FormSelect
        defaultValue={candidate?.jobSearchStatus ?? ''}
        error={state?.success === false ? state.errors?.jobSearchStatus : undefined}
        label="求职情况"
        name="jobSearchStatus"
      >
        <option value="">请选择</option>
        <option value="在职">在职</option>
        <option value="离职">离职</option>
        <option value="创业">创业</option>
        <option value="灵活就业">灵活就业</option>
        <option value="学生">学生</option>
        <option value="失业">失业</option>
        <option value="暑假工">暑假工</option>
        <option value="寒假工">寒假工</option>
        <option value="实习生">实习生</option>
      </FormSelect>
      <FormInput
        defaultValue={candidate?.industryBg ?? ''}
        error={state?.success === false ? state.errors?.industryBg : undefined}
        label="行业背景"
        name="industryBg"
      />
      <FormInput
        defaultValue={candidate?.communication ?? '待跟进'}
        error={state?.success === false ? state.errors?.communication : undefined}
        label="沟通状态"
        name="communication"
      />
      <FormInput
        defaultValue={candidate?.link ?? ''}
        error={state?.success === false ? state.errors?.link : undefined}
        label="链接"
        name="link"
        placeholder="候选人相关链接（如领英、作品集等）"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.selfIntro ?? ''}
        error={state?.success === false ? state.errors?.selfIntro : undefined}
        label="自我介绍"
        name="selfIntro"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.strengths ?? ''}
        error={state?.success === false ? state.errors?.strengths : undefined}
        label="个人优势"
        name="strengths"
        placeholder="提炼候选人的核心竞争力和优势亮点"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.workExperience ?? ''}
        error={state?.success === false ? state.errors?.workExperience : undefined}
        label="工作经历"
        name="workExperience"
        placeholder="按时间倒序列出主要工作经历、公司、职位、职责"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.educationDetail ?? ''}
        error={state?.success === false ? state.errors?.educationDetail : undefined}
        label="教育经历"
        name="educationDetail"
        placeholder="学校、专业、学位、入学-毕业时间"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.projects ?? ''}
        error={state?.success === false ? state.errors?.projects : undefined}
        label="项目经历"
        name="projects"
        placeholder="重点项目名称、角色、成果、所用技术"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.languages ?? ''}
        error={state?.success === false ? state.errors?.languages : undefined}
        label="语言能力"
        name="languages"
        placeholder="例如：英语 CET-6 / 日语 N1"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.certificates ?? ''}
        error={state?.success === false ? state.errors?.certificates : undefined}
        label="技能证书"
        name="certificates"
        placeholder="例如：PMP、CPA、AWS认证"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.awards ?? ''}
        error={state?.success === false ? state.errors?.awards : undefined}
        label="获奖经历"
        name="awards"
        placeholder="例如：年度最佳员工、技术大赛一等奖"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.otherAbilities ?? ''}
        error={state?.success === false ? state.errors?.otherAbilities : undefined}
        label="其他能力"
        name="otherAbilities"
        placeholder="其他补充技能、特长、兴趣爱好等"
      />
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.resumeRaw ?? ''}
        error={state?.success === false ? state.errors?.resumeRaw : undefined}
        label="简历原文"
        name="resumeRaw"
      />
      <div className="span-full file-upload-area">
        <span className="ui-form-label">简历附件</span>
        <FileAttachments existing={parseAttachments(candidate?.attachments ?? null)} />
      </div>
      <FormTextarea
        className="span-full textarea-tall"
        defaultValue={candidate?.note ?? ''}
        error={state?.success === false ? state.errors?.note : undefined}
        label="备注"
        name="note"
      />
      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions ? (
        <FormSubmitButton loading={isPending}>
          {candidate ? '保存修改' : '保存候选人'}
        </FormSubmitButton>
      ) : null}
    </form>
  )
}
