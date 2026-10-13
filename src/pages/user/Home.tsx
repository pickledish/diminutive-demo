import { Link } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useDemo, useMe } from '@/store'
import { plural } from '@/lib/utils'
import { InstalledTile } from '@/components/InstalledTile'
import { AppRow } from '@/components/AppCard'
import { LinkButton } from '@/components/ui/primitives'

export function Home() {
  const me = useMe()
  const installs = useDemo((s) => s.installs)
  const apps = useDemo((s) => s.apps)

  const list = Object.values(installs).sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))
  const suggestions = Object.values(apps)
    .filter((a) => a.published && !installs[a.id])
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 4)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Hey there' : 'Good evening'

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            {greeting}, {me.name.split(' ')[0]} <span className="inline-block animate-wiggle">👋</span>
          </h1>
          <p className="mt-2 text-lg text-ink/70">{plural(list.length, 'app')} on your shelf</p>
        </div>
        <LinkButton to="/explore" variant="white">
          Find more apps <ArrowRight size={16} strokeWidth={3} />
        </LinkButton>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-extrabold">Your shelf</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((i) => (
            <InstalledTile key={i.appId} install={i} />
          ))}
          <Link
            to="/explore"
            className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-ink/35 text-ink/55 transition-colors hover:border-ink hover:bg-white hover:text-ink"
          >
            <span className="flex size-12 items-center justify-center rounded-full border-[3px] border-current">
              <Plus size={24} strokeWidth={3} />
            </span>
            <span className="font-display text-lg font-extrabold">Add an app</span>
          </Link>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-2xl font-extrabold">Your people also use</h2>
            <div className="grid gap-1 rounded-2xl border-[3px] border-ink bg-paper p-2 sm:grid-cols-2">
              {suggestions.map((a) => (
                <AppRow key={a.id} app={a} right={<span className="text-xs font-bold text-ink/50">View →</span>} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
