import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function MatchLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
