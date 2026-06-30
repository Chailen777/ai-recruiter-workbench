import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function InfoLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
