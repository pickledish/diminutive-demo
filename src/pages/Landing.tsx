import { Link } from 'react-router'
import { ArrowRight, Check, X } from 'lucide-react'
import { useDemo } from '@/store'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { AppIcon, Avatar, Logo } from '@/components/ui/identity'
import { Badge, LinkButton, Sticker } from '@/components/ui/primitives'
import { AppCard } from '@/components/AppCard'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { PLANS } from '@/data/constants'
import { cn } from '@/lib/utils'

const SDK_SNIPPET = `import { cubby } from '@cubby/sdk'

// Login? Done. Cubby handles it.
const me = await cubby.auth.user()

// Reads & writes go to the user's cubby,
// scoped to whatever space they're in.
await cubby.db.from('items').insert({ name: 'Oat milk', qty: 2 })
const { data } = await cubby.db.from('items').select('*').eq('done', false)

// Sharing is built in.
const space = await cubby.spaces.current()
cubby.db.from('items').subscribe((change) => render(change))`

function CubbyShelf() {
  const apps = useDemo((s) => s.apps)
  const people = useDemo((s) => s.people)
  const shelf = ['grocery-goblin', 'habit-hatch', 'dragon-notes', 'splitsies', 'plant-pal', 'book-nook'].map((id) => apps[id]).filter(Boolean)
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="brut rotate-1 rounded-[28px] bg-tangerine p-4" style={{ boxShadow: '10px 10px 0 0 #141414' }}>
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Avatar person={people.usr_robin} size="sm" />
            <span className="font-display text-lg font-extrabold">Robin’s cubby</span>
          </div>
          <Badge tone="white">🔒 only Robin has the key</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl border-[3px] border-ink bg-ink p-3">
          {shelf.map((app, i) => (
            <div key={app.id} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-[3px] border-ink bg-paper">
              <AppIcon app={app} size="md" className={cn(i % 2 ? 'rotate-3' : '-rotate-3')} />
              <span className="max-w-full truncate px-1 text-[11px] font-extrabold">{app.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -top-6 -left-6 animate-float [--r:-8deg]">
        <Sticker tone="mint" rotate={-8} className="px-3 py-1 text-sm">
          👥 shared with 3
        </Sticker>
      </div>
      <div className="absolute -right-4 -bottom-6 animate-float [--r:6deg] [animation-delay:1.2s]">
        <Sticker tone="pink" rotate={6} className="px-3 py-1 text-sm">
          🙈 dev can’t peek
        </Sticker>
      </div>
      <div className="absolute top-1/2 -right-10 hidden animate-float [--r:10deg] [animation-delay:2s] sm:block">
        <Sticker tone="sky" rotate={10} className="px-3 py-1 text-sm">
          💾 backed up 3h ago
        </Sticker>
      </div>
    </div>
  )
}

function Marquee() {
  const words = ['YOUR DATA', 'YOUR APPS', 'YOUR PEOPLE', 'NO SERVERS', 'NO ADS', 'NO SNOOPING', 'BACKUPS INCLUDED', 'MADE WITH LOVE (AND AI)']
  const row = [...words, ...words]
  return (
    <div className="overflow-hidden border-y-[3px] border-ink bg-ink py-3 text-sun">
      <div className="flex w-max animate-marquee gap-8 font-display text-xl font-extrabold whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8">
            {w} <span className="text-bubblegum">★</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Flow({ steps, tone }: { steps: { emoji: string; label: string; sub?: string }[]; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-1 items-center gap-1">
          <div className={cn('flex flex-1 flex-col items-center rounded-xl border-2 border-ink px-1 py-2 text-center', i === steps.length - 1 ? tone : 'bg-white')}>
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-xs leading-tight font-extrabold">{s.label}</span>
            {s.sub && <span className="text-[10px] leading-tight text-ink/60">{s.sub}</span>}
          </div>
          {i < steps.length - 1 && <ArrowRight size={18} strokeWidth={3} className="shrink-0" />}
        </div>
      ))}
    </div>
  )
}

const FAQ = [
  [
    'Can the people who make the apps see my data?',
    'No. App makers ship code; they never get a database to look into. They can see that their app was installed (anonymous counts), and anything you choose to send them, like a review or bug report. That’s it.',
  ],
  [
    'Can Cubby see my data?',
    'Honest answer: we store it, so technically our systems can reach it. It’s encrypted at rest, every access is logged, we never sell or mine it, and our staff can’t browse it without you asking for help. If you’d rather it not be here, export it and delete it. It’s gone.',
  ],
  [
    'What happens if a maker abandons their app?',
    'It keeps working. The app is a static bundle we host, and your data sits in your cubby, not on their server, so there’s nothing for them to turn off. You can export your data at any time.',
  ],
  [
    'How does sharing work?',
    'Inside any shareable app, you can make a space (“Park House”, “Lake Trip”, “Book Club”) and invite people as editors or viewers. Whoever made the space owns its data: they control members, backups and deletion. You can hand ownership to someone else anytime.',
  ],
  [
    'What happens when an app updates?',
    'Most updates just make the app better, and they install quietly. If an update needs to change the shape of your data, Cubby shows you what’s changing in plain words, backs everything up first, and rolls back automatically if anything goes wrong.',
  ],
  [
    'I’m a maker. What can I build?',
    'Any web app that runs in the browser: React, Svelte, plain HTML, whatever your AI agent spits out. Our SDK gives you login, a database, sharing and realtime. We host your static files and broker your database migrations across every install.',
  ],
]

export function Landing() {
  const apps = useDemo((s) => s.apps)
  const featured = ['grocery-goblin', 'gift-ninja', 'splitsies', 'habit-hatch', 'recipe-tin', 'dragon-notes'].map((id) => apps[id]).filter(Boolean)
  const appCount = Object.values(apps).filter((a) => a.published).length

  return (
    <div className="dots min-h-screen">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-bold text-ink/70 md:flex">
            <a href="#how" className="hover:text-ink">
              How it works
            </a>
            <a href="#makers" className="hover:text-ink">
              For makers
            </a>
            <a href="#pricing" className="hover:text-ink">
              Pricing
            </a>
            <a href="#faq" className="hover:text-ink">
              FAQ
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LinkButton to="/explore" variant="white" size="sm" className="hidden sm:inline-flex">
              Browse apps
            </LinkButton>
            <LinkButton to="/home" size="sm">
              Open the demo <ArrowRight size={16} strokeWidth={3} />
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-14 pb-20 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
        <div>
          <Sticker tone="lime" rotate={-2} className="mb-5 px-3 py-1 text-sm">
            ✨ tiny apps, big feelings
          </Sticker>
          <h1 className="text-6xl leading-[0.95] font-extrabold sm:text-7xl lg:text-8xl">
            Tiny apps for{' '}
            <span className="relative inline-block">
              <span className="absolute inset-x-[-6px] bottom-1 h-[42%] -rotate-1 rounded-md bg-sun" />
              <span className="relative">your people.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink/80">
            Install little apps made by friends, families and indie makers, from grocery lists to D&D notes. Everything you put in them lives in{' '}
            <b className="text-ink">your cubby</b>, not the developer’s database.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/home" size="lg">
              🏠 Look around as a user
            </LinkButton>
            <LinkButton to="/workshop" size="lg" variant="grape">
              🛠️ Look around as a maker
            </LinkButton>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ink/65">
            <span>🚫 No ads</span>
            <span>🙈 Makers can’t see your stuff</span>
            <span>📦 Export everything, anytime</span>
          </div>
        </div>
        <CubbyShelf />
      </section>

      <Marquee />

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <h2 className="text-center text-4xl font-extrabold sm:text-5xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-lg text-ink/70">Like an app store, but the apps move into your place instead of you moving into theirs.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ['1', 'bg-sky', '🔍', 'Find an app', `Browse ${appCount}+ apps people built for their own families, clubs and teams, and then shared with everyone.`],
            ['2', 'bg-sun', '📦', 'Install it into your cubby', 'Each app gets its own little cubby hole. Anything it saves stays right there, with you.'],
            ['3', 'bg-bubblegum', '👥', 'Share a space', 'Invite your household, your crew, your book club. You own the space; they’re your guests.'],
          ].map(([n, tone, emoji, title, body]) => (
            <div key={n} className="brut relative rounded-2xl bg-white p-6 pt-8">
              <div className={cn('brut-sm absolute -top-5 left-6 flex size-11 items-center justify-center rounded-full font-display text-xl font-extrabold', tone)}>{n}</div>
              <div className="text-4xl">{emoji}</div>
              <h3 className="mt-3 text-2xl font-extrabold">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink/75">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The twist */}
      <section className="border-y-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Sticker tone="pink" rotate={2} className="mb-4 px-3 py-1 text-sm">
              the twist
            </Sticker>
            <h2 className="text-4xl font-extrabold sm:text-5xl">The app doesn’t get your data. You keep it.</h2>
            <p className="mt-4 text-lg text-ink/70">
              On Cubby, makers ship the app and we look after the data, on your behalf. It’s more like installing an app on your computer than signing up for yet another website.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="brut rounded-2xl bg-white p-6">
              <div className="mb-1 flex items-center gap-2">
                <Badge tone="muted">The usual way</Badge>
              </div>
              <h3 className="text-2xl font-extrabold">Most apps</h3>
              <div className="my-5">
                <Flow
                  tone="bg-cherry/40"
                  steps={[
                    { emoji: '🙂', label: 'You' },
                    { emoji: '📱', label: 'Their app' },
                    { emoji: '🏢', label: 'Their database', sub: 'with everyone’s data' },
                  ]}
                />
              </div>
              <ul className="flex flex-col gap-2.5">
                {['Your data sits in a database the developer controls', 'They can read it, mine it, leak it, or sell it', 'App shuts down? Your stuff goes with it', 'Developer has to run servers forever (and pay for them)'].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <X size={20} strokeWidth={3} className="mt-0.5 shrink-0 text-[#d23c3c]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="brut rounded-2xl bg-mint/60 p-6">
              <div className="mb-1 flex items-center gap-2">
                <Badge tone="dark">The Cubby way</Badge>
              </div>
              <h3 className="text-2xl font-extrabold">Cubby apps</h3>
              <div className="my-5">
                <Flow
                  tone="bg-sun"
                  steps={[
                    { emoji: '🙂', label: 'You' },
                    { emoji: '🧌', label: 'The app', sub: 'runs in your browser' },
                    { emoji: '📦', label: 'Your cubby', sub: 'only you + your people' },
                  ]}
                />
              </div>
              <ul className="flex flex-col gap-2.5">
                {['The app saves straight into your cubby', 'The developer ships code but never sees a single row', 'Back it up, export it, or delete it whenever you want', 'Apps can be “sealed”: no internet access at all'].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check size={20} strokeWidth={3} className="mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['🔍', 'See every byte', 'Browse the actual tables and rows each app keeps. No mystery boxes.'],
              ['🧬', 'Updates ask first', 'If an update wants to change your data, you’ll see exactly what, in plain words. And we back up first.'],
              ['💾', 'Backups, built in', 'Daily snapshots of everything, with one-click restore. Free.'],
              ['🔒', 'Sealed apps', 'Many apps can’t talk to the internet at all. Your data physically can’t wander off.'],
              ['👥', 'Share without sending', 'Invite people into a space instead of emailing spreadsheets around.'],
              ['🧳', 'Leave anytime', 'Export everything as plain files. No hostage situations.'],
            ].map(([e, t, d]) => (
              <div key={t} className="flex gap-3 rounded-2xl border-[3px] border-ink bg-white p-4">
                <div className="text-3xl">{e}</div>
                <div>
                  <div className="font-display text-lg font-extrabold">{t}</div>
                  <div className="text-sm leading-relaxed text-ink/70">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold sm:text-5xl">Made by people like you</h2>
            <p className="mt-2 text-lg text-ink/70">A few favorites from the shelf.</p>
          </div>
          <LinkButton to="/explore" variant="white">
            Browse all apps <ArrowRight size={16} strokeWidth={3} />
          </LinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((a) => (
            <AppCard key={a.id} app={a} />
          ))}
        </div>
      </section>

      {/* Makers */}
      <section id="makers" className="scroll-mt-20 border-y-[3px] border-ink bg-grape/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
          <div>
            <Sticker tone="white" rotate={-2} className="mb-4 px-3 py-1 text-sm">
              🛠️ for makers
            </Sticker>
            <h2 className="text-5xl leading-none font-extrabold sm:text-6xl">Ship the fun part.</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
              You (and your AI) write the app. Cubby handles the boring, scary bits. No servers, no database to babysit, and no user data to leak, because you never have it.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {['Login & accounts', 'A database for every user', 'Sharing & permissions', 'Realtime sync', 'Hosting for your bundle', 'Migrations across every install'].map((t) => (
                <li key={t} className="flex items-center gap-2 font-bold">
                  <span className="flex size-6 items-center justify-center rounded-md border-2 border-ink bg-mint">
                    <Check size={14} strokeWidth={4} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/workshop" size="lg" variant="primary">
                Open the Workshop
              </LinkButton>
              <LinkButton to="/workshop/docs" size="lg" variant="white">
                Read the docs
              </LinkButton>
            </div>
          </div>
          <div className="relative">
            <CodeBlock code={SDK_SNIPPET} title="app.js" />
            <div className="absolute -right-3 -bottom-5">
              <Sticker tone="sun" rotate={-4} className="px-3 py-1.5 text-sm">
                🤖 works great with AI agents
              </Sticker>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <h2 className="text-center text-4xl font-extrabold sm:text-5xl">Pricing that fits in a cubby</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-lg text-ink/70">Most people never pay a cent. Plus is there if you store lots of photos or want hourly backups.</p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { name: 'Free', price: '$0', sub: 'forever', tone: 'bg-white', perks: PLANS.free.perks, cta: 'Start free' },
            { name: 'Plus', price: `$${PLANS.plus.price}`, sub: 'per month', tone: 'bg-sun', perks: PLANS.plus.perks, cta: 'Try Plus', popular: true },
            {
              name: 'Makers',
              price: '$0',
              sub: 'to publish',
              tone: 'bg-grape/50',
              perks: ['Unlimited apps & releases', 'Hosting + SDK included', 'Privacy-safe analytics', 'Tips go 100% to you', 'Your installers pay for their own storage'],
              cta: 'Open the Workshop',
            },
          ].map((p) => (
            <div key={p.name} className={cn('brut relative flex flex-col rounded-2xl p-6', p.tone, p.popular && 'md:-translate-y-3')}>
              {p.popular && (
                <Sticker tone="pink" rotate={5} className="absolute -top-3 right-5">
                  Most loved
                </Sticker>
              )}
              <div className="font-display text-2xl font-extrabold">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-extrabold">{p.price}</span>
                <span className="font-bold text-ink/60">{p.sub}</span>
              </div>
              <ul className="mt-5 flex flex-1 flex-col gap-2">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-2 text-[15px]">
                    <Check size={18} strokeWidth={3} className="mt-0.5 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
              <LinkButton to={p.name === 'Makers' ? '/workshop' : p.name === 'Plus' ? '/account' : '/home'} variant={p.popular ? 'dark' : 'white'} className="mt-6">
                {p.cta}
              </LinkButton>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-center text-4xl font-extrabold sm:text-5xl">Questions, answered</h2>
          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group brut-sm rounded-xl bg-white open:bg-sun/25">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-lg font-extrabold">
                  {q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white transition-transform group-open:rotate-45">＋</span>
                </summary>
                <p className="px-5 pb-5 leading-relaxed text-ink/80">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-[3px] border-ink bg-sun">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center">
          <div className="text-6xl">📦</div>
          <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">Come look inside the cubby.</h2>
          <p className="mt-3 max-w-lg text-lg">It’s a demo, so poke everything. Install apps, break things, restore backups, ship releases. Nothing bites.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton to="/home" size="lg" variant="dark">
              🏠 Open My Cubby
            </LinkButton>
            <LinkButton to="/workshop" size="lg" variant="white">
              🛠️ Open the Workshop
            </LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t-[3px] border-ink bg-ink text-paper/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-6 text-sm">
          <span className="rounded-lg bg-paper p-1">
            <Logo size={24} withText={false} />
          </span>
          <span className="font-display text-lg font-extrabold text-paper">cubby</span>
          <span>Tiny apps for your people · a demo, made with 💛</span>
          <span className="ml-auto">© {new Date().getFullYear()} Cubby (not a real company… yet)</span>
        </div>
      </footer>
    </div>
  )
}
