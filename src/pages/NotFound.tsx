import { EmptyState, LinkButton } from '@/components/ui/primitives'

export function NotFound() {
  return (
    <div className="dots flex min-h-[60vh] items-center justify-center p-6">
      <EmptyState emoji="🙈" title="Nothing to see here" action={<LinkButton to="/home">Take me home</LinkButton>} className="bg-white">
        This page wandered off. It happens to the best of us.
      </EmptyState>
    </div>
  )
}
