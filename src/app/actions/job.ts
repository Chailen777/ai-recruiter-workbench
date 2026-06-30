'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/lib/form'
import { required, validateForm } from '@/lib/form'
import { prisma } from '@/lib/prisma'
import { processAttachments, deleteAllAttachments, saveAvatar, removeAvatar } from '@/lib/uploads'
import { syncJobMd, deleteJobMd } from '@/lib/markdown'
import { applyJobStatusEffects } from '@/lib/workflow'
import { actionError, actionSuccess, collectErrors, value, intValue, requiredValue } from './shared'

export async function createJob(formData: FormData): Promise<ActionResult> {
  const companyName = requiredValue(formData, 'companyName')
  if (!companyName) return actionError('请输入企业名称', { companyName: '企业名称不能为空' })

  // 自动匹配企业库：按名称查找，找不到则自动创建
  let selectedCompany = await prisma.company.findFirst({ where: { name: companyName } })
  if (!selectedCompany) {
    selectedCompany = await prisma.company.create({
      data: { name: companyName, source: '岗位录入', cooperationStatus: '待沟通' },
    })
  }

  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  try {
    const job = await prisma.job.create({
      data: {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        title: requiredValue(formData, 'title'),
        city: value(formData, 'city'),
        salaryRange: value(formData, 'salaryRange'),
        guaranteePeriod: value(formData, 'guaranteePeriod'),
        commission: value(formData, 'commission'),
        educationRequirement: value(formData, 'educationRequirement'),
        ageRequirement: value(formData, 'ageRequirement'),
        experienceRequirement: value(formData, 'experienceRequirement'),
        jobCategory: value(formData, 'jobCategory'),
        skillKeywords: value(formData, 'skillKeywords'),
        mustHave: value(formData, 'mustHave'),
        niceToHave: value(formData, 'niceToHave'),
        exclusions: value(formData, 'exclusions'),
        jdRaw: value(formData, 'jdRaw'),
        highlights: value(formData, 'highlights'),
        responsibilities: value(formData, 'responsibilities'),
        requirements: value(formData, 'requirements'),
        headcount: intValue(formData, 'headcount'),
        workLocation: value(formData, 'workLocation'),
        orderNotes: value(formData, 'orderNotes'),
        commissionRules: value(formData, 'commissionRules'),
        deliveryMode: value(formData, 'deliveryMode'),
        status: requiredValue(formData, 'status') || '待发布',
        tags: value(formData, 'tags'),
        source: value(formData, 'source'),
        link: value(formData, 'link'),
        website: value(formData, 'website'),
        industry: value(formData, 'industry'),
        attachments: await processAttachments(formData, 'attachments'),
        avatar: await saveAvatar(formData),
      },
    })
    try { syncJobMd(job) } catch {}
    revalidatePath('/jobs')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createJob]', error)
    return actionError(`保存岗位失败: ${msg}`, collectErrors(error))
  }
}

export async function quickCreateCompanyFromJob(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  try {
    const company = await prisma.company.create({
      data: {
        name: requiredValue(formData, 'name'),
        industry: value(formData, 'industry'),
        city: value(formData, 'city'),
        source: '手工录入',
        cooperationStatus: '待沟通',
      },
    })
    revalidatePath('/jobs')
    redirect(`/jobs?companyId=${company.id}`)
  } catch (error) {
    return actionError('快速创建企业失败', collectErrors(error))
  }
}

export async function updateJob(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少岗位 ID', { id: '岗位 ID 无效' })

  const companyName = requiredValue(formData, 'companyName')
  let matchedCompany = null
  if (companyName) {
    matchedCompany = await prisma.company.findFirst({ where: { name: companyName } })
    if (!matchedCompany) {
      matchedCompany = await prisma.company.create({
        data: { name: companyName, source: '岗位录入', cooperationStatus: '待沟通' },
      })
      revalidatePath('/companies')
    }
  }

  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  const status = requiredValue(formData, 'status') || '待发布'
  try {
    const existing = await prisma.job.findUnique({ where: { id }, select: { avatar: true } })
    const job = await prisma.job.update({
      where: { id },
      data: {
        companyId: matchedCompany?.id ?? null,
        companyName: matchedCompany?.name ?? companyName,
        title: requiredValue(formData, 'title'),
        city: value(formData, 'city'),
        salaryRange: value(formData, 'salaryRange'),
        guaranteePeriod: value(formData, 'guaranteePeriod'),
        commission: value(formData, 'commission'),
        educationRequirement: value(formData, 'educationRequirement'),
        ageRequirement: value(formData, 'ageRequirement'),
        experienceRequirement: value(formData, 'experienceRequirement'),
        jobCategory: value(formData, 'jobCategory'),
        skillKeywords: value(formData, 'skillKeywords'),
        mustHave: value(formData, 'mustHave'),
        niceToHave: value(formData, 'niceToHave'),
        exclusions: value(formData, 'exclusions'),
        jdRaw: value(formData, 'jdRaw'),
        highlights: value(formData, 'highlights'),
        responsibilities: value(formData, 'responsibilities'),
        requirements: value(formData, 'requirements'),
        headcount: intValue(formData, 'headcount'),
        workLocation: value(formData, 'workLocation'),
        orderNotes: value(formData, 'orderNotes'),
        commissionRules: value(formData, 'commissionRules'),
        deliveryMode: value(formData, 'deliveryMode'),
        status,
        tags: value(formData, 'tags'),
        source: value(formData, 'source'),
        link: value(formData, 'link'),
        website: value(formData, 'website'),
        industry: value(formData, 'industry'),
        attachments: await processAttachments(formData, 'attachments'),
        avatar: await saveAvatar(formData, existing?.avatar),
      },
    })
    try { syncJobMd(job) } catch {}
    await applyJobStatusEffects(prisma, id, status)
    revalidatePath('/jobs')
    revalidatePath('/match')
    revalidatePath('/home')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateJob]', error)
    return actionError(`更新岗位失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteJob(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少岗位 ID')
  const job = await prisma.job.findUnique({ where: { id }, select: { attachments: true, avatar: true } })
  // 先删文件，再删 DB
  if (job) {
    await deleteAllAttachments(job.attachments)
    await removeAvatar(job.avatar)
  }
  await prisma.job.delete({ where: { id } })
  try { deleteJobMd(id) } catch {}
  revalidatePath('/jobs')
}
