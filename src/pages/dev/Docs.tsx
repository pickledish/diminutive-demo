import type { ReactNode } from 'react'
import { aiPrompt, cliSnippet, migrationSnippet, sdkSnippet } from '@/data/devContent'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Callout, Card, PageHeader } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

const SECTIONS = [
  ['quickstart', '🚀 Quickstart'],
  ['sdk', '🧰 The SDK'],
  ['migrations', '🧬 Migrations'],
  ['spaces', '👥 Spaces & roles'],
  ['config', '⚙️ cubby.json'],
  ['ai', '🤖 Building with AI'],
  ['privacy', '🙈 What you can see'],
] as const

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-3xl font-extrabold">{title}</h2>
      <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-ink/85">{children}</div>
    </section>
  )
}

const LIFECYCLE = [
  ['✍️', 'You write SQL', 'Add migrations/0007_*.sql with a plain-words @summary.', 'bg-white'],
  ['🔎', 'Cubby checks it', 'Lints for risky changes and dry-runs it on synthetic data shaped like your schema.', 'bg-sky/40'],
  ['🚢', 'You ship a release', 'The migration rides along with your new frontend bundle.', 'bg-white'],
  ['🙋', 'Users say yes', 'Each user (or space owner) sees your summary and approves. Or has auto-approve on.', 'bg-accent/50'],
  ['💾', 'Backup → apply', 'Cubby snapshots that install, runs your SQL, and checks it worked.', 'bg-white'],
  ['↩️', 'Failure? Undo.', 'If anything fails, that install rolls back automatically. You get an anonymous error report.', 'bg-mint/40'],
]

export function Docs() {
  return (
    <div>
      <PageHeader emoji="📚" title="Docs & SDK" subtitle="Everything you need to ship a Cubby app. Short on purpose." />
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#/workshop/docs`} onClick={(e) => (e.preventDefault(), document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))} className="rounded-lg border-2 border-transparent px-3 py-1.5 text-sm font-bold text-ink/70 hover:border-ink hover:bg-white hover:text-ink">
                {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="flex max-w-3xl flex-col gap-14">
          <Section id="quickstart" title="🚀 Quickstart">
            <p>A Cubby app is just a static website. Build it with whatever you like. When you deploy, Cubby hosts the files and gives your code a logged-in user and a database.</p>
            <CodeBlock lang="sh" code={cliSnippet('my-app')} />
            <Callout emoji="🧪" tone="sky">
              <b>cubby dev</b> runs your app against a local sandbox cubby with fake users, fake spaces and fake data, so you can test sharing without asking your mom to install anything.
            </Callout>
          </Section>

          <Section id="sdk" title="🧰 The SDK">
            <p>If you’ve used Supabase or Firebase, this will feel familiar. The big difference: every query runs against the <b>current user’s cubby</b>, scoped to the space they’re in. There’s no “all users” table to query, ever.</p>
            <CodeBlock code={sdkSnippet('my-app')} title="src/app.js" />
          </Section>

          <Section id="migrations" title="🧬 Migrations">
            <p>
              You can’t run SQL on your users’ databases. Nobody can, and that’s the point. Instead, you hand Cubby a migration and it <b>brokers</b> it out to every install, safely, with consent.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LIFECYCLE.map(([e, t, d, tone], i) => (
                <div key={t} className={cn('relative rounded-xl border-2 border-ink p-3', tone)}>
                  <div className="absolute -top-3 -left-2 flex size-6 items-center justify-center rounded-full border-2 border-ink bg-ink text-xs font-extrabold text-paper">{i + 1}</div>
                  <div className="text-2xl">{e}</div>
                  <div className="font-display font-extrabold">{t}</div>
                  <div className="text-sm text-ink/70">{d}</div>
                </div>
              ))}
            </div>
            <CodeBlock lang="sql" code={migrationSnippet} title="migrations/0002_add_aisle.sql" />
            <ul className="list-disc pl-5">
              <li>
                <b>Additive is easy.</b> New tables, nullable columns and columns with defaults sail through.
              </li>
              <li>
                <b>Destructive is loud.</b> DROP and DELETE show users a red warning and always require an explicit yes.
              </li>
              <li>
                <b>Old versions keep working.</b> Users who haven’t approved yet stay on your previous release until they do.
              </li>
              <li>
                <b>Shared spaces</b> update when their owner approves. Members see the new version afterward.
              </li>
            </ul>
          </Section>

          <Section id="spaces" title="👥 Spaces & roles">
            <p>A space is a separate database inside your app. Every install starts with one personal space, and users can create more — “Park House”, “Lake Trip 2026” — then invite people and switch between them. Your code just asks for the current one.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['👑', 'owner', 'Owns the data. Can invite, remove, back up, delete. Exactly one per space.'],
                ['✏️', 'editor', 'Reads and writes. Can’t manage members.'],
                ['👀', 'viewer', 'Read-only. Writes are rejected by Cubby, not just hidden in your UI.'],
              ].map(([e, r, d]) => (
                <Card key={r} className="p-4">
                  <div className="text-2xl">{e}</div>
                  <div className="font-mono font-extrabold">{r}</div>
                  <div className="text-sm text-ink/70">{d}</div>
                </Card>
              ))}
            </div>
          </Section>

          <Section id="config" title="⚙️ cubby.json">
            <p>One small file describes your app. Changing permissions or network access asks every user to re-approve, so keep it tight.</p>
            <CodeBlock
              title="cubby.json"
              code={`{
  "app": "grocery-goblin",
  "build": "dist",
  "migrations": "migrations",
  "permissions": ["notifications"],
  "network": []            // empty = "sealed": no outside requests at all
}`}
            />
          </Section>

          <Section id="ai" title="🤖 Building with AI">
            <p>Most Cubby apps are written with an AI agent. Paste this at the start of your chat so it knows the rules. There’s also a machine-readable version at <code className="rounded bg-ink/10 px-1 font-mono text-sm">cubby.app/llms.txt</code>.</p>
            <CodeBlock lang="text" wrap code={aiPrompt('my-app', 'My App')} title="prompt.md" />
          </Section>

          <Section id="privacy" title="🙈 What you can (and can’t) see">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-mint/40 p-5">
                <div className="mb-2 font-display text-lg font-extrabold">✅ You get</div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  <li>• Install, uninstall and active counts</li>
                  <li>• Version adoption & migration rollout status</li>
                  <li>• Anonymous error codes (never row data)</li>
                  <li>• Read/write volume per table</li>
                  <li>• Reviews, bug reports and tips people choose to send</li>
                </ul>
              </Card>
              <Card className="bg-cherry/20 p-5">
                <div className="mb-2 font-display text-lg font-extrabold">🚫 You never get</div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  <li>• Any row, column value or file</li>
                  <li>• Who your users are, or their emails</li>
                  <li>• Who shares spaces with whom</li>
                  <li>• Any number based on fewer than 10 installs</li>
                  <li>• A way to “just peek” for support. Users export & send it themselves.</li>
                </ul>
              </Card>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
