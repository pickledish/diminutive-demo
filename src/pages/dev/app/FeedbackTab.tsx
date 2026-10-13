import { useState } from 'react'
import type { BugReport, Review } from '@/types'
import { useDemo } from '@/store'
import { money, timeAgo } from '@/lib/utils'
import { Badge, Button, Callout, Card, CardHeader, EmptyState, Segmented, Stars, Textarea } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

function ReviewItem({ appId, r }: { appId: string; r: Review }) {
  const reply = useDemo((s) => s.replyToReview)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg">{r.authorEmoji}</span>
        <span className="font-bold">{r.authorName}</span>
        <Stars value={r.rating} size={12} />
        <span className="text-xs font-bold text-ink/45">
          {timeAgo(r.date)}
          {r.version && ` · v${r.version}`}
        </span>
      </div>
      <p className="mt-1.5 text-[15px]">{r.text}</p>
      {r.reply ? (
        <div className="mt-3 ml-4 rounded-xl border-2 border-ink/20 bg-grape/15 px-3 py-2 text-sm">
          <div className="text-xs font-extrabold text-ink/55">You replied · {timeAgo(r.reply.date)}</div>
          {r.reply.text}
        </div>
      ) : open ? (
        <div className="mt-3 ml-4 flex flex-col gap-2">
          <Textarea autoFocus rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Thanks so much! That’s coming in the next version…" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!text.trim()}
              onClick={() => {
                reply(appId, r.id, text.trim())
                toast({ emoji: '💌', title: 'Reply posted', body: 'It shows under their review on your store page.' })
              }}
            >
              Post reply
            </Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-2 text-sm font-bold underline">
          Reply
        </button>
      )}
    </div>
  )
}

const STATUS = [
  { value: 'new', label: '🆕 New' },
  { value: 'seen', label: '👀 Seen' },
  { value: 'fixed', label: '✅ Fixed' },
] as const

function BugItem({ appId, b }: { appId: string; b: BugReport }) {
  const setStatus = useDemo((s) => s.setBugStatus)
  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink/50">
        {b.status === 'new' && <Badge tone="cherry">new</Badge>}
        <span>{b.from}</span>·<span>v{b.version}</span>·<span>{timeAgo(b.at)}</span>
      </div>
      <p className="text-[15px]">{b.text}</p>
      <Segmented value={b.status} onChange={(v) => setStatus(appId, b.id, v)} options={[...STATUS]} className="self-start" />
    </div>
  )
}

export function FeedbackTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: app.reviews.filter((r) => r.rating === n).length }))
  const maxC = Math.max(1, ...dist.map((d) => d.c))
  const bugs = [...dev.bugReports].sort((a, b) => (a.status === 'fixed' ? 1 : 0) - (b.status === 'fixed' ? 1 : 0) || b.at.localeCompare(a.at))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card>
        <CardHeader title="Reviews" emoji="⭐" subtitle="Public, on your store page. Replies are public too." />
        {app.reviews.length ? (
          <>
            <div className="flex items-center gap-6 border-b-2 border-ink/10 px-5 py-4">
              <div className="text-center">
                <div className="font-display text-5xl font-extrabold">{app.rating.toFixed(1)}</div>
                <Stars value={app.rating} size={14} />
                <div className="text-xs font-bold text-ink/50">{app.ratingCount} ratings</div>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {dist.map((d) => (
                  <div key={d.n} className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-3">{d.n}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
                      <div className="h-full bg-sun" style={{ width: `${(d.c / maxC) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="divide-y-2 divide-ink/10">
              {app.reviews.map((r) => (
                <ReviewItem key={r.id} appId={appId} r={r} />
              ))}
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState emoji="🦗" title="No reviews yet">
              Reviews show up after people have had {app.name} installed for a bit.
            </EmptyState>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Bug reports & ideas" emoji="🐛" subtitle="Private, from the app’s Settings tab." />
          {bugs.length ? (
            <div className="divide-y-2 divide-ink/10">
              {bugs.map((b) => (
                <BugItem key={b.id} appId={appId} b={b} />
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-ink/55">Nothing reported. Either it’s perfect or nobody’s found the button.</div>
          )}
        </Card>
        <Callout emoji="🙈" tone="white">
          Reports only include what people typed, plus the version. Never their data. If you need to see something, ask them to export it and send it to you.
        </Callout>
        <Card className="bg-bubblegum/30 p-5">
          <div className="font-display text-lg font-extrabold">💛 Tips</div>
          <div className="font-display text-4xl font-extrabold">{money(dev.tipsCents)}</div>
          <div className="text-sm text-ink/65">{app.tipJar ? 'All-time, paid out monthly. Cubby takes 0%.' : 'Your tip jar is off. Turn it on in Store listing.'}</div>
        </Card>
      </div>
    </div>
  )
}
