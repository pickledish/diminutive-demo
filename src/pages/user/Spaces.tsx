import { Link } from 'react-router'
import type { Space } from '@/types'
import { useDemo } from '@/store'
import { myRole, spaceKb, spaceRowCount } from '@/store/selectors'
import { ROLES } from '@/data/constants'
import { formatKb } from '@/lib/utils'
import { InviteCard } from '@/components/InviteCard'
import { RoleBadge } from '@/components/Badges'
import { AppIcon, Avatar, AvatarStack } from '@/components/ui/identity'
import { Card, EmptyState, LinkButton, PageHeader } from '@/components/ui/primitives'

function SpaceTile({ space }: { space: Space }) {
  const app = useDemo((s) => s.apps[space.appId])
  const meId = useDemo((s) => s.meId)
  const owner = useDemo((s) => s.people[space.ownerId])
  const role = myRole(space, meId)
  return (
    <Link to={`/my/${space.appId}/spaces`} className="brut lift flex flex-col rounded-2xl bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="relative">
          <span className="flex size-14 items-center justify-center rounded-2xl border-[3px] border-ink bg-paper text-3xl">{space.emoji}</span>
          <AppIcon app={app} size="xs" className="absolute -right-2 -bottom-2" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-xl font-extrabold">{space.name}</div>
          <div className="truncate text-sm text-ink/60">in {app?.name}</div>
        </div>
        {role && <RoleBadge role={role} />}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <AvatarStack ids={space.members.map((m) => m.personId)} size="sm" max={5} />
        <span className="text-xs font-bold text-ink/50">
          {spaceRowCount(space)} rows · {formatKb(spaceKb(space))}
        </span>
      </div>
      {space.ownerId !== meId && (
        <div className="mt-3 flex items-center gap-1.5 border-t-2 border-ink/10 pt-3 text-xs font-bold text-ink/60">
          <Avatar person={owner} size="xs" /> Lives in {owner?.name.split(' ')[0]}’s cubby
        </div>
      )}
      {space.pending.length > 0 && <div className="mt-3 border-t-2 border-ink/10 pt-3 text-xs font-bold text-ink/60">💌 {space.pending.length} invite pending</div>}
    </Link>
  )
}

export function Spaces() {
  const installs = useDemo((s) => s.installs)
  const spaces = useDemo((s) => s.spaces)
  const invites = useDemo((s) => s.invites)
  const meId = useDemo((s) => s.meId)
  const all = Object.values(installs).flatMap((i) => i.spaceIds.map((id) => spaces[id]).filter(Boolean))
  const owned = all.filter((sp) => sp.ownerId === meId && sp.members.length + sp.pending.length > 1)
  const guest = all.filter((sp) => sp.ownerId !== meId)
  const solo = all.filter((sp) => sp.ownerId === meId && sp.members.length + sp.pending.length <= 1)

  return (
    <div>
      <PageHeader emoji="👥" title="Spaces" subtitle="Little shared rooms inside your apps. Whoever makes a space owns it; everyone else is a guest." />

      {invites.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-extrabold">💌 Invites for you</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {invites.map((inv) => (
              <InviteCard key={inv.id} invite={inv} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-4 text-2xl font-extrabold">👑 Spaces you own</h2>
            {owned.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {owned.map((sp) => (
                  <SpaceTile key={sp.id} space={sp} />
                ))}
              </div>
            ) : (
              <EmptyState emoji="🏠" title="You don’t own any shared spaces yet">
                Open any shareable app and invite someone in.
              </EmptyState>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-extrabold">🧳 Spaces you’re a guest in</h2>
            {guest.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {guest.map((sp) => (
                  <SpaceTile key={sp.id} space={sp} />
                ))}
              </div>
            ) : (
              <EmptyState emoji="🚪" title="No guest spaces">
                When someone invites you, it’ll show up here.
              </EmptyState>
            )}
          </section>
          {solo.length > 0 && (
            <section>
              <h2 className="mb-1 text-2xl font-extrabold">🙂 Just you</h2>
              <p className="mb-4 text-ink/60">Private spaces. Invite someone and they become shared.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                {solo.map((sp) => (
                  <SpaceTile key={sp.id} space={sp} />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside>
          <Card className="sticky top-24 p-5">
            <h3 className="text-xl font-extrabold">How spaces work</h3>
            <div className="mt-4 flex flex-col gap-4">
              {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((r) => (
                <div key={r} className="flex gap-3">
                  <span className="text-2xl">{ROLES[r].emoji}</span>
                  <div>
                    <div className="font-bold">{ROLES[r].label}</div>
                    <div className="text-sm text-ink/65">{ROLES[r].detail}</div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border-2 border-ink bg-sun/30 p-3 text-sm leading-snug">
                <b>The data lives with the owner.</b> It sits in their cubby and counts toward their storage. Guests can leave anytime; owners can hand the space over before they go.
              </div>
            </div>
            <LinkButton to="/explore?shared=1" variant="white" size="sm" className="mt-5 w-full">
              Find shareable apps
            </LinkButton>
          </Card>
        </aside>
      </div>
    </div>
  )
}
