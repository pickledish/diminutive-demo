import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { Category, ColorKey, PermissionKey } from '@/types'
import { useDemo } from '@/store'
import { APP_EMOJIS, CATEGORIES, PERMISSIONS } from '@/data/constants'
import { aiPrompt, cliSnippet, sdkSnippet } from '@/data/devContent'
import { COLORS, bg } from '@/lib/colors'
import { celebrate } from '@/lib/fx'
import { cn, slugify } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { AppIcon } from '@/components/ui/identity'
import { Badge, Button, Callout, Card, Input, Label, LinkButton, PageHeader, Select } from '@/components/ui/primitives'
import { EmojiPicker } from '@/components/flows/EmojiPicker'

const OPTIONAL: PermissionKey[] = ['notifications', 'files', 'camera', 'location']

export function NewApp() {
  const create = useDemo((s) => s.createDevApp)
  const devApps = useDemo((s) => s.devApps)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [emoji, setEmoji] = useState('🌮')
  const [color, setColor] = useState<ColorKey>('tangerine')
  const [category, setCategory] = useState<Category>('friends')
  const [spaces, setSpaces] = useState(true)
  const [perms, setPerms] = useState<PermissionKey[]>(['notifications'])
  const [createdId, setCreatedId] = useState<string | null>(null)

  const slug = slugify(name) || 'my-app'
  const steps = ['The basics', 'How it’s used', 'Ready to build']

  const finish = () => {
    const id = create({ name: name.trim(), emoji, color, category, tagline: tagline.trim() || 'A tiny app for my people.', supportsSpaces: spaces, permissions: perms })
    setCreatedId(id)
    setStep(2)
    celebrate('big')
  }

  const created = createdId ? devApps[createdId] : undefined

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader emoji="🐣" title="New app" subtitle="Name it, pick a vibe, and you’ll get everything you (or your AI agent) need to start building." />

      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-full border-[3px] border-ink font-display font-extrabold', i < step ? 'bg-mint' : i === step ? 'bg-sun shadow-brut-xs' : 'bg-white')}>
              {i < step ? <Check size={16} strokeWidth={4} /> : i + 1}
            </div>
            <span className={cn('hidden text-sm font-bold sm:block', i !== step && 'text-ink/50')}>{s}</span>
            {i < steps.length - 1 && <div className="h-[3px] flex-1 rounded-full bg-ink/15" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <Card className="flex flex-col gap-5 p-6">
            <div>
              <Label>What’s it called?</Label>
              <Input autoFocus className="h-12 text-lg" placeholder="Taco Tuesday Tracker" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} />
              <div className="mt-1.5 font-mono text-xs text-ink/50">https://{slug}.cubby.app</div>
            </div>
            <div>
              <Label>One-line pitch</Label>
              <Input placeholder="Vote on the taco spot. Track who owes guac." value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label>Icon</Label>
              <EmojiPicker value={emoji} onChange={setEmoji} options={APP_EMOJIS} />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={cn('size-9 rounded-full border-[3px] border-ink transition-transform', bg[c], color === c ? 'scale-110 shadow-brut-xs' : 'hover:scale-105')} aria-label={c}>
                    {color === c && <Check size={16} strokeWidth={4} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            <div className="text-xs font-extrabold tracking-wider text-ink/50 uppercase">Preview</div>
            <div className="brut rounded-2xl bg-white p-4">
              <div className="flex items-start gap-3">
                <AppIcon emoji={emoji} color={color} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-extrabold">{name || 'Your app'}</div>
                  <div className="text-sm text-ink/60">by you</div>
                </div>
              </div>
              <p className="mt-3 text-[15px] text-ink/80">{tagline || 'A tiny app for my people.'}</p>
            </div>
            <Button size="lg" disabled={!name.trim()} onClick={() => setStep(1)}>
              Next <ArrowRight size={18} strokeWidth={3} />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <Card className="flex flex-col gap-6 p-6">
          <div>
            <Label hint="You can change this later, but it’s good to decide early.">Will people use it together?</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  [true, '👥', 'Shareable', 'Users can make spaces and invite their people. Great for households, trips, clubs and teams.'],
                  [false, '🙋', 'Personal only', 'Each person’s data is just theirs. Great for journals, budgets and habit trackers.'],
                ] as const
              ).map(([v, e, t, d]) => (
                <button key={t} onClick={() => setSpaces(v)} className={cn('flex gap-3 rounded-xl border-2 p-4 text-left', spaces === v ? 'border-ink bg-sun/40 shadow-brut-sm' : 'border-ink/20 bg-white hover:border-ink')}>
                  <span className="text-3xl">{e}</span>
                  <span>
                    <span className="block font-display text-lg font-extrabold">{t}</span>
                    <span className="block text-sm text-ink/65">{d}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label hint="Users see these before installing. Ask for less and people trust you more.">Extra abilities</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPTIONAL.map((p) => {
                const on = perms.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => setPerms((x) => (on ? x.filter((y) => y !== p) : [...x, p]))}
                    className={cn('flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left', on ? 'border-ink bg-mint/40' : 'border-ink/20 bg-white hover:border-ink')}
                  >
                    <span className={cn('flex size-6 items-center justify-center rounded-md border-2 border-ink', on ? 'bg-ink text-paper' : 'bg-white')}>{on && <Check size={14} strokeWidth={4} />}</span>
                    <span className="text-lg">{PERMISSIONS[p].emoji}</span>
                    <span className="font-bold">{PERMISSIONS[p].label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <Callout emoji="🎁" tone="sun">
            <b>Included with every app:</b> login, a database in each user’s cubby, realtime sync, backups, hosting, and migrations. You don’t configure any of it.
          </Callout>
          <div className="flex justify-between">
            <Button variant="white" onClick={() => setStep(0)}>
              <ArrowLeft size={16} strokeWidth={3} /> Back
            </Button>
            <Button size="lg" onClick={finish}>
              Create {name.trim() || 'app'} 🎉
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && created && createdId && (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col items-center gap-3 bg-mint/40 p-8 text-center">
            <AppIcon emoji={emoji} color={color} size="xl" className="animate-wiggle" />
            <h2 className="text-4xl font-extrabold">{name} exists!</h2>
            <p className="max-w-lg text-lg text-ink/75">It’s a draft, so only you can see it. Build it, deploy it, then hit publish when it’s ready for your people.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge>
                App ID <span className="font-mono">{createdId}</span>
              </Badge>
              <Badge>
                Key <span className="font-mono">{created.publishableKey}</span>
              </Badge>
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-extrabold">1. Start a project</h3>
              <CodeBlock lang="sh" code={cliSnippet(createdId)} />
              <h3 className="mt-3 text-xl font-extrabold">2. Use the SDK</h3>
              <CodeBlock code={sdkSnippet(createdId)} title="src/app.js" />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-extrabold">…or hand it to your AI agent 🤖</h3>
              <p className="text-ink/70">Paste this into Cursor, Claude, ChatGPT or whatever you build with. It explains how Cubby apps work, so the robot doesn’t try to spin up a server.</p>
              <CodeBlock lang="text" code={aiPrompt(createdId, name)} title="prompt.md" wrap />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => navigate(`/workshop/${createdId}`)}>
              Go to {name}’s dashboard <ArrowRight size={18} strokeWidth={3} />
            </Button>
            <LinkButton to="/workshop/docs" size="lg" variant="white">
              Read the docs
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  )
}
