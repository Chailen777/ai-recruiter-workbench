import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function CandidatesLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
