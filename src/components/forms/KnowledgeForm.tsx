'use client'

import { useEffect, useRef } from 'react'

import { createKnowledge, updateKnowledge } from '@/app/actions'
import { parseAttachments } from '@/lib/attachment-utils'
import { CoverUpload } from '@/components/ui/CoverUpload'
import { FormError, FormSubmitButton } from '@/components/ui/Form'
import { FileAttachments } from './FileAttachments'
import { useFormAction } from '@/hooks/useFormAction'
import type { KnowledgeRow } from '@/app/knowledge/page'

const PUBLIC_OPTIONS = ['公开', '内部可见', '私密']
const REVIEW_OPTIONS = ['待审核', '已通过', '驳回']
const DOC_FORMAT_OPTIONS = ['图文', '表格', '视频', '附件']
const TARGET_OPTIONS = ['学生', '职场', '企业管理']

export function KnowledgeForm({
  knowledge,
  onClose,
  hideActions,
  onSubmitRef,
}: {
  knowledge?: KnowledgeRow
  onClose?: () => void
  hideActions?: boolean
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const isEdit = Boolean(knowledge)
  const action = isEdit ? updateKnowledge : createKnowledge
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
      {isEdit && <input name="id" type="hidden" value={knowledge!.id} />}

      <div className="form-field span-full">
        <label>封面图片</label>
        <CoverUpload
          current={knowledge?.cover ?? null}
          name="cover"
        />
      </div>

      <div className="form-field span-full content-block">
        <label htmlFor="content">内容</label>
        <textarea
          className="ui-form-control"
          defaultValue={knowledge?.content ?? ''}
          id="content"
          name="content"
          placeholder="请输入内容"
          rows={9}
        />
      </div>

      <div className="form-field">
        <label htmlFor="title">知识标题 *</label>
        <input
          defaultValue={knowledge?.title ?? ''}
          id="title"
          name="title"
          placeholder="请输入知识标题"
          required
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="author">作者</label>
        <input
          defaultValue={knowledge?.author ?? ''}
          id="author"
          name="author"
          placeholder="请输入作者"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="category">分类</label>
        <input
          defaultValue={knowledge?.category ?? ''}
          id="category"
          name="category"
          placeholder="请输入分类"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="source">来源</label>
        <input
          defaultValue={knowledge?.source ?? ''}
          id="source"
          name="source"
          placeholder="请输入来源"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="url">链接</label>
        <input
          defaultValue={knowledge?.url ?? ''}
          id="url"
          name="url"
          placeholder="请输入链接"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="tags">标签</label>
        <input
          defaultValue={knowledge?.tags ?? ''}
          id="tags"
          name="tags"
          placeholder="请输入标签，逗号分隔"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="publicStatus">公开状态</label>
        <select defaultValue={knowledge?.publicStatus ?? '公开'} id="publicStatus" name="publicStatus">
          {PUBLIC_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="reviewStatus">审核状态</label>
        <select defaultValue={knowledge?.reviewStatus ?? '待审核'} id="reviewStatus" name="reviewStatus">
          {REVIEW_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="docFormat">文档格式</label>
        <select defaultValue={knowledge?.docFormat ?? ''} id="docFormat" name="docFormat">
          <option value="">请选择</option>
          {DOC_FORMAT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="targetAudience">目标受众</label>
        <select defaultValue={knowledge?.targetAudience ?? ''} id="targetAudience" name="targetAudience">
          <option value="">请选择</option>
          {TARGET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <FileAttachments existing={parseAttachments(knowledge?.attachments ?? null)} />

      <div className="form-field span-full">
        <label htmlFor="note">备注</label>
        <textarea
          className="ui-form-control"
          defaultValue={knowledge?.note ?? ''}
          id="note"
          name="note"
          placeholder="请输入备注"
          rows={6}
        />
      </div>

      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>
          {isEdit ? '保存修改' : '保存知识'}
        </FormSubmitButton>
      )}
    </form>
  )
}
