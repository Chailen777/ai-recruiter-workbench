'use server'

import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/form'
import { required, validateForm } from '@/lib/form'
import { prisma } from '@/lib/prisma'
import { processAttachments, deleteAllAttachments, saveAvatar, removeAvatar } from '@/lib/uploads'
import { syncCompanyMd, deleteCompanyMd } from '@/lib/markdown'
import { actionError, actionSuccess, collectErrors, value, multiValue, cityValue, requiredValue } from './shared'

export async function createCompany(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  try {
    const company = await prisma.company.create({
      data: {
        name: requiredValue(formData, 'name'),
        industry: value(formData, 'industry'),
        city: cityValue(formData),
        source: value(formData, 'source'),
        cooperationStatus: multiValue(formData, 'cooperationStatus'),
        address: value(formData, 'address'),
        companyContactName: value(formData, 'companyContactName'),
        companyContactPhone: value(formData, 'companyContactPhone'),
        projectContactName: value(formData, 'projectContactName'),
        projectContactPhone: value(formData, 'projectContactPhone'),
        projectContactWechat: value(formData, 'projectContactWechat'),
        link: value(formData, 'link'),
        attachments: await processAttachments(formData, 'attachments'),
        avatar: await saveAvatar(formData),
        note: value(formData, 'note'),
      },
    })
    try { syncCompanyMd(company) } catch {}
    revalidatePath('/companies')
    return actionSuccess()
  } catch (error) {
    return actionError('保存企业失败，请稍后重试', collectErrors(error))
  }
}

export async function updateCompany(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少企业 ID', { id: '企业 ID 无效' })

  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  try {
    const existing = await prisma.company.findUnique({ where: { id }, select: { avatar: true } })
    const company = await prisma.company.update({
      where: { id },
      data: {
        name: requiredValue(formData, 'name'),
        industry: value(formData, 'industry'),
        city: cityValue(formData),
        source: value(formData, 'source'),
        cooperationStatus: multiValue(formData, 'cooperationStatus'),
        address: value(formData, 'address'),
        companyContactName: value(formData, 'companyContactName'),
        companyContactPhone: value(formData, 'companyContactPhone'),
        projectContactName: value(formData, 'projectContactName'),
        projectContactPhone: value(formData, 'projectContactPhone'),
        projectContactWechat: value(formData, 'projectContactWechat'),
        link: value(formData, 'link'),
        attachments: await processAttachments(formData, 'attachments'),
        avatar: await saveAvatar(formData, existing?.avatar),
        note: value(formData, 'note'),
      },
    })
    try { syncCompanyMd(company) } catch {}
    revalidatePath('/companies')
    return actionSuccess()
  } catch (error) {
    return actionError('更新企业失败，请稍后重试', collectErrors(error))
  }
}

export async function deleteCompany(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少企业 ID')
  const company = await prisma.company.findUnique({ where: { id }, select: { attachments: true, avatar: true } })
  // 先删文件，再删 DB
  if (company) {
    await deleteAllAttachments(company.attachments)
    await removeAvatar(company.avatar)
  }
  await prisma.company.delete({ where: { id } })
  try { deleteCompanyMd(id) } catch {}
  revalidatePath('/companies')
}
