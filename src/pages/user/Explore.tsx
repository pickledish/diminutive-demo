import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import type { AppListing, Category } from '@/types'
import { useDemo } from '@/store'
import { CATEGORIES } from '@/data/constants'
import { bg } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { AppCard } from '@/components/AppCard'
import { AppMock } from '@/components/AppMock'
import { AppIcon } from '@/components/ui/identity'
import { EmptyState, Input, LinkButton, PageHeader, Segmented, Sticker } from '@/components/ui/primitives'

type Sort = 'popular' | 'new' | 'rating'

function Shelf({ title, subtitle, apps }: { title: string; subtitle?: string; apps: AppListing[] }) {
  if (!apps.length) return null
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1 text-ink/65">{subtitle}</p>}
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {apps.map((a) => (
          <AppCard key={a.id} app={a} />
        ))}
      </div>
    </section>
  )
}

function Spotlight({ app }: { app: AppListing }) {
  const dev = useDemo((s) => s.developers[app.developerId])
  return (
    <div className={cn('brut relative mb-12 grid overflow-hidden rounded-[28px] md:grid-cols-[1.2fr_1fr]', bg[app.color])}>
      <div className="p-7 sm:p-10">
        <Sticker tone="white" rotate={-3} className="mb-4 px-3 py-1 text-sm">
          ⭐ App of the week
        </Sticker>
        <div className="flex items-center gap-4">
          <AppIcon app={app} size="lg" color="white" className="bg-white" />
          <div>
            <h2 className="text-4xl leading-none font-extrabold sm:text-5xl">{app.name}</h2>
            <div className="mt-1 font-bold text-ink/70">by {dev?.name}</div>
          </div>
        </div>
        <p className="mt-5 max-w-lg text-xl leading-snug font-medium">{app.tagline}</p>
        <p className="mt-3 max-w-lg text-ink/75">{app.description.split('\n\n')[0]}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton to={`/apps/${app.id}`} size="lg" variant="dark">
            Take a look
          </LinkButton>
        </div>
      </div>
      <div className="relative hidden items-center justify-center p-8 md:flex">
        <AppMock app={app} className="w-72 rotate-3 shadow-brut-lg" />
      </div>
    </div>
  )
}

export function Explore() {
  const apps = useDemo((s) => s.apps)
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = (params.get('cat') as Category | null) ?? null
  const sort = (params.get('sort') as Sort | null) ?? 'popular'
  const sealed = params.get('sealed') === '1'
  const shared = params.get('shared') === '1'

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const published = useMemo(() => Object.values(apps).filter((a) => a.published), [apps])
  const filtering = !!(q || cat || sealed || shared || params.get('sort'))

  const results = useMemo(() => {
    const needle = q.toLowerCase().trim()
    const list = published.filter(
      (a) =>
        (!cat || a.category === cat) &&
        (!sealed || a.network.length === 0) &&
        (!shared || a.supportsSpaces) &&
        (!needle || [a.name, a.tagline, a.description, ...a.tags].some((s) => s.toLowerCase().includes(needle))),
    )
    return list.sort((a, b) =>
      sort === 'new' ? b.createdAt.localeCompare(a.createdAt) : sort === 'rating' ? b.rating - a.rating || b.ratingCount - a.ratingCount : b.installs - a.installs,
    )
  }, [published, q, cat, sealed, shared, sort])

  const byCat = (cats: Category[]) =>
    published
      .filter((a) => cats.includes(a.category))
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 4)

  return (
    <div>
      <PageHeader emoji="🔭" title="Explore" subtitle="Apps made by people, for their people. Every one of them keeps your data in your cubby." />

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-64 flex-1">
            <Search size={20} strokeWidth={2.5} className="absolute top-1/2 left-4 -translate-y-1/2 text-ink/50" />
            <Input className="h-13 pl-12 text-lg shadow-brut-sm" placeholder="Search apps… try “grocery”, “trip” or “dnd”" value={q} onChange={(e) => update({ q: e.target.value })} />
          </div>
          <Segmented
            value={sort}
            onChange={(v) => update({ sort: v === 'popular' ? null : v })}
            className="h-13 items-center"
            options={[
              { value: 'popular', label: '🔥 Popular' },
              { value: 'new', label: '🌱 Newest' },
              { value: 'rating', label: '⭐ Top rated' },
            ]}
          />
        </div>
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
          <button
            onClick={() => update({ cat: null })}
            className={cn('shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-bold transition-all', !cat ? 'bg-ink text-paper' : 'bg-white hover:bg-sun')}
          >
            ✨ Everything
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ cat: cat === c.id ? null : c.id })}
              className={cn('shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-bold transition-all', cat === c.id ? 'bg-ink text-paper' : 'bg-white hover:bg-sun')}
            >
              {c.emoji} {c.label}
            </button>
          ))}
          <span className="mx-1 w-[2px] shrink-0 bg-ink/15" />
          <button
            onClick={() => update({ sealed: sealed ? null : '1' })}
            className={cn('shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-bold', sealed ? 'bg-mint' : 'bg-white hover:bg-mint/40')}
            title="Apps that can't talk to the internet"
          >
            🔒 Sealed only
          </button>
          <button
            onClick={() => update({ shared: shared ? null : '1' })}
            className={cn('shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-bold', shared ? 'bg-bubblegum' : 'bg-white hover:bg-bubblegum/40')}
          >
            👥 Shareable
          </button>
        </div>
      </div>

      {filtering ? (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">
              {results.length} app{results.length === 1 ? '' : 's'}
              {cat && ` in ${CATEGORIES.find((c) => c.id === cat)?.label}`}
            </h2>
            <button onClick={() => setParams({}, { replace: true })} className="text-sm font-bold underline">
              Clear filters
            </button>
          </div>
          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((a) => (
                <AppCard key={a.id} app={a} />
              ))}
            </div>
          ) : (
            <EmptyState emoji="🕳️" title="No apps match… yet" action={<LinkButton to="/workshop/new" variant="grape">🛠️ Build it yourself</LinkButton>}>
              Nobody’s made that one. Maybe you should? With an AI agent and the Cubby SDK, it’s an afternoon project.
            </EmptyState>
          )}
        </section>
      ) : (
        <>
          {apps['gift-ninja'] && <Spotlight app={apps['gift-ninja']} />}
          <Shelf title="⭐ Staff picks" subtitle="Small, delightful, and very good with your data." apps={published.filter((a) => a.staffPick).slice(0, 4)} />
          <Shelf title="🌱 Fresh out of the oven" subtitle="New this month." apps={[...published].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)} />
          <Shelf title="🏠 For the household" apps={byCat(['household', 'family'])} />
          <Shelf title="🍕 For your crew" apps={byCat(['friends', 'games'])} />
          <Shelf title="💼 For small teams & clubs" apps={byCat(['work'])} />
          <div className="brut mt-4 flex flex-col items-center gap-4 rounded-2xl bg-grape/50 p-8 text-center sm:flex-row sm:text-left">
            <div className="text-5xl">🛠️</div>
            <div className="flex-1">
              <div className="font-display text-2xl font-extrabold">Can’t find the app you want?</div>
              <div className="text-ink/75">Most apps here started as “I wish there was an app for my family that…”. Build yours in the Workshop.</div>
            </div>
            <Link to="/workshop/new" className="shrink-0">
              <span className="brut-sm press inline-flex h-12 items-center rounded-xl bg-sun px-5 font-bold">Start building</span>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
