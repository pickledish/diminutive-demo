import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ChevronDown, Lock, RotateCw, UserPlus } from 'lucide-react'
import { useDemo } from '@/store'
import { myRole } from '@/store/selectors'
import { bg } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { AppMock } from '@/components/AppMock'
import { AppIcon, AvatarStack, Logo } from '@/components/ui/identity'
import { Menu, MenuDivider, MenuItem } from '@/components/ui/Menu'
import { InviteModal } from '@/components/flows/InviteModal'
import { Sticker } from '@/components/ui/primitives'

interface LogLine {
  id: number
  call: string
  result: string
  tone?: 'ok' | 'blocked' | 'live'
}

const LABEL_COLUMNS = ['name', 'title', 'what', 'item', 'dish', 'idea', 'exercise', 'crop', 'message', 'today']

export function Runner() {
  const { appId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const people = useDemo((s) => s.people)
  const meId = useDemo((s) => s.meId)
  const [inviting, setInviting] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const opened = useRef('')

  const mine = useMemo(() => (inst ? inst.spaceIds.map((id) => spaces[id]).filter(Boolean) : []), [inst, spaces])
  const space = mine.find((s) => s.id === params.get('space')) ?? mine[0]

  const labels = useMemo(() => {
    if (!space) return []
    for (const rows of Object.values(space.tables)) {
      if (!rows.length) continue
      const col = LABEL_COLUMNS.find((c) => typeof rows[0][c] === 'string')
      if (col) return rows.map((r) => String(r[col]))
    }
    return []
  }, [space])

  const spaceId = space?.id
  useEffect(() => {
    if (!spaceId) return
    const s = useDemo.getState()
    const app = s.apps[appId]
    const space = s.spaces[spaceId]
    const { people, meId } = s
    if (!app || !space) return
    const key = `${appId}:${spaceId}`
    if (opened.current !== key) {
      opened.current = key
      s.openApp(appId, spaceId)
    }
    const me = people[meId]
    const tables = Object.entries(space.tables)
    const lines: Omit<LogLine, 'id'>[] = [
      { call: 'cubby.auth.user()', result: `${me.name} ${me.emoji}` },
      { call: 'cubby.spaces.current()', result: `“${space.name}” · ${space.members.length} ${space.members.length === 1 ? 'person' : 'people'} · you’re ${myRole(space, meId)}` },
      ...tables.map(([t, rows]) => ({ call: `db.from('${t}').select()`, result: `${rows.length} rows` })),
      { call: `db.from('${tables[0]?.[0] ?? 'items'}').subscribe()`, result: 'listening for changes…', tone: 'live' as const },
      app.network.length
        ? { call: `fetch('https://${app.network[0]}/…')`, result: 'allowed ✓ (on the list)' }
        : { call: "fetch('https://sneaky-analytics.io')", result: 'blocked: this app is sealed', tone: 'blocked' as const },
      { call: "fetch('https://ad-network.biz/pixel')", result: 'blocked: not on the allowlist', tone: 'blocked' as const },
    ]
    setLog([])
    let i = 0
    const timer = setInterval(() => {
      const line = lines[i]
      if (!line) return clearInterval(timer)
      setLog((l) => [...l, { ...line, id: i }])
      i++
    }, 420)
    const other = space.members.find((m) => m.personId !== meId && m.role !== 'viewer')
    const live =
      other &&
      setTimeout(() => {
        setLog((l) => [...l, { id: 999, call: 'realtime', result: `${people[other.personId]?.name.split(' ')[0]} changed 1 row in ${tables[0]?.[0]}`, tone: 'live' }])
      }, 6000)
    return () => {
      clearInterval(timer)
      if (live) clearTimeout(live)
    }
  }, [appId, spaceId])

  if (!app) return <Navigate to="/home" replace />
  if (!inst) return <Navigate to={`/apps/${appId}`} replace />

  const owner = space && space.ownerId === meId

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex h-14 items-center gap-2 border-b-[3px] border-ink bg-ink px-3 text-paper sm:gap-3">
        <Link to={`/my/${appId}`} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold hover:bg-paper/10">
          <ArrowLeft size={16} strokeWidth={3} />
          <span className="rounded-md bg-paper p-0.5">
            <Logo withText={false} size={20} />
          </span>
        </Link>
        <span className="h-6 w-[2px] bg-paper/20" />
        <AppIcon app={app} size="xs" shadow={false} className="border-paper" />
        <div className="hidden min-w-0 sm:block">
          <div className="truncate text-sm leading-tight font-bold">{app.name}</div>
          <div className="font-mono text-[10px] text-paper/50">v{inst.version}</div>
        </div>

        {space && (
          <Menu
            align="left"
            trigger={(open) => (
              <button className={cn('ml-1 flex items-center gap-1.5 rounded-lg border-2 border-paper/30 px-2.5 py-1 text-sm font-bold hover:border-paper', open && 'border-paper bg-paper/10')}>
                {space.emoji} <span className="max-w-32 truncate">{space.name}</span> <ChevronDown size={14} strokeWidth={3} />
              </button>
            )}
          >
            {(close) => (
              <div className="text-ink">
                <div className="px-3.5 pt-2.5 pb-1 text-[11px] font-extrabold tracking-wider text-ink/50 uppercase">Switch space</div>
                {mine.map((sp) => (
                  <MenuItem
                    key={sp.id}
                    emoji={sp.emoji}
                    onClick={() => {
                      setParams({ space: sp.id }, { replace: true })
                      close()
                    }}
                  >
                    <span className="flex-1">{sp.name}</span>
                    {sp.id === space.id && <span>✓</span>}
                  </MenuItem>
                ))}
                <MenuDivider />
                <Link to={`/my/${appId}/spaces`} className="block px-3.5 py-2.5 text-sm font-bold hover:bg-sun/40">
                  ⚙️ Manage spaces
                </Link>
              </div>
            )}
          </Menu>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {space && space.members.length > 1 && (
            <div className="hidden sm:block">
              <AvatarStack ids={space.members.map((m) => m.personId)} size="xs" max={4} />
            </div>
          )}
          <span className={cn('hidden items-center gap-1 rounded-full border-2 px-2 py-0.5 text-xs font-bold md:inline-flex', app.network.length ? 'border-paper/30' : 'border-mint text-mint')}>
            {app.network.length ? `🌐 ${app.network.length} allowed site${app.network.length > 1 ? 's' : ''}` : '🔒 Sealed'}
          </span>
          {owner && (
            <button onClick={() => setInviting(true)} className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-sun px-2.5 py-1 text-sm font-bold text-ink">
              <UserPlus size={15} strokeWidth={2.5} /> <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <Link to={`/my/${appId}/data${space ? `?space=${space.id}` : ''}`} className="rounded-lg border-2 border-paper/30 px-2.5 py-1 text-sm font-bold hover:border-paper">
            🗄️ <span className="hidden sm:inline">Data</span>
          </Link>
        </div>
      </header>

      <div className="dots flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-8">
        <div className="flex flex-1 flex-col">
          <div className="brut flex flex-1 flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center gap-2 border-b-[3px] border-ink bg-paper px-3 py-2">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full border-2 border-ink bg-cherry" />
                <span className="size-3 rounded-full border-2 border-ink bg-sun" />
                <span className="size-3 rounded-full border-2 border-ink bg-mint" />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-1 font-mono text-xs">
                <Lock size={12} strokeWidth={3} /> https://{app.id}.cubby.app
              </div>
              <RotateCw size={16} className="text-ink/40" />
            </div>
            <div className={cn('relative flex flex-1 items-center justify-center p-6 sm:p-10', bg[app.color])}>
              <div className="stripes absolute inset-0 opacity-60" />
              <div className="relative w-full max-w-sm">
                <AppMock app={app} labels={labels} className="shadow-brut-lg" />
              </div>
              <div className="absolute right-4 bottom-4 left-4 flex justify-center sm:right-auto sm:left-6 sm:justify-start">
                <div className="brut max-w-md rounded-2xl bg-white p-4">
                  <Sticker tone="sun" rotate={-3} className="mb-2">
                    Demo
                  </Sticker>
                  <p className="text-sm leading-snug">
                    <b>This is where {app.name} would run.</b> It’s {app.developerId === 'dev_robin' ? 'your' : 'the maker’s'} static bundle, served from Cubby. The SDK
                    logs you in and hands it a database scoped to <b>{space?.emoji} {space?.name}</b>. Everything it saves stays in {owner ? 'your' : `${people[space?.ownerId ?? '']?.name.split(' ')[0]}’s`} cubby.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-[380px]">
          <div className="brut overflow-hidden rounded-2xl bg-ink text-paper">
            <div className="flex items-center justify-between border-b-2 border-paper/15 px-4 py-2.5">
              <span className="font-display font-extrabold">What the app is asking Cubby</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-mint">
                <span className="size-2 animate-pulse rounded-full bg-mint" /> live
              </span>
            </div>
            <div className="flex min-h-72 flex-col gap-2 p-4 font-mono text-[12px] leading-snug">
              {log.map((l) => (
                <div key={l.id} className="animate-slide-up">
                  <div className={cn(l.tone === 'blocked' ? 'text-cherry' : l.tone === 'live' ? 'text-sky' : 'text-sun')}>
                    {l.tone === 'blocked' ? '⛔ ' : l.tone === 'live' ? '⚡ ' : '→ '}
                    {l.call}
                  </div>
                  <div className="pl-4 text-paper/65">{l.result}</div>
                </div>
              ))}
              {log.length === 0 && <div className="text-paper/40">booting {app.id}…</div>}
            </div>
          </div>
          <div className="rounded-2xl border-[3px] border-ink bg-white p-4 text-sm">
            <div className="mb-1 font-display text-base font-extrabold">Why this matters</div>
            <ul className="flex flex-col gap-1.5 text-ink/75">
              <li>• The app only sees the space you’re in. Switch spaces up top and it sees different data.</li>
              <li>• Every read and write lands in your activity log.</li>
              <li>• Network calls are checked against the app’s allowlist. Anything else is blocked.</li>
            </ul>
          </div>
        </aside>
      </div>
      {space && <InviteModal spaceId={space.id} open={inviting} onClose={() => setInviting(false)} />}
    </div>
  )
}
