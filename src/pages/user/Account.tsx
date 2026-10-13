import { useState } from 'react'
import { Check } from 'lucide-react'
import { useDemo, useMe } from '@/store'
import { ANIMALS, PLANS } from '@/data/constants'
import { celebrate } from '@/lib/fx'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { Avatar } from '@/components/ui/identity'
import { Badge, Button, Card, CardHeader, Input, Label, PageHeader, Sticker } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

export function Account() {
  const me = useMe()
  const plan = useDemo((s) => s.plan)
  const setPlan = useDemo((s) => s.setPlan)
  const update = useDemo((s) => s.updateProfile)
  const reset = useDemo((s) => s.resetDemo)
  const [name, setName] = useState(me.name)
  const [emoji, setEmoji] = useState(me.emoji)
  const [deleting, setDeleting] = useState(false)
  const [sessions, setSessions] = useState([
    { id: 1, device: 'MacBook Air', where: 'Safari · this device', emoji: '💻', current: true },
    { id: 2, device: 'iPhone 16', where: 'Cubby on your home screen · 2h ago', emoji: '📱' },
    { id: 3, device: 'Kitchen iPad', where: 'Chrome · 3 days ago', emoji: '📟' },
  ])

  return (
    <div>
      <PageHeader emoji="⚙️" title="Account & plan" subtitle="Your profile, your plan, and the places you’re signed in." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Profile" emoji="🪪" subtitle="This is what people in your spaces see. Apps get your name and avatar, never your email." />
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-4">
                <Avatar person={{ ...me, emoji, name }} size="lg" className="size-16 text-4xl shadow-brut-sm" />
                <div className="min-w-0 flex-1">
                  <Label>Display name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Avatar</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ANIMALS.slice(0, 24).map((a) => (
                    <button
                      key={a}
                      onClick={() => setEmoji(a)}
                      className={cn('flex size-9 items-center justify-center rounded-full border-2 text-lg', emoji === a ? 'border-ink bg-sun shadow-brut-xs' : 'border-ink/15 bg-white hover:border-ink')}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={me.email} disabled />
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={!name.trim() || (name === me.name && emoji === me.emoji)}
                  onClick={() => {
                    update(name.trim(), emoji)
                    toast({ emoji, title: 'Profile saved', body: 'Everyone in your spaces will see the new you.', tone: 'success' })
                  }}
                >
                  Save profile
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Signed in on" emoji="🔐" />
            <div className="divide-y-2 divide-ink/10">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold">{s.device}</div>
                    <div className="text-xs text-ink/55">{s.where}</div>
                  </div>
                  {s.current ? (
                    <Badge tone="mint">This device</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="white"
                      onClick={() => {
                        setSessions((all) => all.filter((x) => x.id !== s.id))
                        toast({ emoji: '👋', title: `Signed out of ${s.device}` })
                      }}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t-2 border-ink/10 px-5 py-3 text-sm">
              <Badge tone="sun">🔑 Passkey</Badge>
              <Badge tone="white">✉️ Email link</Badge>
              <span className="text-xs text-ink/55">No passwords to forget.</span>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Your plan" emoji="✨" subtitle="Most people never need more than Free." />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {(['free', 'plus'] as const).map((p) => {
                const info = PLANS[p]
                const current = plan === p
                return (
                  <div key={p} className={cn('relative flex flex-col rounded-2xl border-[3px] border-ink p-4', p === 'plus' ? 'bg-sun' : 'bg-white', current && 'shadow-brut')}>
                    {current && (
                      <Sticker tone="mint" rotate={4} className="absolute -top-3 right-3">
                        Current
                      </Sticker>
                    )}
                    <div className="font-display text-xl font-extrabold">{info.name}</div>
                    <div className="font-display text-3xl font-extrabold">
                      ${info.price}
                      <span className="text-sm font-bold text-ink/55">/mo</span>
                    </div>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-sm">
                      {info.perks.map((perk) => (
                        <li key={perk} className="flex gap-1.5">
                          <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    {!current && (
                      <Button
                        className="mt-4"
                        variant={p === 'plus' ? 'dark' : 'white'}
                        onClick={() => {
                          setPlan(p)
                          if (p === 'plus') {
                            celebrate('big')
                            toast({ emoji: '✨', title: 'Welcome to Plus!', body: '25 GB of room and hourly backups. (No real card was charged.)', tone: 'success' })
                          } else toast({ emoji: '👌', title: 'Back on Free', body: 'Your data stays put.' })
                        }}
                      >
                        {p === 'plus' ? 'Upgrade to Plus' : 'Switch to Free'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="border-t-2 border-ink/10 px-5 py-3 text-xs text-ink/60">Part of every Plus subscription goes to the makers of the apps you use most.</p>
          </Card>

          <Card>
            <CardHeader title="Your account" emoji="🧳" />
            <div className="flex flex-col gap-3 p-5">
              <p className="text-sm text-ink/70">Want out? Export everything first from Data & backups, then delete your account. We don’t keep a secret copy.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" onClick={() => setDeleting(true)}>
                  Delete my account
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-sky/30">
            <CardHeader title="Demo controls" emoji="🧪" />
            <div className="p-5">
              <p className="text-sm text-ink/70">Showing this to someone? Reset everything to the starting state first.</p>
              <Button variant="white" className="mt-3" onClick={reset}>
                🧹 Reset demo
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        danger
        emoji="💥"
        title="Delete your whole account?"
        confirmLabel="I understand, delete it"
        onConfirm={() => {
          toast({ emoji: '🛟', title: 'Phew, it’s a demo', body: 'In real life your account and every cubby would be wiped within 24h. Here, nothing happened.' })
        }}
      >
        <p>This would delete every app’s data, every space you own (other members lose access), and every backup. Spaces you’re a guest in stay with their owners.</p>
      </ConfirmModal>
    </div>
  )
}
