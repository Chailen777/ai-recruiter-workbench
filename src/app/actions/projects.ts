'use server'

import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/form'
import { required, validateForm } from '@/lib/form'
import { prisma } from '@/lib/prisma'
import { processAttachments, deleteAllAttachments } from '@/lib/uploads'
import { actionError, actionSuccess, collectErrors, value, intValue, requiredValue } from './shared'

/* ─── Project (项目库) ─── */

export async function createProject(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    await prisma.project.create({
      data: {
        name: requiredValue(formData, 'name'),
        code: value(formData, 'code'),
        clientCompany: value(formData, 'clientCompany'),
        clientContact: value(formData, 'clientContact'),
        projectType: value(formData, 'projectType'),
        industry: value(formData, 'industry'),
        priority: value(formData, 'priority'),
        status: value(formData, 'status') || '洽谈中',
        startDate: value(formData, 'startDate') ? new Date(value(formData, 'startDate')!) : null,
        expectedEndDate: value(formData, 'expectedEndDate') ? new Date(value(formData, 'expectedEndDate')!) : null,
        actualEndDate: value(formData, 'actualEndDate') ? new Date(value(formData, 'actualEndDate')!) : null,
        contractAmount: value(formData, 'contractAmount'),
        chargingModel: value(formData, 'chargingModel'),
        paymentStatus: value(formData, 'paymentStatus'),
        paidAmount: value(formData, 'paidAmount'),
        relatedJobs: value(formData, 'relatedJobs'),
        totalHeadcount: intValue(formData, 'totalHeadcount'),
        recommendedCount: intValue(formData, 'recommendedCount'),
        interviewedCount: intValue(formData, 'interviewedCount'),
        hiredCount: intValue(formData, 'hiredCount'),
        completionRate: value(formData, 'completionRate'),
        lastReportDate: value(formData, 'lastReportDate') ? new Date(value(formData, 'lastReportDate')!) : null,
        nextReportDate: value(formData, 'nextReportDate') ? new Date(value(formData, 'nextReportDate')!) : null,
        painPoints: value(formData, 'painPoints'),
        competitorInfo: value(formData, 'competitorInfo'),
        tags: value(formData, 'tags'),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { revalidatePath('/projects') } catch {}
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createProject]', error)
    return actionError(`保存项目失败: ${msg}`, collectErrors(error))
  }
}

export async function updateProject(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少项目 ID', { id: '项目 ID 无效' })
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    await prisma.project.update({
      where: { id },
      data: {
        name: requiredValue(formData, 'name'),
        code: value(formData, 'code'),
        clientCompany: value(formData, 'clientCompany'),
        clientContact: value(formData, 'clientContact'),
        projectType: value(formData, 'projectType'),
        industry: value(formData, 'industry'),
        priority: value(formData, 'priority'),
        status: value(formData, 'status') || '洽谈中',
        startDate: value(formData, 'startDate') ? new Date(value(formData, 'startDate')!) : null,
        expectedEndDate: value(formData, 'expectedEndDate') ? new Date(value(formData, 'expectedEndDate')!) : null,
        actualEndDate: value(formData, 'actualEndDate') ? new Date(value(formData, 'actualEndDate')!) : null,
        contractAmount: value(formData, 'contractAmount'),
        chargingModel: value(formData, 'chargingModel'),
        paymentStatus: value(formData, 'paymentStatus'),
        paidAmount: value(formData, 'paidAmount'),
        relatedJobs: value(formData, 'relatedJobs'),
        totalHeadcount: intValue(formData, 'totalHeadcount'),
        recommendedCount: intValue(formData, 'recommendedCount'),
        interviewedCount: intValue(formData, 'interviewedCount'),
        hiredCount: intValue(formData, 'hiredCount'),
        completionRate: value(formData, 'completionRate'),
        lastReportDate: value(formData, 'lastReportDate') ? new Date(value(formData, 'lastReportDate')!) : null,
        nextReportDate: value(formData, 'nextReportDate') ? new Date(value(formData, 'nextReportDate')!) : null,
        painPoints: value(formData, 'painPoints'),
        competitorInfo: value(formData, 'competitorInfo'),
        tags: value(formData, 'tags'),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { revalidatePath('/projects') } catch {}
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateProject]', error)
    return actionError(`更新项目失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少项目 ID')
  const item = await prisma.project.findUnique({ where: { id }, select: { attachments: true } })
  if (item) {
    await deleteAllAttachments(item.attachments)
  }
  await prisma.project.delete({ where: { id } })
  try { revalidatePath('/projects') } catch {}
}
