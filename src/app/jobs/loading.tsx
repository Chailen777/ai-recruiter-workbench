import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function JobsLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
