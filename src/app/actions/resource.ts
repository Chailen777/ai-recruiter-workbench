'use server'

import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/form'
import { required, validateForm } from '@/lib/form'
import { prisma } from '@/lib/prisma'
import { processAttachments, deleteAllAttachments, saveCover, removeCover } from '@/lib/uploads'
import {
  syncKnowledgeMd, deleteKnowledgeMd,
  syncSchoolMd, deleteSchoolMd,
  syncChartMd, deleteChartMd,
  syncInfoMd, deleteInfoMd,
} from '@/lib/markdown'
import { actionError, actionSuccess, collectErrors, value, intValue, requiredValue } from './shared'

/* ─── Knowledge ─── */

export async function createKnowledge(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const knowledge = await prisma.knowledge.create({
      data: {
        title: requiredValue(formData, 'title'),
        author: value(formData, 'author'),
        category: value(formData, 'category'),
        content: value(formData, 'content'),
        source: value(formData, 'source'),
        url: value(formData, 'url'),
        tags: value(formData, 'tags'),
        publicStatus: value(formData, 'publicStatus') || '内部可见',
        reviewStatus: value(formData, 'reviewStatus') || '待审核',
        docFormat: value(formData, 'docFormat'),
        targetAudience: value(formData, 'targetAudience'),
        cover: await saveCover(formData),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncKnowledgeMd(knowledge) } catch {}
    revalidatePath('/knowledge')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createKnowledge]', error)
    return actionError(`保存知识失败: ${msg}`, collectErrors(error))
  }
}

export async function updateKnowledge(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少知识 ID', { id: '知识 ID 无效' })
  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const existing = await prisma.knowledge.findUnique({ where: { id }, select: { cover: true } })
    const knowledge = await prisma.knowledge.update({
      where: { id },
      data: {
        title: requiredValue(formData, 'title'),
        author: value(formData, 'author'),
        category: value(formData, 'category'),
        content: value(formData, 'content'),
        source: value(formData, 'source'),
        url: value(formData, 'url'),
        tags: value(formData, 'tags'),
        publicStatus: value(formData, 'publicStatus') || '内部可见',
        reviewStatus: value(formData, 'reviewStatus') || '待审核',
        docFormat: value(formData, 'docFormat'),
        targetAudience: value(formData, 'targetAudience'),
        cover: await saveCover(formData, existing?.cover),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncKnowledgeMd(knowledge) } catch {}
    revalidatePath('/knowledge')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateKnowledge]', error)
    return actionError(`更新知识失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteKnowledge(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少知识 ID')
  const item = await prisma.knowledge.findUnique({ where: { id }, select: { attachments: true, cover: true } })
  if (item) {
    await deleteAllAttachments(item.attachments)
    await removeCover(item.cover)
  }
  await prisma.knowledge.delete({ where: { id } })
  try { deleteKnowledgeMd(id) } catch {}
  revalidatePath('/knowledge')
}

/* ─── School ─── */

export async function createSchool(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const school = await prisma.school.create({
      data: {
        name: requiredValue(formData, 'name'),
        schoolType: value(formData, 'schoolType'),
        city: value(formData, 'city'),
        address: value(formData, 'address'),
        foundedYear: value(formData, 'foundedYear'),
        mainMajors: value(formData, 'mainMajors'),
        campusCount: value(formData, 'campusCount'),
        studentCount: value(formData, 'studentCount'),
        schoolNature: value(formData, 'schoolNature'),
        schoolCategory: value(formData, 'schoolCategory'),
        educationLevel: value(formData, 'educationLevel'),
        doubleFirstClass: value(formData, 'doubleFirstClass'),
        graduatePrograms: value(formData, 'graduatePrograms'),
        gradRecommendation: value(formData, 'gradRecommendation'),
        keyDisciplinesCount: value(formData, 'keyDisciplinesCount'),
        academicianCount: value(formData, 'academicianCount'),
        content: value(formData, 'content'),
        link: value(formData, 'link'),
        cover: await saveCover(formData),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncSchoolMd(school) } catch {}
    revalidatePath('/schools')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createSchool]', error)
    return actionError(`保存学校失败: ${msg}`, collectErrors(error))
  }
}

export async function updateSchool(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少学校 ID', { id: '学校 ID 无效' })
  const { errors, valid } = validateForm(formData, { name: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const existing = await prisma.school.findUnique({ where: { id }, select: { cover: true } })
    const school = await prisma.school.update({
      where: { id },
      data: {
        name: requiredValue(formData, 'name'),
        schoolType: value(formData, 'schoolType'),
        city: value(formData, 'city'),
        address: value(formData, 'address'),
        foundedYear: value(formData, 'foundedYear'),
        mainMajors: value(formData, 'mainMajors'),
        campusCount: value(formData, 'campusCount'),
        studentCount: value(formData, 'studentCount'),
        schoolNature: value(formData, 'schoolNature'),
        schoolCategory: value(formData, 'schoolCategory'),
        educationLevel: value(formData, 'educationLevel'),
        doubleFirstClass: value(formData, 'doubleFirstClass'),
        graduatePrograms: value(formData, 'graduatePrograms'),
        gradRecommendation: value(formData, 'gradRecommendation'),
        keyDisciplinesCount: value(formData, 'keyDisciplinesCount'),
        academicianCount: value(formData, 'academicianCount'),
        content: value(formData, 'content'),
        link: value(formData, 'link'),
        cover: await saveCover(formData, existing?.cover),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncSchoolMd(school) } catch {}
    revalidatePath('/schools')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateSchool]', error)
    return actionError(`更新学校失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteSchool(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少学校 ID')
  const item = await prisma.school.findUnique({ where: { id }, select: { attachments: true, cover: true } })
  if (item) {
    await deleteAllAttachments(item.attachments)
    await removeCover(item.cover)
  }
  await prisma.school.delete({ where: { id } })
  try { deleteSchoolMd(id) } catch {}
  revalidatePath('/schools')
}

/* ─── Chart ─── */

export async function createChart(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const chart = await prisma.chart.create({
      data: {
        title: requiredValue(formData, 'title'),
        dataDeadline: value(formData, 'dataDeadline') ? new Date(value(formData, 'dataDeadline')!) : null,
        statPeriod: value(formData, 'statPeriod'),
        statDimension: value(formData, 'statDimension'),
        comparePeriod: value(formData, 'comparePeriod'),
        creator: value(formData, 'creator'),
        dataSource: value(formData, 'dataSource'),
        indicatorTotal: value(formData, 'indicatorTotal'),
        statUnit: value(formData, 'statUnit'),
        dataSourceNote: value(formData, 'dataSourceNote'),
        content: value(formData, 'content'),
        link: value(formData, 'link'),
        cover: await saveCover(formData),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncChartMd(chart) } catch {}
    revalidatePath('/charts')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createChart]', error)
    return actionError(`保存图表失败: ${msg}`, collectErrors(error))
  }
}

export async function updateChart(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少图表 ID', { id: '图表 ID 无效' })
  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const existing = await prisma.chart.findUnique({ where: { id }, select: { cover: true } })
    const chart = await prisma.chart.update({
      where: { id },
      data: {
        title: requiredValue(formData, 'title'),
        dataDeadline: value(formData, 'dataDeadline') ? new Date(value(formData, 'dataDeadline')!) : null,
        statPeriod: value(formData, 'statPeriod'),
        statDimension: value(formData, 'statDimension'),
        comparePeriod: value(formData, 'comparePeriod'),
        creator: value(formData, 'creator'),
        dataSource: value(formData, 'dataSource'),
        indicatorTotal: value(formData, 'indicatorTotal'),
        statUnit: value(formData, 'statUnit'),
        dataSourceNote: value(formData, 'dataSourceNote'),
        content: value(formData, 'content'),
        link: value(formData, 'link'),
        cover: await saveCover(formData, existing?.cover),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncChartMd(chart) } catch {}
    revalidatePath('/charts')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateChart]', error)
    return actionError(`更新图表失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteChart(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少图表 ID')
  const item = await prisma.chart.findUnique({ where: { id }, select: { attachments: true, cover: true } })
  if (item) {
    await deleteAllAttachments(item.attachments)
    await removeCover(item.cover)
  }
  await prisma.chart.delete({ where: { id } })
  try { deleteChartMd(id) } catch {}
  revalidatePath('/charts')
}

/* ─── Info ─── */

export async function createInfo(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const info = await prisma.info.create({
      data: {
        infoTime: value(formData, 'infoTime') ? new Date(value(formData, 'infoTime')!) : null,
        title: requiredValue(formData, 'title'),
        category: value(formData, 'category'),
        content: value(formData, 'content'),
        creator: value(formData, 'creator'),
        pinStatus: value(formData, 'pinStatus') || '普通',
        infoSource: value(formData, 'infoSource'),
        urgency: value(formData, 'urgency') || '普通',
        relatedBusiness: value(formData, 'relatedBusiness'),
        viewCount: intValue(formData, 'viewCount') ?? 0,
        likeCount: intValue(formData, 'likeCount') ?? 0,
        shareCount: intValue(formData, 'shareCount') ?? 0,
        purchaseCount: intValue(formData, 'purchaseCount') ?? 0,
        amount: value(formData, 'amount'),
        link: value(formData, 'link'),
        cover: await saveCover(formData),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncInfoMd(info) } catch {}
    revalidatePath('/info')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createInfo]', error)
    return actionError(`保存信息失败: ${msg}`, collectErrors(error))
  }
}

export async function updateInfo(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少信息 ID', { id: '信息 ID 无效' })
  const { errors, valid } = validateForm(formData, { title: required() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)
  try {
    const existing = await prisma.info.findUnique({ where: { id }, select: { cover: true } })
    const info = await prisma.info.update({
      where: { id },
      data: {
        infoTime: value(formData, 'infoTime') ? new Date(value(formData, 'infoTime')!) : null,
        title: requiredValue(formData, 'title'),
        category: value(formData, 'category'),
        content: value(formData, 'content'),
        creator: value(formData, 'creator'),
        pinStatus: value(formData, 'pinStatus') || '普通',
        infoSource: value(formData, 'infoSource'),
        urgency: value(formData, 'urgency') || '普通',
        relatedBusiness: value(formData, 'relatedBusiness'),
        viewCount: intValue(formData, 'viewCount') ?? 0,
        likeCount: intValue(formData, 'likeCount') ?? 0,
        shareCount: intValue(formData, 'shareCount') ?? 0,
        purchaseCount: intValue(formData, 'purchaseCount') ?? 0,
        amount: value(formData, 'amount'),
        link: value(formData, 'link'),
        cover: await saveCover(formData, existing?.cover),
        attachments: await processAttachments(formData, 'attachments'),
        note: value(formData, 'note'),
      },
    })
    try { syncInfoMd(info) } catch {}
    revalidatePath('/info')
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateInfo]', error)
    return actionError(`更新信息失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteInfo(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少信息 ID')
  const item = await prisma.info.findUnique({ where: { id }, select: { attachments: true, cover: true } })
  if (item) {
    await deleteAllAttachments(item.attachments)
    await removeCover(item.cover)
  }
  await prisma.info.delete({ where: { id } })
  try { deleteInfoMd(id) } catch {}
  revalidatePath('/info')
}
