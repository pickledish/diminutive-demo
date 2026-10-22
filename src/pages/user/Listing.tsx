import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Share2, Star } from 'lucide-react'
import type { AppListing, MockKind } from '@/types'
import { useDemo } from '@/store'
import { categoryEmoji, categoryLabel } from '@/data/constants'
import { bg, bgSoft } from '@/lib/colors'
import { cn, compact, copyText, formatDate, formatKb, timeAgo } from '@/lib/utils'
import { AppMock } from '@/components/AppMock'
import { AppRow } from '@/components/AppCard'
import { SealedBadge } from '@/components/Badges'
import { InstallButton, PermissionList } from '@/components/flows/InstallFlow'
import { TipModal } from '@/components/flows/TipModal'
import { UpdateReviewModal } from '@/components/flows/UpdateReview'
import { AppIcon, Avatar } from '@/components/ui/identity'
import { Badge, Button, Callout, Card, CardHeader, Stars, Sticker, Textarea } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'
import { NotFound } from '../NotFound'

const OTHER_KINDS: MockKind[] = ['list', 'grid', 'board', 'chart', 'journal']
const CAPTIONS: Record<MockKind, string> = {
  list: 'Check things off together',
  grid: 'Everything at a glance',
  board: 'Organize it your way',
  chart: 'See how it’s going',
  journal: 'A little history of you',
}

function SchemaPreview({ app }: { app: AppListing }) {
  if (!app.schema.length) return <p className="text-sm text-ink/60">This app hasn’t defined any tables yet.</p>
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {app.schema.map((t) => (
        <div key={t.name} className="rounded-xl border-2 border-ink bg-white">
          <div className={cn('flex items-center justify-between gap-2 rounded-t-[10px] border-b-2 border-ink px-3 py-2', bgSoft[app.color])}>
            <span className="font-mono text-sm font-extrabold">{t.name}</span>
            <span className="truncate text-xs text-ink/60">{t.description}</span>
          </div>
          <div className="flex flex-wrap gap-1 p-2.5">
            {t.columns
              .filter((c) => !c.pk)
              .map((c) => (
                <span key={c.name} className="rounded-md border-[1.5px] border-ink/25 bg-paper px-1.5 py-0.5 font-mono text-[11px]">
                  {c.name}
                  <span className="text-ink/40"> {c.type === 'user' ? 'person' : c.type}</span>
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Reviews({ app }: { app: AppListing }) {
  const installed = useDemo((s) => !!s.installs[app.id])
  const addReview = useDemo((s) => s.addReview)
  const mine = app.reviews.find((r) => r.mine)
  const [rating, setRating] = useState(mine?.rating ?? 5)
  const [text, setText] = useState('')
  const [hover, setHover] = useState(0)
  const dist = [5, 4, 3, 2, 1].map((n) => {
    const d = Math.abs(app.rating - n)
    return { n, pct: app.ratingCount ? Math.max(1, Math.round((n === 5 ? 70 : 40) * Math.exp(-d * 1.4))) : 0 }
  })
  const total = dist.reduce((a, b) => a + b.pct, 0) || 1

  return (
    <Card>
      <CardHeader title="Reviews" emoji="💬" subtitle={app.ratingCount ? `${app.ratingCount.toLocaleString()} ratings` : 'No ratings yet'} />
      <div className="p-5">
        {app.ratingCount > 0 && (
          <div className="mb-6 flex items-center gap-6">
            <div className="text-center">
              <div className="font-display text-5xl font-extrabold">{app.rating.toFixed(1)}</div>
              <Stars value={app.rating} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-3">{d.n}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <div className="h-full bg-sun" style={{ width: `${(d.pct / total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {installed && (
          <form
            className="mb-6 rounded-xl border-2 border-ink bg-sun/25 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              addReview(app.id, rating, text.trim())
              setText('')
              toast({ emoji: '💬', title: 'Review posted', body: 'Only your first name and avatar are shown.', tone: 'success' })
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold">{mine ? 'Update your review' : 'You use this app. How is it?'}</span>
              <div className="flex" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} aria-label={`${i} stars`}>
                    <Star size={22} strokeWidth={2.5} className={i <= (hover || rating) ? 'fill-sun' : 'fill-white text-ink/30'} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea rows={2} placeholder="Say something nice (or honest)…" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={!text.trim()}>
                Post review
              </Button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-5">
          {app.reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white text-lg">{r.authorEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{r.authorName}</span>
                  {r.mine && <Badge tone="sun">You</Badge>}
                  <Stars value={r.rating} size={12} />
                  <span className="text-xs font-bold text-ink/45">{timeAgo(r.date)}</span>
                </div>
                <p className="mt-1 leading-snug">{r.text}</p>
                {r.reply && (
                  <div className="mt-2 rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 text-sm">
                    <span className="font-bold">Maker replied:</span> {r.reply.text}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!app.reviews.length && <p className="text-sm text-ink/60">Be the first to say something nice.</p>}
        </div>
      </div>
    </Card>
  )
}

export function Listing() {
  const { appId = '' } = useParams()
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => (app ? s.developers[app.developerId] : undefined))
  const apps = useDemo((s) => s.apps)
  const pending = useDemo((s) => s.pendingUpdates[appId])
  const installed = useDemo((s) => !!s.installs[appId])
  const [tipOpen, setTipOpen] = useState(false)
  const [updOpen, setUpdOpen] = useState(false)

  if (!app) return <NotFound />
  const kinds = [app.mock, ...OTHER_KINDS.filter((k) => k !== app.mock)].slice(0, 3)
  const more = Object.values(apps).filter((a) => a.developerId === app.developerId && a.id !== app.id && a.published)
  const paragraphs = app.description.split('\n\n')

  return (
    <div>
      <Link to="/explore" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink">
        <ArrowLeft size={16} strokeWidth={3} /> Explore
      </Link>

      <div className={cn('brut relative mb-8 overflow-hidden rounded-[28px]', bg[app.color])}>
        <div className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center">
          <AppIcon app={app} size="xl" color="white" className="bg-white" />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-2">
              {app.staffPick && (
                <Sticker tone="pink" rotate={-2}>
                  ★ Staff pick
                </Sticker>
              )}
              {!app.published && (
                <Sticker tone="white" rotate={-2}>
                  Draft: only you can see this
                </Sticker>
              )}
            </div>
            <h1 className="text-5xl leading-none font-extrabold sm:text-6xl">{app.name}</h1>
            <p className="mt-2 max-w-2xl text-xl leading-snug font-medium">{app.tagline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold">
              {dev && (
                <Link to={`/makers/${dev.handle}`} className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white py-0.5 pr-3 pl-0.5 hover:bg-sun">
                  <Avatar person={dev} size="xs" /> {dev.name}
                </Link>
              )}
              {app.ratingCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Stars value={app.rating} /> {app.rating.toFixed(1)} <span className="text-ink/60">({compact(app.ratingCount)})</span>
                </span>
              )}
              <span>{compact(app.installs)} installs</span>
              <span>
                {categoryEmoji(app.category)} {categoryLabel(app.category)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
            <InstallButton app={app} />
            <div className="flex gap-2">
              {app.tipJar && app.published && (
                <Button variant="white" size="sm" onClick={() => setTipOpen(true)}>
                  💛 Tip the maker
                </Button>
              )}
              <Button
                variant="white"
                size="sm"
                onClick={() => {
                  copyText(`https://cubby.app/apps/${app.id}`)
                  toast({ emoji: '🔗', title: 'Link copied', body: 'Send it to your people.' })
                }}
              >
                <Share2 size={14} strokeWidth={2.5} /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {installed && pending && (
        <Callout
          emoji="⬆️"
          tone="sun"
          className="mb-8 border-[3px] shadow-brut-sm"
          action={
            <Button size="sm" variant="dark" onClick={() => setUpdOpen(true)}>
              Review update
            </Button>
          }
        >
          <b>Version {pending.toVersion} is ready.</b> {pending.dataSummary.length ? 'It changes your data, so it’s waiting for your OK.' : pending.notes}
        </Callout>
      )}

      <div className="scrollbar-none -mx-4 mb-10 flex gap-6 overflow-x-auto px-4 pt-1 pb-3">
        {kinds.map((k, i) => (
          <AppMock key={k} app={app} kind={k} caption={CAPTIONS[k]} className={cn('w-72 shrink-0 shadow-brut', i % 2 ? 'rotate-1' : '-rotate-1')} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <Card className="p-6">
            <h2 className="mb-3 text-2xl font-extrabold">About</h2>
            <div className="flex flex-col gap-3 text-[17px] leading-relaxed text-ink/85">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {app.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {app.tags.map((t) => (
                  <Link key={t} to={`/explore?q=${encodeURIComponent(t)}`} className="rounded-full border-2 border-ink/20 bg-paper px-2.5 py-0.5 text-xs font-bold hover:border-ink">
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="What it keeps in your cubby" emoji="🗄️" subtitle="The exact shape of the data this app stores. You can browse every row once it’s installed." />
            <div className="p-5">
              <SchemaPreview app={app} />
            </div>
          </Card>

          {app.changelog.length > 0 && (
            <Card>
              <CardHeader title="What’s new" emoji="📰" />
              <div className="flex flex-col divide-y-2 divide-ink/10 px-5">
                {app.changelog.slice(0, 5).map((c) => (
                  <div key={c.version} className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold">v{c.version}</span>
                      <span className="text-xs font-bold text-ink/50">{formatDate(c.date)}</span>
                      {c.dataSummary && <Badge tone="grape">🧬 changed data</Badge>}
                    </div>
                    <p className="mt-1">{c.notes}</p>
                    {c.dataSummary && (
                      <ul className="mt-2 flex flex-col gap-1 border-l-[3px] border-grape pl-3 text-sm text-ink/75">
                        {c.dataSummary.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Reviews app={app} />
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="What it can do" emoji="🔑" />
            <div className="p-5">
              <PermissionList app={app} />
            </div>
          </Card>

          <Card className="bg-mint/40">
            <div className="p-5">
              <div className="text-3xl">🙈</div>
              <h3 className="mt-2 text-xl font-extrabold">{dev?.name.split(' ')[0]} can’t see your data</h3>
              <p className="mt-1 text-sm text-ink/75">Here’s everything the maker ever learns about you:</p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {['That someone installed it (an anonymous count)', 'Which version you’re running', 'Crash reports, only if you say yes', 'Reviews and bug reports you choose to send'].map((x) => (
                  <li key={x} className="flex gap-2">
                    <span>•</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader title="Details" emoji="📋" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 p-5 text-sm">
              <dt className="font-bold text-ink/55">Version</dt>
              <dd className="font-mono font-bold">{app.version}</dd>
              <dt className="font-bold text-ink/55">Updated</dt>
              <dd className="font-bold">{timeAgo(app.updatedAt)}</dd>
              <dt className="font-bold text-ink/55">Size</dt>
              <dd className="font-bold">{formatKb(app.sizeKb)}</dd>
              <dt className="font-bold text-ink/55">Internet</dt>
              <dd>
                <SealedBadge app={app} long />
              </dd>
              <dt className="font-bold text-ink/55">Listed</dt>
              <dd className="font-bold">{formatDate(app.createdAt)}</dd>
            </dl>
          </Card>

          {more.length > 0 && (
            <Card>
              <CardHeader title={`More from ${dev?.name}`} emoji={dev?.emoji} />
              <div className="p-2">
                {more.map((a) => (
                  <AppRow key={a.id} app={a} />
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>

      <TipModal app={app} open={tipOpen} onClose={() => setTipOpen(false)} />
      <UpdateReviewModal appId={app.id} open={updOpen} onClose={() => setUpdOpen(false)} />
    </div>
  )
}
