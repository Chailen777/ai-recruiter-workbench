import { PageSkeletonShell, CardListSkeleton } from '@/components/ui/Skeleton'

export default function ContactsLoading() {
  return (
    <PageSkeletonShell>
      <CardListSkeleton count={6} />
    </PageSkeletonShell>
  )
}
