'use client'

import { useEffect, useRef } from 'react'

import { createContact, updateContact } from '@/app/actions'
import { parseAttachments } from '@/lib/attachment-utils'
import { FormError, FormSubmitButton } from '@/components/ui/Form'
import { FileAttachments } from './FileAttachments'
import { useFormAction } from '@/hooks/useFormAction'
import type { ContactRow } from '@/app/contacts/page'

const GENDER_OPTIONS = ['男', '女', '其他']
const BIRTHDAY_TYPE_OPTIONS = ['阳历', '阴历']
const MARITAL_OPTIONS = ['已婚', '未婚', '离异', '保密']
const EDUCATION_OPTIONS = ['高中', '大专', '本科', '硕士', '博士', 'MBA/EMBA', '其他']
const SOURCE_OPTIONS = ['行业会议', '朋友介绍', '线上社交', '前同事', '客户', '候选人转化', '其他']
const STRENGTH_OPTIONS = ['一面之缘', '偶尔联系', '经常沟通', '深度合作', '老朋友']
const FREQUENCY_OPTIONS = ['每周', '每月', '每季度', '每半年', '按需']
const INFLUENCE_OPTIONS = ['A级-关键人脉', 'B级-重要人脉', 'C级-一般人脉', 'D级-待观察']
const RESOURCE_OPTIONS = ['候选人资源', '客户需求', '行业趋势', '投资资源', '媒体资源']

export function ContactForm({
  contact,
  onClose,
  hideActions,
  onSubmitRef,
}: {
  contact?: ContactRow
  onClose?: () => void
  hideActions?: boolean
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const isEdit = Boolean(contact)
  const action = isEdit ? updateContact : createContact
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
      {isEdit && <input name="id" type="hidden" value={contact!.id} />}

      {/* ── 基础信息 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>基础信息</div>

      <div className="form-field">
        <label htmlFor="name">姓名 *</label>
        <input defaultValue={contact?.name ?? ''} id="name" name="name" required type="text" placeholder="请输入姓名" />
      </div>

      <div className="form-field">
        <label htmlFor="gender">性别</label>
        <select defaultValue={contact?.gender ?? ''} id="gender" name="gender">
          <option value="">请选择</option>
          {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="phone">手机号</label>
        <input defaultValue={contact?.phone ?? ''} id="phone" name="phone" type="text" placeholder="请输入手机号" />
      </div>

      <div className="form-field">
        <label htmlFor="wechat">微信号</label>
        <input defaultValue={contact?.wechat ?? ''} id="wechat" name="wechat" type="text" placeholder="请输入微信号" />
      </div>

      <div className="form-field span-full">
        <label htmlFor="email">邮箱</label>
        <input defaultValue={contact?.email ?? ''} id="email" name="email" type="email" placeholder="请输入邮箱" />
      </div>

      {/* ── 个人信息 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>个人信息</div>

      <div className="form-field">
        <label htmlFor="age">年龄</label>
        <input defaultValue={contact?.age ?? ''} id="age" name="age" type="number" placeholder="请输入年龄" />
      </div>

      <div className="form-field">
        <label htmlFor="birthday">生日</label>
        <input defaultValue={dt(contact?.birthday)} id="birthday" name="birthday" type="date" />
      </div>

      <div className="form-field">
        <label htmlFor="birthdayType">生日类型</label>
        <select defaultValue={contact?.birthdayType ?? '阳历'} id="birthdayType" name="birthdayType">
          {BIRTHDAY_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="maritalStatus">婚姻情况</label>
        <select defaultValue={contact?.maritalStatus ?? ''} id="maritalStatus" name="maritalStatus">
          <option value="">请选择</option>
          {MARITAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field span-full">
        <label htmlFor="childrenInfo">孩子情况</label>
        <input defaultValue={contact?.childrenInfo ?? ''} id="childrenInfo" name="childrenInfo" type="text" placeholder="如：1子（5岁）、1女（3岁）" />
      </div>

      <div className="form-field">
        <label htmlFor="religion">宗教信息</label>
        <input defaultValue={contact?.religion ?? ''} id="religion" name="religion" type="text" placeholder="如：无、佛教、基督教" />
      </div>

      {/* ── 工作信息 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>工作信息</div>

      <div className="form-field">
        <label htmlFor="company">工作单位</label>
        <input defaultValue={contact?.company ?? ''} id="company" name="company" type="text" placeholder="请输入公司名称" />
      </div>

      <div className="form-field">
        <label htmlFor="position">职位</label>
        <input defaultValue={contact?.position ?? ''} id="position" name="position" type="text" placeholder="请输入职位" />
      </div>

      <div className="form-field">
        <label htmlFor="industry">行业</label>
        <input defaultValue={contact?.industry ?? ''} id="industry" name="industry" type="text" placeholder="请输入行业" />
      </div>

      <div className="form-field span-full">
        <label htmlFor="workAddress">工作地址</label>
        <input defaultValue={contact?.workAddress ?? ''} id="workAddress" name="workAddress" type="text" placeholder="请输入工作地址" />
      </div>

      {/* ── 家庭与地址 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>家庭与地址</div>

      <div className="form-field span-full">
        <label htmlFor="homeAddress">家庭地址</label>
        <input defaultValue={contact?.homeAddress ?? ''} id="homeAddress" name="homeAddress" type="text" placeholder="请输入家庭地址" />
      </div>

      <div className="form-field">
        <label htmlFor="city">所在城市</label>
        <input defaultValue={contact?.city ?? ''} id="city" name="city" type="text" placeholder="请输入城市" />
      </div>

      {/* ── 教育背景 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>教育背景</div>

      <div className="form-field">
        <label htmlFor="school">毕业学校</label>
        <input defaultValue={contact?.school ?? ''} id="school" name="school" type="text" placeholder="请输入毕业学校" />
      </div>

      <div className="form-field">
        <label htmlFor="major">专业</label>
        <input defaultValue={contact?.major ?? ''} id="major" name="major" type="text" placeholder="请输入专业" />
      </div>

      <div className="form-field">
        <label htmlFor="education">学历</label>
        <select defaultValue={contact?.education ?? ''} id="education" name="education">
          <option value="">请选择</option>
          {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* ── 关系信息 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>关系信息</div>

      <div className="form-field span-full">
        <label htmlFor="firstMetEvent">第一次认识事件</label>
        <input defaultValue={contact?.firstMetEvent ?? ''} id="firstMetEvent" name="firstMetEvent" type="text" placeholder="如：2024年深圳AI峰会茶歇交流" />
      </div>

      <div className="form-field">
        <label htmlFor="firstMetDate">第一次认识时间</label>
        <input defaultValue={dt(contact?.firstMetDate)} id="firstMetDate" name="firstMetDate" type="date" />
      </div>

      <div className="form-field">
        <label htmlFor="introducedBy">中间介绍人</label>
        <input defaultValue={contact?.introducedBy ?? ''} id="introducedBy" name="introducedBy" type="text" placeholder="请输入介绍人姓名" />
      </div>

      <div className="form-field">
        <label htmlFor="source">认识渠道</label>
        <select defaultValue={contact?.source ?? ''} id="source" name="source">
          <option value="">请选择</option>
          {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="relationshipStrength">关系强度</label>
        <select defaultValue={contact?.relationshipStrength ?? ''} id="relationshipStrength" name="relationshipStrength">
          <option value="">请选择</option>
          {STRENGTH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="lastContactDate">最近沟通日期</label>
        <input defaultValue={dt(contact?.lastContactDate)} id="lastContactDate" name="lastContactDate" type="date" />
      </div>

      <div className="form-field">
        <label htmlFor="contactFrequency">沟通频率建议</label>
        <select defaultValue={contact?.contactFrequency ?? ''} id="contactFrequency" name="contactFrequency">
          <option value="">请选择</option>
          {FREQUENCY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field span-full">
        <label htmlFor="nextAction">下一步行动</label>
        <input defaultValue={contact?.nextAction ?? ''} id="nextAction" name="nextAction" type="text" placeholder="如：约咖啡、发资料、引荐某人" />
      </div>

      {/* ── 价值评估 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>价值评估</div>

      <div className="form-field span-full">
        <label htmlFor="coreResources">核心资源</label>
        <select defaultValue={contact?.coreResources ? contact.coreResources.split(',').filter(Boolean) : []} id="coreResources" name="coreResources" multiple style={{ height: 100 }}>
          {RESOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <small style={{ color: 'var(--ds-color-text-muted)' }}>按住 Ctrl 多选</small>
      </div>

      <div className="form-field">
        <label htmlFor="influenceRating">影响力评级</label>
        <select defaultValue={contact?.influenceRating ?? ''} id="influenceRating" name="influenceRating">
          <option value="">请选择</option>
          {INFLUENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="form-field span-full">
        <label htmlFor="cooperationRecord">合作记录</label>
        <textarea className="ui-form-control" defaultValue={contact?.cooperationRecord ?? ''} id="cooperationRecord" name="cooperationRecord" placeholder="简述合作经历" rows={3} />
      </div>

      {/* ── 其他 ── */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--ds-color-text-muted)', borderBottom: '1px solid var(--ds-color-border)', paddingBottom: 4 }}>其他</div>

      <div className="form-field span-full">
        <label htmlFor="tags">标签</label>
        <input defaultValue={contact?.tags ?? ''} id="tags" name="tags" type="text" placeholder="逗号分隔，如：HR总监、AI行业、资源型" />
      </div>

      <FileAttachments existing={parseAttachments(contact?.attachments ?? null)} />

      <div className="form-field span-full">
        <label htmlFor="note">备注</label>
        <textarea className="ui-form-control" defaultValue={contact?.note ?? ''} id="note" name="note" placeholder="请输入备注" rows={4} />
      </div>

      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>{isEdit ? '保存修改' : '保存人脉'}</FormSubmitButton>
      )}
    </form>
  )
}
