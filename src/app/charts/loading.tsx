import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function ChartsLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
