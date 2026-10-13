import { useMemo, useState } from 'react'
import type { ActivityKind } from '@/types'
import { useDemo } from '@/store'
import { ActivityList } from '@/components/ActivityList'
import { Callout, Card, EmptyState, Segmented } from '@/components/ui/primitives'

type Filter = 'all' | 'access' | 'sharing' | 'changes'

const FILTERS: Record<Filter, ActivityKind[] | null> = {
  all: null,
  access: ['read', 'write', 'export'],
  sharing: ['sharing'],
  changes: ['update', 'schema', 'backup', 'install'],
}

export function ActivityTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const activity = useDemo((s) => s.activity)
  const [filter, setFilter] = useState<Filter>('all')
  const events = useMemo(() => {
    const kinds = FILTERS[filter]
    return activity.filter((e) => e.appId === appId && (!kinds || kinds.includes(e.kind)))
  }, [activity, appId, filter])

  return (
    <div className="flex flex-col gap-5">
      <Callout emoji="📜" tone="white">
        Cubby logs every time {app.name} reads or changes your data, and every change to who can see it. This log is yours too: the maker can’t see it.
      </Callout>
      <Segmented
        value={filter}
        onChange={setFilter}
        className="self-start"
        options={[
          { value: 'all', label: 'Everything' },
          { value: 'access', label: '👀 Reads & writes' },
          { value: 'sharing', label: '👥 Sharing' },
          { value: 'changes', label: '⬆️ Updates & backups' },
        ]}
      />
      <Card className="px-5 py-2">
        {events.length ? <ActivityList events={events} showApp={false} /> : <EmptyState emoji="🌙" title="Quiet so far" className="my-4" />}
      </Card>
    </div>
  )
}
