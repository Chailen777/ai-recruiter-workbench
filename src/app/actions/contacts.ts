'use server'

import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/form'
import { required, validateForm } from '@/lib/form'
import { prisma } from '@/lib/prisma'
import { processAttachments, deleteAllAttachments } from '@/lib/uploads'
import { actionError, actionSuccess, collectErrors, value, intValue, requiredValue } from './shared'
import { requireServerAuth } from '@/lib/server-auth'

/* ─── Contact (人脉库) ─── */

export async function createContact(formData: FormData): Promise<ActionResult> {
  await requireServerAuth()
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    await prisma.contact.create({
      data: {
        name: requiredValue(formData, 'name'),
        gender: value(formData, 'gender'),
        phone: value(formData, 'phone'),
        wechat: value(formData, 'wechat'),
        email: value(formData, 'email'),
        age: intValue(formData, 'age'),
        birthday: value(formData, 'birthday') ? new Date(value(formData, 'birthday')!) : null,
        birthdayType: value(formData, 'birthdayType'),
        maritalStatus: value(formData, 'maritalStatus'),
        childrenInfo: value(formData, 'childrenInfo'),
        religion: value(formData, 'religion'),
        company: value(formData, 'company'),
        position: value(formData, 'position'),
        industry: value(formData, 'industry'),
        workAddress: value(formData, 'workAddress'),
        homeAddress: value(formData, 'homeAddress'),
        city: value(formData, 'city'),
        school: value(formData, 'school'),
        major: value(formData, 'major'),
        education: value(formData, 'education'),
        firstMetEvent: value(formData, 'firstMetEvent'),
        firstMetDate: value(formData, 'firstMetDate') ? new Date(value(formData, 'firstMetDate')!) : null,
        introducedBy: value(formData, 'introducedBy'),
        source: value(formData, 'source'),
        relationshipStrength: value(formData, 'relationshipStrength'),
        lastContactDate: value(formData, 'lastContactDate') ? new Date(value(formData, 'lastContactDate')!) : null,
        contactFrequency: value(formData, 'contactFrequency'),
        nextAction: value(formData, 'nextAction'),
        coreResources: value(formData, 'coreResources'),
        influenceRating: value(formData, 'influenceRating'),
        cooperationRecord: value(formData, 'cooperationRecord'),
        tags: value(formData, 'tags'),
        avatar: value(formData, 'avatar'),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { revalidatePath('/contacts') } catch {}
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createContact]', error)
    return actionError(`保存人脉失败: ${msg}`, collectErrors(error))
  }
}

export async function updateContact(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少人脉 ID', { id: '人脉 ID 无效' })
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    await prisma.contact.update({
      where: { id },
      data: {
        name: requiredValue(formData, 'name'),
        gender: value(formData, 'gender'),
        phone: value(formData, 'phone'),
        wechat: value(formData, 'wechat'),
        email: value(formData, 'email'),
        age: intValue(formData, 'age'),
        birthday: value(formData, 'birthday') ? new Date(value(formData, 'birthday')!) : null,
        birthdayType: value(formData, 'birthdayType'),
        maritalStatus: value(formData, 'maritalStatus'),
        childrenInfo: value(formData, 'childrenInfo'),
        religion: value(formData, 'religion'),
        company: value(formData, 'company'),
        position: value(formData, 'position'),
        industry: value(formData, 'industry'),
        workAddress: value(formData, 'workAddress'),
        homeAddress: value(formData, 'homeAddress'),
        city: value(formData, 'city'),
        school: value(formData, 'school'),
        major: value(formData, 'major'),
        education: value(formData, 'education'),
        firstMetEvent: value(formData, 'firstMetEvent'),
        firstMetDate: value(formData, 'firstMetDate') ? new Date(value(formData, 'firstMetDate')!) : null,
        introducedBy: value(formData, 'introducedBy'),
        source: value(formData, 'source'),
        relationshipStrength: value(formData, 'relationshipStrength'),
        lastContactDate: value(formData, 'lastContactDate') ? new Date(value(formData, 'lastContactDate')!) : null,
        contactFrequency: value(formData, 'contactFrequency'),
        nextAction: value(formData, 'nextAction'),
        coreResources: value(formData, 'coreResources'),
        influenceRating: value(formData, 'influenceRating'),
        cooperationRecord: value(formData, 'cooperationRecord'),
        tags: value(formData, 'tags'),
        avatar: value(formData, 'avatar'),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { revalidatePath('/contacts') } catch {}
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateContact]', error)
    return actionError(`更新人脉失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteContact(formData: FormData): Promise<void> {
  await requireServerAuth()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少人脉 ID')
  const item = await prisma.contact.findUnique({ where: { id }, select: { attachments: true } })
  if (item) {
    await deleteAllAttachments(item.attachments)
  }
  await prisma.contact.delete({ where: { id } })
  try { revalidatePath('/contacts') } catch {}
}
