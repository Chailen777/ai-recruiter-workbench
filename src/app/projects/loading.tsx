import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function ProjectsLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
