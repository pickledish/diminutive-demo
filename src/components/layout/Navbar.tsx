import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Bell } from 'lucide-react'
import { crossesMode, modeTransition, startModeSwitch, useMode } from '@/lib/mode'
import { useDemo, useMe } from '@/store'
import type { AppNotification, Invite } from '@/types'
import { celebrate } from '@/lib/fx'
import { cn, timeAgo } from '@/lib/utils'
import { Avatar, Logo } from '../ui/identity'
import { Menu, MenuDivider, MenuItem } from '../ui/Menu'
import { Button } from '../ui/primitives'
import { UpdateReviewModal } from '../flows/UpdateReview'
import { toast } from '../ui/toast'

function ModeJump({ to, dir }: { to: string; dir: 'left' | 'right' }) {
  const navigate = useNavigate()
  const toWorkshop = dir === 'right'
  const label = toWorkshop ? 'Switch to Workshop' : 'Switch to My Apps'
  return (
    <Link
      to={to}
      onClick={(e) => startModeSwitch(e, navigate, to)}
      aria-label={label}
      title={label}
      className={cn(
        'group brut-xs press inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-extrabold whitespace-nowrap sm:px-3',
        toWorkshop ? 'bg-grape' : 'bg-sun',
      )}
    >
      {!toWorkshop && <ArrowLeft size={16} strokeWidth={3} className="transition-transform group-hover:-translate-x-0.5" />}
      <span>{toWorkshop ? '🛠️' : '🏠'}</span>
      <span className="hidden sm:inline">{toWorkshop ? 'Workshop' : 'My Apps'}</span>
      {toWorkshop && <ArrowRight size={16} strokeWidth={3} className="transition-transform group-hover:translate-x-0.5" />}
    </Link>
  )
}

function coveredByAction(n: AppNotification, pendingNames: string[], inviteNames: string[]) {
  if (n.href === '/home' || n.href === '/spaces') return true
  if (inviteNames.some((name) => n.title.includes(name))) return true
  return pendingNames.some((name) => n.title.startsWith(name) && /update/i.test(n.title))
}

function UpdateNotice({ appId, onReview }: { appId: string; onReview: () => void }) {
  const upd = useDemo((s) => s.pendingUpdates[appId])
  const app = useDemo((s) => s.apps[appId])
  if (!upd || !app) return null
  const changesData = upd.dataSummary.length > 0
  return (
    <div className="border-b-2 border-ink/10 bg-accent/40 px-4 py-3">
      <div className="flex gap-3">
        <span className="text-xl leading-none">{app.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-snug font-bold">
            {app.name} {upd.toVersion} {changesData ? 'wants to update your data' : 'is ready'}
          </div>
          <p className="mt-0.5 text-xs text-ink/65">{upd.snoozed ? 'Snoozed · ' : ''}{upd.dataSummary[0] ?? upd.notes}</p>
        </div>
      </div>
      <Button variant="dark" size="sm" className="mt-3 w-full" onClick={onReview}>
        Review update
      </Button>
    </div>
  )
}

function InviteNotice({ invite, close }: { invite: Invite; close: () => void }) {
  const from = useDemo((s) => s.people[invite.fromPersonId])
  const app = useDemo((s) => s.apps[invite.appId])
  const installed = useDemo((s) => !!s.installs[invite.appId])
  const accept = useDemo((s) => s.acceptInvite)
  const decline = useDemo((s) => s.declineInvite)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const who = from?.name.split(' ')[0]

  return (
    <div className="border-b-2 border-ink/10 bg-sky/25 px-4 py-3">
      <div className="flex gap-3">
        <span className="text-xl leading-none">{invite.spaceEmoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-snug font-bold">
            {who} invited you to {invite.spaceName}
          </div>
          <p className="mt-0.5 text-xs text-ink/65">
            in {app?.name} · you’ll be {invite.role === 'editor' ? 'an editor' : 'a viewer'}
            {!installed ? ` · joining installs ${app?.name}` : ''}
          </p>
          {invite.message && <p className="mt-1 text-xs italic text-ink/70">“{invite.message}”</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => {
            const sid = accept(invite.id)
            celebrate()
            toast({
              emoji: invite.spaceEmoji,
              title: `You joined ${invite.spaceName}!`,
              body: `${who} owns this space. You’re ${invite.role === 'editor' ? 'an editor' : 'a viewer'}.`,
              tone: 'success',
            })
            close()
            const dest = `/my/${invite.appId}/spaces`
            if (sid) navigate(dest, crossesMode(pathname, dest) ? modeTransition : undefined)
          }}
        >
          {installed ? 'Join space' : 'Install & join'}
        </Button>
        <Button
          variant="white"
          size="sm"
          onClick={() => {
            decline(invite.id)
            toast({ emoji: '👋', title: 'Invite declined', body: `${who} won’t be notified. We’re not monsters.` })
          }}
        >
          No thanks
        </Button>
      </div>
    </div>
  )
}

function Notifications() {
  const notifications = useDemo((s) => s.notifications)
  const pending = useDemo((s) => s.pendingUpdates)
  const invites = useDemo((s) => s.invites)
  const installs = useDemo((s) => s.installs)
  const apps = useDemo((s) => s.apps)
  const markAllRead = useDemo((s) => s.markAllRead)
  const markRead = useDemo((s) => s.markRead)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [reviewAppId, setReviewAppId] = useState<string | null>(null)

  const pendingIds = Object.keys(pending).filter((id) => installs[id])
  const pendingNames = pendingIds.map((id) => apps[id]?.name).filter(Boolean)
  const inviteNames = invites.map((i) => i.spaceName)
  const feed = notifications.filter((n) => !coveredByAction(n, pendingNames, inviteNames))
  const unreadNotes = feed.filter((n) => !n.read).length
  const needsYou = pendingIds.length + invites.length
  const badge = unreadNotes + needsYou

  return (
    <>
      <Menu
        className="w-[min(400px,calc(100vw-2rem))]"
        trigger={(open) => (
          <button className={cn('brut-xs press relative rounded-xl p-2', open ? 'bg-accent' : 'bg-white')} aria-label="Notifications">
            <Bell size={18} strokeWidth={2.5} />
            {badge > 0 && (
              <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border-2 border-ink bg-cherry text-[10px] font-extrabold">{badge}</span>
            )}
          </button>
        )}
      >
        {(close) => (
          <div>
            <div className="flex items-center justify-between border-b-2 border-ink bg-accent px-4 py-2.5">
              <span className="font-display font-extrabold">Notifications</span>
              {unreadNotes > 0 && (
                <button onClick={markAllRead} className="text-xs font-bold underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {needsYou === 0 && feed.length === 0 && <div className="p-6 text-center text-sm text-ink/60">All quiet. 🌙</div>}
              {pendingIds.map((id) => (
                <UpdateNotice
                  key={id}
                  appId={id}
                  onReview={() => {
                    close()
                    setReviewAppId(id)
                  }}
                />
              ))}
              {invites.map((inv) => (
                <InviteNotice key={inv.id} invite={inv} close={close} />
              ))}
              {feed.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id)
                    close()
                    if (n.href) navigate(n.href, crossesMode(pathname, n.href) ? modeTransition : undefined)
                  }}
                  className={cn('flex w-full gap-3 border-b-2 border-ink/10 px-4 py-3 text-left last:border-0 hover:bg-accent/25', !n.read && 'bg-sky/15')}
                >
                  <span className="text-xl leading-none">{n.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-bold">{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-xs text-ink/65">{n.body}</span>}
                    <span className="mt-1 block text-[11px] font-bold text-ink/45">{timeAgo(n.at)}</span>
                  </span>
                  {!n.read && <span className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-ink bg-cherry" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </Menu>
      {reviewAppId && <UpdateReviewModal appId={reviewAppId} open onClose={() => setReviewAppId(null)} />}
    </>
  )
}

function ProfileMenu() {
  const me = useMe()
  const plan = useDemo((s) => s.plan)
  const reset = useDemo((s) => s.resetDemo)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const go = (to: string) => navigate(to, crossesMode(pathname, to) ? modeTransition : undefined)
  return (
    <Menu
      trigger={() => (
        <button className="press rounded-full" aria-label="Account menu">
          <Avatar person={me} size="md" className="shadow-brut-xs" />
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center gap-3 border-b-2 border-ink px-4 py-3">
            <Avatar person={me} size="md" />
            <div className="min-w-0">
              <div className="truncate font-bold">{me.name}</div>
              <div className="truncate text-xs text-ink/60">{me.email}</div>
            </div>
            <span className="ml-auto rounded-full border-2 border-ink bg-accent px-2 text-[11px] font-extrabold uppercase">{plan}</span>
          </div>
          <MenuItem emoji="⚙️" onClick={() => (close(), go('/account'))}>
            Account & plan
          </MenuItem>
          <MenuItem emoji="💾" onClick={() => (close(), go('/data'))}>
            Data & backups
          </MenuItem>
          <MenuItem emoji="📣" onClick={() => (close(), go('/'))}>
            About Diminutive (landing page)
          </MenuItem>
          <MenuDivider />
          <MenuItem emoji="🧹" onClick={() => (close(), reset())}>
            Reset demo
          </MenuItem>
        </div>
      )}
    </Menu>
  )
}

export function Navbar() {
  const { workshop } = useMode()

  const userLinks = [
    { to: '/home', label: 'Home' },
    { to: '/explore', label: 'Explore' },
  ]
  const devLinks = [
    { to: '/workshop', label: 'My apps', end: true },
    { to: '/workshop/docs', label: 'Docs & SDK' },
  ]
  const links = workshop ? devLinks : userLinks

  const navItems = links.map((l) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={'end' in l && !!l.end}
      className={({ isActive }) =>
        cn(
          'relative inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-colors',
          isActive ? 'border-ink bg-white shadow-brut-xs' : 'border-transparent text-ink/70 hover:text-ink',
        )
      }
    >
      {l.label}
    </NavLink>
  ))

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-surface/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {workshop && <ModeJump to="/home" dir="left" />}
        <Link to={workshop ? '/workshop' : '/home'} className="shrink-0">
          <Logo withText={false} size={36} className="sm:hidden" />
          <Logo className="hidden sm:inline-flex" />
        </Link>
        <nav className="ml-2 hidden items-center gap-1 lg:flex">{navItems}</nav>
        <div className="ml-auto flex items-center gap-2.5">
          <Notifications />
          <ProfileMenu />
          {!workshop && <ModeJump to="/workshop" dir="right" />}
        </div>
      </div>
      <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t-2 border-ink/15 px-3 py-1.5 lg:hidden">{navItems}</nav>
    </header>
  )
}
