'use client'

import { useEffect, useRef } from 'react'

import { createInfo, updateInfo } from '@/app/actions'
import { parseAttachments } from '@/lib/attachment-utils'
import { CoverUpload } from '@/components/ui/CoverUpload'
import { FormError, FormSubmitButton } from '@/components/ui/Form'
import { FileAttachments } from './FileAttachments'
import { useFormAction } from '@/hooks/useFormAction'
import type { InfoRow } from '@/app/info/page'

const CATEGORY_OPTIONS = ['每日新闻', '行业资讯', '沟通记录', '安全提醒', '机会提示']
const URGENCY_OPTIONS = ['普通', '重要', '紧急']
const INFO_SOURCE_OPTIONS = ['官网', '媒体', '内部沟通', '客户反馈', '线下会议']
const RELATED_BUSINESS_OPTIONS = ['市场', '运营', '风控', '项目']

export function InfoForm({
  info,
  onClose,
  hideActions,
  onSubmitRef,
}: {
  info?: InfoRow
  onClose?: () => void
  hideActions?: boolean
  onSubmitRef?: (submitFn: () => void) => void
}) {
  const isEdit = Boolean(info)
  const action = isEdit ? updateInfo : createInfo
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
      {isEdit && <input name="id" type="hidden" value={info!.id} />}

      <div className="form-field span-full">
        <label>封面图片</label>
        <CoverUpload
          current={info?.cover ?? null}
          name="cover"
        />
      </div>

      <div className="form-field span-full content-block">
        <label htmlFor="content">内容</label>
        <textarea
          className="ui-form-control"
          defaultValue={info?.content ?? ''}
          id="content"
          name="content"
          placeholder="请输入内容"
          rows={9}
        />
      </div>

      <div className="form-field">
        <label htmlFor="title">信息标题 *</label>
        <input
          defaultValue={info?.title ?? ''}
          id="title"
          name="title"
          placeholder="请输入信息标题"
          required
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="category">分类</label>
        <select defaultValue={info?.category ?? ''} id="category" name="category">
          <option value="">请选择</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="urgency">紧急等级</label>
        <select defaultValue={info?.urgency ?? '普通'} id="urgency" name="urgency">
          {URGENCY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="infoSource">信息来源</label>
        <select defaultValue={info?.infoSource ?? ''} id="infoSource" name="infoSource">
          <option value="">请选择</option>
          {INFO_SOURCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="relatedBusiness">关联业务板块</label>
        <select defaultValue={info?.relatedBusiness ?? ''} id="relatedBusiness" name="relatedBusiness">
          <option value="">请选择</option>
          {RELATED_BUSINESS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="creator">创建人</label>
        <input
          defaultValue={info?.creator ?? ''}
          id="creator"
          name="creator"
          placeholder="请输入创建人"
          type="text"
        />
      </div>

      <div className="form-field">
        <label htmlFor="pinStatus">置顶标识</label>
        <select defaultValue={info?.pinStatus ?? '普通'} id="pinStatus" name="pinStatus">
          <option value="普通">普通</option>
          <option value="置顶">置顶</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="viewCount">浏览量</label>
        <input
          defaultValue={info?.viewCount ?? 0}
          id="viewCount"
          name="viewCount"
          placeholder="请输入浏览量"
          type="number"
        />
      </div>

      <div className="form-field">
        <label htmlFor="likeCount">点赞数</label>
        <input
          defaultValue={info?.likeCount ?? 0}
          id="likeCount"
          name="likeCount"
          placeholder="请输入点赞数"
          type="number"
        />
      </div>

      <div className="form-field">
        <label htmlFor="shareCount">转发数</label>
        <input
          defaultValue={info?.shareCount ?? 0}
          id="shareCount"
          name="shareCount"
          placeholder="请输入转发数"
          type="number"
        />
      </div>

      <div className="form-field">
        <label htmlFor="purchaseCount">购买数</label>
        <input
          defaultValue={info?.purchaseCount ?? 0}
          id="purchaseCount"
          name="purchaseCount"
          placeholder="请输入购买数"
          type="number"
        />
      </div>

      <div className="form-field">
        <label htmlFor="amount">金额</label>
        <input
          defaultValue={info?.amount ?? ''}
          id="amount"
          name="amount"
          placeholder="请输入金额"
          type="text"
        />
      </div>

      <div className="form-field span-full">
        <label htmlFor="link">链接</label>
        <input
          defaultValue={info?.link ?? ''}
          id="link"
          name="link"
          placeholder="请输入信息链接"
          type="url"
        />
      </div>

      <FileAttachments existing={parseAttachments(info?.attachments ?? null)} />

      <div className="form-field span-full">
        <label htmlFor="note">备注</label>
        <textarea
          className="ui-form-control"
          defaultValue={info?.note ?? ''}
          id="note"
          name="note"
          placeholder="请输入备注"
          rows={6}
        />
      </div>

      <FormError>{state?.success === false ? state.message : null}</FormError>
      {!hideActions && (
        <FormSubmitButton loading={isPending}>
          {isEdit ? '保存修改' : '保存信息'}
        </FormSubmitButton>
      )}
    </form>
  )
}
