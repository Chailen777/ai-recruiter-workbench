import { notFound } from 'next/navigation'

import { ActionButton, DetailPanel } from '@/components/ui'
import { JobForm } from '@/components/forms'
import { prisma } from '@/lib/prisma'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id: Number(id) } })
  if (!job) notFound()

  return (
    <DetailPanel
      actions={
        <ActionButton href="/jobs" variant="secondary">
          返回岗位库
        </ActionButton>
      }
      description="编辑岗位结构化要求和当前招聘状态。"
      title="编辑岗位"
    >
      <JobForm
        job={job}
        redirectTo="/jobs"
      />
    </DetailPanel>
  )
}
