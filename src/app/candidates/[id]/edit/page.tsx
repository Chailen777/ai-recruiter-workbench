import { notFound } from 'next/navigation'

import { ActionButton, DetailPanel } from '@/components/ui'
import { CandidateForm } from '@/components/forms'
import { prisma } from '@/lib/prisma'

export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const candidate = await prisma.candidate.findUnique({ where: { id: Number(id) } })
  if (!candidate) notFound()

  return (
    <DetailPanel
      actions={
        <ActionButton href="/candidates" variant="secondary">
          返回人才库
        </ActionButton>
      }
      description="编辑候选人结构化资料和当前工作流状态。"
      title="编辑候选人"
    >
      <CandidateForm candidate={candidate} redirectTo="/candidates" />
    </DetailPanel>
  )
}
