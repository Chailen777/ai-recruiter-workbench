import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function KnowledgeLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
