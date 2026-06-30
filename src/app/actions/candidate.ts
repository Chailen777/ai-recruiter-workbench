'use server'

import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/form'
import { phone, required, validateForm } from '@/lib/form'
import { prisma } from '@/lib/prisma'
import { processAttachments, deleteAllAttachments, saveAvatar, removeAvatar } from '@/lib/uploads'
import { syncCandidateMd, deleteCandidateMd } from '@/lib/markdown'
import { applyCandidateStatusEffects } from '@/lib/workflow'
import { actionError, actionSuccess, collectErrors, value, intValue, requiredValue } from './shared'

export async function createCandidate(formData: FormData): Promise<ActionResult> {
  const { errors, valid } = validateForm(formData, { name: required(), phone: phone() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  try {
    const candidate = await prisma.candidate.create({
      data: {
        name: requiredValue(formData, 'name'),
        gender: value(formData, 'gender'),
        phone: value(formData, 'phone'),
        currentTitle: value(formData, 'currentTitle'),
        currentCompany: value(formData, 'currentCompany'),
        city: value(formData, 'city'),
        schoolName: value(formData, 'schoolName'),
        schoolType: value(formData, 'schoolType'),
        major: value(formData, 'major'),
        education: value(formData, 'education'),
        age: intValue(formData, 'age'),
        yearsOfWork: intValue(formData, 'yearsOfWork'),
        jobSearchStatus: value(formData, 'jobSearchStatus'),
        desiredPosition: value(formData, 'desiredPosition'),
        expectedSalary: value(formData, 'expectedSalary'),
        skillTags: value(formData, 'skillTags'),
        industryBg: value(formData, 'industryBg'),
        selfIntro: value(formData, 'selfIntro'),
        resumeRaw: value(formData, 'resumeRaw'),
        strengths: value(formData, 'strengths'),
        workExperience: value(formData, 'workExperience'),
        educationDetail: value(formData, 'educationDetail'),
        languages: value(formData, 'languages'),
        certificates: value(formData, 'certificates'),
        projects: value(formData, 'projects'),
        awards: value(formData, 'awards'),
        otherAbilities: value(formData, 'otherAbilities'),
        resumeFile: value(formData, 'resumeFile'),
        link: value(formData, 'link'),
        attachments: await processAttachments(formData, 'attachments'),
        avatar: await saveAvatar(formData),
        communication: requiredValue(formData, 'communication') || '待跟进',
        status: requiredValue(formData, 'status') || '新建',
        tags: value(formData, 'tags'),
        note: value(formData, 'note'),
      },
    })
    try { syncCandidateMd(candidate) } catch {}
    try { revalidatePath('/candidates') } catch {}
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[createCandidate]', error)
    return actionError(`保存候选人失败: ${msg}`, collectErrors(error))
  }
}

export async function updateCandidate(formData: FormData): Promise<ActionResult> {
  const id = Number(formData.get('id'))
  if (!id) return actionError('缺少候选人 ID', { id: '候选人 ID 无效' })

  const { errors, valid } = validateForm(formData, { name: required(), phone: phone() })
  if (!valid) return actionError('请检查表单填写是否正确', errors)

  const status = requiredValue(formData, 'status') || '新建'
  try {
    const existing = await prisma.candidate.findUnique({ where: { id }, select: { avatar: true } })
    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        name: requiredValue(formData, 'name'),
        gender: value(formData, 'gender'),
        phone: value(formData, 'phone'),
        currentTitle: value(formData, 'currentTitle'),
        currentCompany: value(formData, 'currentCompany'),
        city: value(formData, 'city'),
        schoolName: value(formData, 'schoolName'),
        schoolType: value(formData, 'schoolType'),
        major: value(formData, 'major'),
        education: value(formData, 'education'),
        age: intValue(formData, 'age'),
        yearsOfWork: intValue(formData, 'yearsOfWork'),
        jobSearchStatus: value(formData, 'jobSearchStatus'),
        desiredPosition: value(formData, 'desiredPosition'),
        expectedSalary: value(formData, 'expectedSalary'),
        skillTags: value(formData, 'skillTags'),
        industryBg: value(formData, 'industryBg'),
        selfIntro: value(formData, 'selfIntro'),
        resumeRaw: value(formData, 'resumeRaw'),
        strengths: value(formData, 'strengths'),
        workExperience: value(formData, 'workExperience'),
        educationDetail: value(formData, 'educationDetail'),
        languages: value(formData, 'languages'),
        certificates: value(formData, 'certificates'),
        projects: value(formData, 'projects'),
        awards: value(formData, 'awards'),
        otherAbilities: value(formData, 'otherAbilities'),
        resumeFile: value(formData, 'resumeFile'),
        link: value(formData, 'link'),
        attachments: await processAttachments(formData, 'attachments'),
        avatar: await saveAvatar(formData, existing?.avatar),
        communication: requiredValue(formData, 'communication') || '待跟进',
        status,
        tags: value(formData, 'tags'),
        note: value(formData, 'note'),
      },
    })
    try { syncCandidateMd(candidate) } catch {}
    await applyCandidateStatusEffects(prisma, id, status)
    try { revalidatePath('/candidates') } catch {}
    try { revalidatePath('/match') } catch {}
    try { revalidatePath('/home') } catch {}
    return actionSuccess()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[updateCandidate]', error)
    return actionError(`更新候选人失败: ${msg}`, collectErrors(error))
  }
}

export async function deleteCandidate(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  if (!id) throw new Error('缺少候选人 ID')
  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { attachments: true, avatar: true } })
  // 先删文件，再删 DB
  if (candidate) {
    await deleteAllAttachments(candidate.attachments)
    await removeAvatar(candidate.avatar)
  }
  await prisma.candidate.delete({ where: { id } })
  try { deleteCandidateMd(id) } catch {}
  try { revalidatePath('/candidates') } catch {}
}
