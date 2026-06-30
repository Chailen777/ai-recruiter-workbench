import { PageSkeletonShell, ListSkeleton } from '@/components/ui/Skeleton'

export default function CompaniesLoading() {
  return (
    <PageSkeletonShell>
      <ListSkeleton rows={8} />
    </PageSkeletonShell>
  )
}
