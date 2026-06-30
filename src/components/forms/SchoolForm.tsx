'use client'

import { useEffect, useRef } from 'react'

import { createSchool, updateSchool } from '@/app/actions'
import { parseAttachments } from '@/lib/attachment-utils'
import { CoverUpload } from '@/components/ui/CoverUpload'
import { FormError, FormSubmitButton } from '@/components/ui/Form'
import { FileAttachments } from './FileAttachments'
import { useFormAction } from '@/hooks/useFormAction'
import type { SchoolRow } from '@/app/schools/page'

import { SCHOOL_TYPE_OPTIONS } from './form-utils'

const SCHOOL_NATURE_OPTIONS = ['公办', '民办', '中外合作', '军校']
const SCHOOL_CATEGORY_OPTIONS = ['综合类', '理工类', '师范类', '医药类', '财经类', '农林类', '艺术类']
const EDUCATION_LEVEL_OPTIONS = ['本科', '高职专科', '本硕博一体']
const DOUBLE_FIRST_CLASS_OPTIONS = ['A类', 'B类', '双一流学科']
const GRAD_RECOMMEND_OPTIONS = ['有', '无']

export function SchoolForm({
  school,
  onClose,
  hideActions,
  onSubmitRef,
}: {
  school?: SchoolRow
  onClose?: () => void
  hideActions?: boolean
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const isEdit = Boolean(school)
  const action = isEdit ? updateSchool : createSchool
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
      {isEdit && <input name="id" type="hidden" value={school!.id} />}

      <div className="form-field span-full">
        <label>封面图片</label>
        <CoverUpload
          current={school?.cover ?? null}
          name="cover"
        />
      </div>

      <div className="form-field">
        <label htmlFor="name">学校名称 *</label>
        <input
          defaultValue={school?.name ?? ''}
          id="name"
          name="name"
          placeholder="请输入学校名称"
          required
          type="text"
        />
      </div>

      <div className="form-field span-full content-block">
        <label htmlFor="content">内容</label>
        <textarea
          className="ui-form-control"
          defaultValue={school?.content ?? ''}
          id="content"
          name="content"
          placeholder="请输入学校介绍与详情内容"
          rows={9}
        />
      </div>

      <div className="form-field">
        <label htmlFor="schoolType">类型</label>
        <select defaultValue={school?.schoolType ?? ''} id="schoolType" name="schoolType">
          <option value="">请选择</option>
          {SCHOOL_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="city">城市</label>
        <input
          defaultValue={school?.city ?? ''}
          id="city"
          name="city"
          placeholder="请输入城市"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="address">地址</label>
        <input
          defaultValue={school?.address ?? ''}
          id="address"
          name="address"
          placeholder="请输入地址"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="foundedYear">成立时间</label>
        <input
          defaultValue={school?.foundedYear ?? ''}
          id="foundedYear"
          name="foundedYear"
          placeholder="请输入成立时间"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="mainMajors">主打专业</label>
        <input
          defaultValue={school?.mainMajors ?? ''}
          id="mainMajors"
          name="mainMajors"
          placeholder="请输入主打专业"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="campusCount">学区数量</label>
        <input
          defaultValue={school?.campusCount ?? ''}
          id="campusCount"
          name="campusCount"
          placeholder="请输入学区数量"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="studentCount">在校人数</label>
        <input
          defaultValue={school?.studentCount ?? ''}
          id="studentCount"
          name="studentCount"
          placeholder="请输入在校人数"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="schoolNature">办学性质</label>
        <select defaultValue={school?.schoolNature ?? ''} id="schoolNature" name="schoolNature">
          <option value="">请选择</option>
          {SCHOOL_NATURE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="schoolCategory">院校类型</label>
        <select defaultValue={school?.schoolCategory ?? ''} id="schoolCategory" name="schoolCategory">
          <option value="">请选择</option>
          {SCHOOL_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="educationLevel">学历层次</label>
        <select defaultValue={school?.educationLevel ?? ''} id="educationLevel" name="educationLevel">
          <option value="">请选择</option>
          {EDUCATION_LEVEL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="doubleFirstClass">双一流</label>
        <select defaultValue={school?.doubleFirstClass ?? ''} id="doubleFirstClass" name="doubleFirstClass">
          <option value="">请选择</option>
          {DOUBLE_FIRST_CLASS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="graduatePrograms">硕士点/博士点</label>
        <input
          defaultValue={school?.graduatePrograms ?? ''}
          id="graduatePrograms"
          name="graduatePrograms"
          placeholder="请输入有无、一级学科数量"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="gradRecommendation">保研资格</label>
        <select defaultValue={school?.gradRecommendation ?? ''} id="gradRecommendation" name="gradRecommendation">
          <option value="">请选择</option>
          {GRAD_RECOMMEND_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="keyDisciplinesCount">国家级重点学科数量</label>
        <input
          defaultValue={school?.keyDisciplinesCount ?? ''}
          id="keyDisciplinesCount"
          name="keyDisciplinesCount"
          placeholder="请输入数量"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="academicianCount">院士数量</label>
        <input
          defaultValue={school?.academicianCount ?? ''}
          id="academicianCount"
          name="academicianCount"
          placeholder="请输入数量"
          type="text"
        />
      </div>

      <div className="form-field span-full">
        <label htmlFor="link">链接</label>
        <input
          defaultValue={school?.link ?? ''}
          id="link"
          name="link"
          placeholder="请输入学校网址链接"
          type="url"
        />
      </div>

      <div className="form-field span-full">
        <label htmlFor="note">备注</label>
        <textarea
          className="ui-form-control"
          defaultValue={school?.note ?? ''}
          id="note"
          name="note"
          placeholder="请输入备注"
          rows={6}
        />
      </div>

      <FileAttachments existing={parseAttachments(school?.attachments ?? null)} />

      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>
          {isEdit ? '保存修改' : '保存学校'}
        </FormSubmitButton>
      )}
    </form>
  )
}
