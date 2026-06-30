import { notFound } from 'next/navigation'

import { ActionButton, DetailPanel } from '@/components/ui'
import { CompanyForm } from '@/components/forms'
import { prisma } from '@/lib/prisma'

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await prisma.company.findUnique({ where: { id: Number(id) } })
  if (!company) notFound()

  return (
    <DetailPanel
      actions={
        <ActionButton href="/companies" variant="secondary">
          返回企业库
        </ActionButton>
      }
      description="修改企业基础信息、城市覆盖范围和合作状态。"
      title="编辑企业"
    >
      <CompanyForm company={company} redirectTo="/companies" />
    </DetailPanel>
  )
}
