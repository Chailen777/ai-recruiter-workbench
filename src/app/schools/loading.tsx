import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function SchoolsLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
