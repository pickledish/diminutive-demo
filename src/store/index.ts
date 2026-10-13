import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  ActivityEvent,
  AppListing,
  BackupKind,
  Category,
  Channel,
  ColorKey,
  DevApp,
  Install,
  MigrationOp,
  PermissionKey,
  Release,
  Role,
  Space,
  Tables,
  TourStep,
} from '@/types'
import { createSeed, seedSpaceTables, SEED_VERSION, type SeedData } from '@/data/seed'
import { applyOpsToSchema, applyOpsToTables } from '@/lib/migrate'
import { compareVersions, daysFromNow, now, randomHex, slugify, uid } from '@/lib/utils'
import { ANIMALS } from '@/data/constants'
import { toast } from '@/components/ui/toast'
import { spaceKb } from './selectors'

type Draft = SeedData

interface Actions {
  markTour: (step: TourStep) => void
  resetDemo: () => void

  installApp: (appId: string, opts?: { spaceName?: string; spaceEmoji?: string }) => string | undefined
  uninstallApp: (appId: string, keepData: boolean) => void
  restoreFromTrash: (appId: string) => void
  purgeTrash: (appId: string) => void
  setInstallPref: (appId: string, patch: Partial<Pick<Install, 'autoUpdate' | 'autoApproveData' | 'notificationsOn'>>) => void
  applyUpdate: (appId: string) => void
  snoozeUpdate: (appId: string) => void
  openApp: (appId: string, spaceId?: string) => void

  createSpace: (appId: string, name: string, emoji: string) => string
  renameSpace: (spaceId: string, name: string, emoji: string) => void
  deleteSpace: (spaceId: string) => void
  leaveSpace: (spaceId: string) => void
  inviteToSpace: (spaceId: string, label: string, role: Role) => void
  cancelInvite: (spaceId: string, pendingId: string) => void
  setMemberRole: (spaceId: string, personId: string, role: Role) => void
  removeMember: (spaceId: string, personId: string) => void
  transferOwnership: (spaceId: string, personId: string) => void
  acceptInvite: (inviteId: string) => string | undefined
  declineInvite: (inviteId: string) => void

  createBackup: (appId?: string, note?: string, kind?: BackupKind) => string
  restoreBackup: (backupId: string, appId?: string) => void
  deleteBackup: (backupId: string) => void
  deleteRow: (spaceId: string, table: string, rowId: string) => void
  logActivity: (e: Omit<ActivityEvent, 'id' | 'at'>) => void

  addReview: (appId: string, rating: number, text: string) => void
  sendFeedback: (appId: string, text: string, includeName: boolean) => void
  tipApp: (appId: string, cents: number) => void
  markAllRead: () => void
  markRead: (id: string) => void
  setPlan: (plan: 'free' | 'plus') => void
  setAutoBackup: (f: Draft['autoBackup']) => void
  updateProfile: (name: string, emoji: string) => void

  createDevApp: (input: {
    name: string
    emoji: string
    color: ColorKey
    category: Category
    tagline: string
    supportsSpaces: boolean
    permissions: PermissionKey[]
  }) => string
  updateListing: (appId: string, patch: Partial<AppListing>) => void
  setDevStatus: (appId: string, status: DevApp['status']) => void
  deployRelease: (
    appId: string,
    input: { version: string; notes: string; channel: Channel; migrationIds: string[]; source: Release['source']; rolloutPct?: number },
  ) => string
  promoteRelease: (appId: string, releaseId: string) => void
  rollbackTo: (appId: string, releaseId: string) => void
  setRollout: (appId: string, releaseId: string, pct: number) => void
  addMigration: (
    appId: string,
    input: { filename: string; sql: string; summary: string[]; ops: MigrationOp[]; destructive: boolean; reversible: boolean },
  ) => string
  deleteMigration: (appId: string, migrationId: string) => void
  replyToReview: (appId: string, reviewId: string, text: string) => void
  setBugStatus: (appId: string, bugId: string, status: 'new' | 'seen' | 'fixed') => void
  addCollaborator: (appId: string, name: string) => void
  removeCollaborator: (appId: string, name: string) => void
  setNetwork: (appId: string, domains: string[]) => void
  deleteDevApp: (appId: string) => void
}

export type DemoState = Draft & Actions

const pushActivity = (s: Draft, e: Omit<ActivityEvent, 'id' | 'at'>) => {
  s.activity.unshift({ id: uid('act'), at: now(), ...e })
  if (s.activity.length > 200) s.activity.length = 200
}

const notify = (s: Draft, n: { emoji: string; title: string; body?: string; href?: string }) => {
  s.notifications.unshift({ id: uid('ntf'), at: now(), read: false, ...n })
}

const appName = (s: Draft, appId?: string) => (appId ? (s.apps[appId]?.name ?? 'App') : 'Cubby')

function emptyTables(app: AppListing): Tables {
  return Object.fromEntries(app.schema.map((t) => [t.name, []]))
}

function nameFromLabel(label: string) {
  const local = label.includes('@') ? label.split('@')[0] : label
  return local
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function snapshotFor(s: Draft, appId?: string) {
  const snap: Record<string, Tables> = {}
  for (const inst of Object.values(s.installs)) {
    if (appId && inst.appId !== appId) continue
    for (const sid of inst.spaceIds) if (s.spaces[sid]) snap[sid] = JSON.parse(JSON.stringify(s.spaces[sid].tables))
  }
  return snap
}

function sizeFor(s: Draft, appId?: string) {
  let kb = 0
  for (const inst of Object.values(s.installs)) {
    if (appId && inst.appId !== appId) continue
    for (const sid of inst.spaceIds) if (s.spaces[sid]) kb += spaceKb(s.spaces[sid])
  }
  return Math.max(4, Math.round(kb))
}

/** Push a now-live release to the demo user's own install (they're both maker and user). */
function deliverToMe(s: Draft, appId: string, release: Release) {
  const inst = s.installs[appId]
  const dev = s.devApps[appId]
  if (!inst || !dev) return
  if (compareVersions(release.version, inst.version) <= 0) return
  const migs = dev.migrations.filter((m) => release.migrationIds.includes(m.id) && !inst.appliedMigrations.includes(m.id))
  const existing = s.pendingUpdates[appId]
  const ops = migs.flatMap((m) => m.ops)
  const summary = migs.flatMap((m) => m.summary)
  const app = s.apps[appId]

  if (migs.length || existing) {
    s.pendingUpdates[appId] = {
      appId,
      fromVersion: inst.version,
      toVersion: release.version,
      notes: release.notes,
      dataSummary: [...(existing?.dataSummary ?? []), ...summary],
      ops: [...(existing?.ops ?? []), ...ops],
      migrationIds: [...(existing?.migrationIds ?? []), ...migs.map((m) => m.id)],
      destructive: !!existing?.destructive || migs.some((m) => m.destructive),
      releasedAt: now(),
    }
    if (migs.length) {
      notify(s, {
        emoji: app.emoji,
        title: `${app.name} ${release.version} wants to update your data`,
        body: summary[0],
        href: '/home',
      })
      pushActivity(s, { kind: 'update', appId, text: `${app.name} ${release.version} is waiting for your OK (it changes your data)`, who: 'cubby' })
    }
  } else if (inst.autoUpdate) {
    inst.version = release.version
    inst.updatedAt = now()
    pushActivity(s, { kind: 'update', appId, text: `${app.name} updated to ${release.version} automatically (no data changes)`, who: 'cubby' })
    notify(s, { emoji: app.emoji, title: `${app.name} updated to ${release.version}`, body: release.notes, href: `/my/${appId}` })
  } else {
    s.pendingUpdates[appId] = {
      appId,
      fromVersion: inst.version,
      toVersion: release.version,
      notes: release.notes,
      dataSummary: [],
      ops: [],
      migrationIds: [],
      destructive: false,
      releasedAt: now(),
    }
  }
}

function goLive(s: Draft, appId: string, releaseId: string) {
  const dev = s.devApps[appId]
  const app = s.apps[appId]
  const release = dev.releases.find((r) => r.id === releaseId)
  if (!release) return
  for (const r of dev.releases) if (r.channel === 'live' && r.id !== releaseId) r.channel = 'archived'
  release.channel = 'live'
  const migs = dev.migrations.filter((m) => release.migrationIds.includes(m.id))
  for (const m of migs) {
    if (!m.releaseVersion) m.releaseVersion = release.version
    if (m.stats.applied + m.stats.pending + m.stats.failed === 0) {
      const mine = s.installs[appId] ? 1 : 0
      m.stats = { applied: 0, pending: Math.max(app.installs, mine), failed: 0 }
    }
  }
  const newer = compareVersions(release.version, app.version) > 0
  app.version = release.version
  app.updatedAt = now()
  if (newer) {
    app.schema = applyOpsToSchema(
      app.schema,
      migs.flatMap((m) => m.ops),
    )
    const summary = migs.flatMap((m) => m.summary)
    if (!app.changelog.some((c) => c.version === release.version))
      app.changelog.unshift({ version: release.version, date: now(), notes: release.notes, dataSummary: summary.length ? summary : undefined })
    deliverToMe(s, appId, release)
  }
}

export const useDemo = create<DemoState>()(
  persist(
    immer((set, get) => ({
      ...createSeed(),

      markTour: (step) =>
        set((s) => {
          s.tour[step] = true
        }),

      resetDemo: () => {
        set(() => createSeed())
        toast({ emoji: '🧹', title: 'Demo reset', body: 'Everything is back to how it started.' })
      },

      installApp: (appId, opts) => {
        let spaceId: string | undefined
        set((s) => {
          const app = s.apps[appId]
          if (!app || s.installs[appId]) return
          spaceId = uid('sp')
          const shared = !!opts?.spaceName
          s.spaces[spaceId] = {
            id: spaceId,
            appId,
            name: opts?.spaceName || (app.supportsSpaces ? 'Just me' : 'My data'),
            emoji: opts?.spaceEmoji || (shared ? '✨' : '🙂'),
            ownerId: s.meId,
            members: [{ personId: s.meId, role: 'owner', joinedAt: now() }],
            pending: [],
            createdAt: now(),
            tables: emptyTables(app),
            extraKb: 0,
          }
          s.installs[appId] = {
            appId,
            version: app.version,
            installedAt: now(),
            updatedAt: now(),
            autoUpdate: true,
            autoApproveData: false,
            notificationsOn: app.permissions.includes('notifications'),
            schema: JSON.parse(JSON.stringify(app.schema)),
            spaceIds: [spaceId],
            appliedMigrations: s.devApps[appId]?.migrations.map((m) => m.id) ?? [],
          }
          app.installs += 1
          s.tour.install = true
          pushActivity(s, { kind: 'install', appId, text: `You installed ${app.name}`, who: s.meId })
        })
        return spaceId
      },

      uninstallApp: (appId, keepData) =>
        set((s) => {
          const inst = s.installs[appId]
          if (!inst) return
          const app = s.apps[appId]
          const owned: string[] = []
          for (const sid of inst.spaceIds) {
            const sp = s.spaces[sid]
            if (!sp) continue
            if (sp.ownerId === s.meId) owned.push(sid)
            else {
              sp.members = sp.members.filter((m) => m.personId !== s.meId)
              delete s.spaces[sid]
            }
          }
          if (keepData) {
            s.trash.push({ install: { ...inst, spaceIds: owned }, deletedAt: now(), purgeAt: daysFromNow(30) })
          } else {
            for (const sid of owned) delete s.spaces[sid]
            s.backups = s.backups.filter((b) => b.appId !== appId)
          }
          delete s.installs[appId]
          delete s.pendingUpdates[appId]
          app.installs = Math.max(0, app.installs - 1)
          pushActivity(s, {
            kind: 'install',
            appId,
            text: keepData ? `You uninstalled ${app.name}. Data kept for 30 days.` : `You uninstalled ${app.name} and deleted its data`,
            who: s.meId,
          })
        }),

      restoreFromTrash: (appId) =>
        set((s) => {
          const idx = s.trash.findIndex((t) => t.install.appId === appId)
          if (idx < 0 || s.installs[appId]) return
          s.installs[appId] = { ...s.trash[idx].install, installedAt: now() }
          s.trash.splice(idx, 1)
          s.apps[appId].installs += 1
          pushActivity(s, { kind: 'install', appId, text: `You reinstalled ${appName(s, appId)}. Your old data came right back.`, who: s.meId })
        }),

      purgeTrash: (appId) =>
        set((s) => {
          const t = s.trash.find((t) => t.install.appId === appId)
          if (!t) return
          for (const sid of t.install.spaceIds) delete s.spaces[sid]
          s.trash = s.trash.filter((x) => x !== t)
          s.backups = s.backups.filter((b) => b.appId !== appId)
          pushActivity(s, { kind: 'install', appId, text: `You permanently deleted ${appName(s, appId)}’s data`, who: s.meId })
        }),

      setInstallPref: (appId, patch) =>
        set((s) => {
          if (s.installs[appId]) Object.assign(s.installs[appId], patch)
        }),

      applyUpdate: (appId) =>
        set((s) => {
          const upd = s.pendingUpdates[appId]
          const inst = s.installs[appId]
          if (!upd || !inst) return
          const app = s.apps[appId]
          if (upd.ops.length || upd.migrationIds.length) {
            s.backups.unshift({
              id: uid('bk'),
              appId,
              createdAt: now(),
              sizeKb: sizeFor(s, appId),
              kind: 'pre-update',
              note: `Before updating to ${upd.toVersion}`,
              snapshot: snapshotFor(s, appId),
            })
            pushActivity(s, { kind: 'backup', appId, text: `Backed up ${app.name} before updating to ${upd.toVersion}`, who: 'cubby' })
          }
          inst.schema = applyOpsToSchema(inst.schema, upd.ops)
          for (const sid of inst.spaceIds) {
            const sp = s.spaces[sid]
            if (sp) sp.tables = applyOpsToTables(sp.tables, upd.ops)
          }
          inst.appliedMigrations.push(...upd.migrationIds)
          inst.version = upd.toVersion
          inst.updatedAt = now()
          if (upd.dataSummary.length) {
            pushActivity(s, {
              kind: 'schema',
              appId,
              text: `${app.name} ${upd.toVersion} changed your data: ${upd.dataSummary.map((x) => x.split('.')[0].toLowerCase()).join('; ')}`,
              who: 'cubby',
            })
          }
          pushActivity(s, { kind: 'update', appId, text: `You updated ${app.name} to ${upd.toVersion}`, who: s.meId })
          const dev = s.devApps[appId]
          if (dev) {
            for (const m of dev.migrations) {
              if (upd.migrationIds.includes(m.id) && m.stats.pending > 0) {
                m.stats.pending -= 1
                m.stats.applied += 1
              }
            }
          }
          delete s.pendingUpdates[appId]
          s.notifications.forEach((n) => {
            if (n.title.startsWith(app.name) && n.title.includes('update')) n.read = true
          })
          s.tour.update = true
        }),

      snoozeUpdate: (appId) =>
        set((s) => {
          if (s.pendingUpdates[appId]) s.pendingUpdates[appId].snoozed = true
        }),

      openApp: (appId, spaceId) =>
        set((s) => {
          const inst = s.installs[appId]
          if (!inst) return
          inst.lastOpenedAt = now()
          const sp = spaceId ? s.spaces[spaceId] : undefined
          const rows = sp ? Object.values(sp.tables).reduce((n, r) => n + r.length, 0) : 0
          pushActivity(s, {
            kind: 'read',
            appId,
            spaceId,
            text: `${appName(s, appId)} read ${rows} rows${sp ? ` from “${sp.name}”` : ''} while you were using it`,
            who: s.meId,
          })
        }),

      createSpace: (appId, name, emoji) => {
        const id = uid('sp')
        set((s) => {
          const app = s.apps[appId]
          const inst = s.installs[appId]
          if (!app || !inst) return
          s.spaces[id] = {
            id,
            appId,
            name,
            emoji,
            ownerId: s.meId,
            members: [{ personId: s.meId, role: 'owner', joinedAt: now() }],
            pending: [],
            createdAt: now(),
            tables: Object.fromEntries(inst.schema.map((t) => [t.name, []])),
            extraKb: 0,
          }
          inst.spaceIds.push(id)
          pushActivity(s, { kind: 'sharing', appId, spaceId: id, text: `You created the space “${name}”`, who: s.meId })
        })
        return id
      },

      renameSpace: (spaceId, name, emoji) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp) return
          sp.name = name
          sp.emoji = emoji
        }),

      deleteSpace: (spaceId) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp) return
          const inst = s.installs[sp.appId]
          if (inst) inst.spaceIds = inst.spaceIds.filter((x) => x !== spaceId)
          delete s.spaces[spaceId]
          pushActivity(s, { kind: 'sharing', appId: sp.appId, text: `You deleted the space “${sp.name}” and everything in it`, who: s.meId })
        }),

      leaveSpace: (spaceId) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp) return
          const inst = s.installs[sp.appId]
          if (inst) inst.spaceIds = inst.spaceIds.filter((x) => x !== spaceId)
          delete s.spaces[spaceId]
          pushActivity(s, { kind: 'sharing', appId: sp.appId, text: `You left “${sp.name}”. Its data stays with its owner.`, who: s.meId })
        }),

      inviteToSpace: (spaceId, label, role) => {
        const pendingId = uid('pi')
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp) return
          sp.pending.push({ id: pendingId, label, role, sentAt: now() })
          pushActivity(s, { kind: 'sharing', appId: sp.appId, spaceId, text: `You invited ${label} to “${sp.name}” as ${role === 'editor' ? 'an editor' : 'a viewer'}`, who: s.meId })
        })
        setTimeout(() => {
          const sp = get().spaces[spaceId]
          if (!sp?.pending.some((p) => p.id === pendingId)) return
          let joinedName = ''
          let joinedEmoji = ''
          set((s) => {
            const sp = s.spaces[spaceId]
            if (!sp) return
            const lower = label.toLowerCase().trim()
            let person = Object.values(s.people).find((p) => p.email.toLowerCase() === lower || p.name.toLowerCase() === lower)
            if (!person) {
              const id = uid('usr')
              person = {
                id,
                name: nameFromLabel(label) || label,
                emoji: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
                color: (['sun', 'bubblegum', 'sky', 'mint', 'tangerine', 'grape', 'lime'] as const)[Math.floor(Math.random() * 7)],
                email: label.includes('@') ? label : `${slugify(label)}@example.com`,
              }
              s.people[id] = person
            }
            sp.pending = sp.pending.filter((p) => p.id !== pendingId)
            if (!sp.members.some((m) => m.personId === person!.id)) sp.members.push({ personId: person.id, role, joinedAt: now() })
            joinedName = person.name
            joinedEmoji = person.emoji
            pushActivity(s, { kind: 'sharing', appId: sp.appId, spaceId, text: `${person.name} joined “${sp.name}”`, who: person.id })
          })
          if (joinedName) toast({ emoji: joinedEmoji, title: `${joinedName} joined ${sp.name}!`, body: 'They accepted your invite (in demo-land, everyone says yes).', tone: 'success' })
        }, 3500)
      },

      cancelInvite: (spaceId, pendingId) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (sp) sp.pending = sp.pending.filter((p) => p.id !== pendingId)
        }),

      setMemberRole: (spaceId, personId, role) =>
        set((s) => {
          const m = s.spaces[spaceId]?.members.find((m) => m.personId === personId)
          if (m && m.role !== 'owner') {
            m.role = role
            pushActivity(s, {
              kind: 'sharing',
              appId: s.spaces[spaceId].appId,
              spaceId,
              text: `You made ${s.people[personId]?.name ?? 'someone'} ${role === 'editor' ? 'an editor' : 'a viewer'}`,
              who: s.meId,
            })
          }
        }),

      removeMember: (spaceId, personId) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp) return
          sp.members = sp.members.filter((m) => m.personId !== personId)
          pushActivity(s, { kind: 'sharing', appId: sp.appId, spaceId, text: `You removed ${s.people[personId]?.name ?? 'someone'} from “${sp.name}”`, who: s.meId })
        }),

      transferOwnership: (spaceId, personId) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp) return
          sp.ownerId = personId
          sp.members.forEach((m) => {
            if (m.personId === personId) m.role = 'owner'
            else if (m.personId === s.meId) m.role = 'editor'
          })
          pushActivity(s, { kind: 'sharing', appId: sp.appId, spaceId, text: `You handed “${sp.name}” to ${s.people[personId]?.name}. They own its data now.`, who: s.meId })
        }),

      acceptInvite: (inviteId) => {
        const spaceId = uid('sp')
        let ok = false
        set((s) => {
          const inv = s.invites.find((i) => i.id === inviteId)
          if (!inv) return
          const app = s.apps[inv.appId]
          if (!s.installs[inv.appId]) {
            s.installs[inv.appId] = {
              appId: inv.appId,
              version: app.version,
              installedAt: now(),
              updatedAt: now(),
              autoUpdate: true,
              autoApproveData: false,
              notificationsOn: true,
              schema: JSON.parse(JSON.stringify(app.schema)),
              spaceIds: [],
              appliedMigrations: [],
            }
            app.installs += 1
            pushActivity(s, { kind: 'install', appId: inv.appId, text: `You installed ${app.name} (to join “${inv.spaceName}”)`, who: s.meId })
          }
          const space: Space = {
            id: spaceId,
            appId: inv.appId,
            name: inv.spaceName,
            emoji: inv.spaceEmoji,
            ownerId: inv.fromPersonId,
            members: [
              ...inv.memberIds.map((pid) => ({ personId: pid, role: (pid === inv.fromPersonId ? 'owner' : 'editor') as Role, joinedAt: inv.sentAt })),
              { personId: s.meId, role: inv.role, joinedAt: now() },
            ],
            pending: [],
            createdAt: inv.sentAt,
            tables: inv.tables,
            extraKb: 380,
          }
          s.spaces[spaceId] = space
          s.installs[inv.appId].spaceIds.push(spaceId)
          s.invites = s.invites.filter((i) => i.id !== inviteId)
          s.notifications.forEach((n) => {
            if (n.title.includes(inv.spaceName)) n.read = true
          })
          pushActivity(s, { kind: 'sharing', appId: inv.appId, spaceId, text: `You joined “${inv.spaceName}” as ${inv.role === 'editor' ? 'an editor' : 'a viewer'}`, who: s.meId })
          s.tour.invite = true
          ok = true
        })
        return ok ? spaceId : undefined
      },

      declineInvite: (inviteId) =>
        set((s) => {
          const inv = s.invites.find((i) => i.id === inviteId)
          s.invites = s.invites.filter((i) => i.id !== inviteId)
          if (inv) {
            s.notifications.forEach((n) => {
              if (n.title.includes(inv.spaceName)) n.read = true
            })
          }
        }),

      createBackup: (appId, note, kind = 'manual') => {
        const id = uid('bk')
        set((s) => {
          s.backups.unshift({ id, appId, createdAt: now(), sizeKb: sizeFor(s, appId), kind, note, snapshot: snapshotFor(s, appId) })
          pushActivity(s, { kind: 'backup', appId, text: `You made a backup${note ? `: “${note}”` : ''} of ${appId ? appName(s, appId) : 'everything'}`, who: s.meId })
        })
        return id
      },

      restoreBackup: (backupId, appId) =>
        set((s) => {
          const b = s.backups.find((b) => b.id === backupId)
          if (!b) return
          const seedTables = b.snapshot ? undefined : seedSpaceTables()
          const scope = appId ?? b.appId
          for (const inst of Object.values(s.installs)) {
            if (scope && inst.appId !== scope) continue
            for (const sid of inst.spaceIds) {
              const sp = s.spaces[sid]
              const saved = b.snapshot?.[sid] ?? seedTables?.[sid]
              if (!sp || !saved) continue
              for (const table of inst.schema) {
                if (saved[table.name]) sp.tables[table.name] = JSON.parse(JSON.stringify(saved[table.name]))
              }
            }
          }
          pushActivity(s, {
            kind: 'backup',
            appId: scope,
            text: `You restored ${scope ? appName(s, scope) : 'everything'} from a backup made ${new Date(b.createdAt).toLocaleDateString()}`,
            who: s.meId,
          })
          s.tour.restore = true
        }),

      deleteBackup: (backupId) =>
        set((s) => {
          s.backups = s.backups.filter((b) => b.id !== backupId)
        }),

      deleteRow: (spaceId, table, rowId) =>
        set((s) => {
          const sp = s.spaces[spaceId]
          if (!sp?.tables[table]) return
          sp.tables[table] = sp.tables[table].filter((r) => r.id !== rowId)
          pushActivity(s, { kind: 'write', appId: sp.appId, spaceId, text: `You deleted 1 row from ${table} (by hand, in the data browser)`, who: s.meId })
        }),

      logActivity: (e) => set((s) => pushActivity(s, e)),

      addReview: (appId, rating, text) =>
        set((s) => {
          const app = s.apps[appId]
          const me = s.people[s.meId]
          app.reviews = app.reviews.filter((r) => !r.mine)
          app.reviews.unshift({
            id: uid('rev'),
            authorName: me.name.split(' ')[0],
            authorEmoji: me.emoji,
            rating,
            text,
            date: now(),
            version: s.installs[appId]?.version,
            mine: true,
          })
          app.rating = Math.round(((app.rating * app.ratingCount + rating) / (app.ratingCount + 1)) * 10) / 10
          app.ratingCount += 1
        }),

      sendFeedback: (appId, text, includeName) =>
        set((s) => {
          const dev = s.devApps[appId]
          const inst = s.installs[appId]
          if (dev) {
            dev.bugReports.unshift({
              id: uid('bug'),
              at: now(),
              from: includeName ? `${s.people[s.meId].name.split(' ')[0]} (chose to share their name)` : 'Anonymous installer',
              text,
              version: inst?.version ?? s.apps[appId].version,
              status: 'new',
            })
          }
          pushActivity(s, { kind: 'export', appId, text: `You sent feedback to ${appName(s, appId)}’s maker (just your message, no data)`, who: s.meId })
        }),

      tipApp: (appId, cents) =>
        set((s) => {
          const dev = s.devApps[appId]
          if (dev) {
            dev.tipsCents += cents
            notify(s, { emoji: '💛', title: `Someone tipped ${'$' + (cents / 100).toFixed(0)} on ${appName(s, appId)}`, body: 'It was you. Still counts.', href: `/workshop/${appId}` })
          }
        }),

      markAllRead: () =>
        set((s) => {
          s.notifications.forEach((n) => (n.read = true))
        }),
      markRead: (id) =>
        set((s) => {
          const n = s.notifications.find((n) => n.id === id)
          if (n) n.read = true
        }),

      setPlan: (plan) =>
        set((s) => {
          s.plan = plan
          if (plan === 'free' && s.autoBackup === 'hourly') s.autoBackup = 'daily'
        }),
      setAutoBackup: (f) =>
        set((s) => {
          s.autoBackup = f
        }),
      updateProfile: (name, emoji) =>
        set((s) => {
          s.people[s.meId].name = name
          s.people[s.meId].emoji = emoji
          const dev = Object.values(s.developers).find((d) => d.isMe)
          if (dev) {
            dev.name = name
            dev.emoji = emoji
          }
        }),

      /* ---------------- Workshop ---------------- */

      createDevApp: (input) => {
        let id = slugify(input.name) || uid('app')
        set((s) => {
          let n = 2
          const base = id
          while (s.apps[id]) id = `${base}-${n++}`
          const devId = Object.values(s.developers).find((d) => d.isMe)!.id
          s.apps[id] = {
            id,
            name: input.name,
            emoji: input.emoji,
            color: input.color,
            tagline: input.tagline,
            description: input.tagline,
            category: input.category,
            developerId: devId,
            tags: [],
            rating: 0,
            ratingCount: 0,
            installs: 0,
            version: '0.0.0',
            updatedAt: now(),
            createdAt: now(),
            sizeKb: 0,
            permissions: ['storage', ...(input.supportsSpaces ? (['spaces', 'profile'] as const) : []), ...input.permissions.filter((p) => !['storage', 'spaces', 'profile'].includes(p))],
            network: [],
            supportsSpaces: input.supportsSpaces,
            maxMembers: input.supportsSpaces ? 10 : undefined,
            mock: 'list',
            changelog: [],
            schema: [],
            reviews: [],
            tipJar: true,
            published: false,
          }
          s.devApps[id] = {
            appId: id,
            status: 'draft',
            createdAt: now(),
            releases: [],
            migrations: [],
            publishableKey: `pk_test_${id.slice(0, 2)}_${randomHex(12)}`,
            collaborators: [{ name: `${s.people[s.meId].name} (you)`, emoji: s.people[s.meId].emoji, role: 'owner' }],
            tipsCents: 0,
            bugReports: [],
            betaTesters: 0,
          }
          s.tour.create = true
        })
        return id
      },

      updateListing: (appId, patch) =>
        set((s) => {
          Object.assign(s.apps[appId], patch)
        }),

      setDevStatus: (appId, status) =>
        set((s) => {
          s.devApps[appId].status = status
          s.apps[appId].published = status === 'live'
          if (status === 'live' && s.devApps[appId].publishableKey.startsWith('pk_test')) {
            s.devApps[appId].publishableKey = s.devApps[appId].publishableKey.replace('pk_test', 'pk_live')
          }
        }),

      deployRelease: (appId, input) => {
        const id = uid('rel')
        set((s) => {
          const dev = s.devApps[appId]
          const release: Release = {
            id,
            version: input.version,
            createdAt: now(),
            sizeKb: 180 + Math.round(Math.random() * 300),
            files: 9 + Math.round(Math.random() * 10),
            notes: input.notes,
            channel: input.channel,
            rolloutPct: input.rolloutPct ?? 100,
            migrationIds: input.migrationIds,
            commit: randomHex(7),
            source: input.source,
          }
          dev.releases.unshift(release)
          for (const m of dev.migrations) if (input.migrationIds.includes(m.id) && !m.releaseVersion) m.releaseVersion = input.version
          s.apps[appId].sizeKb = release.sizeKb
          if (input.channel === 'live') goLive(s, appId, id)
          if (input.migrationIds.length && input.channel === 'live') s.tour.ship = true
        })
        return id
      },

      promoteRelease: (appId, releaseId) =>
        set((s) => {
          const r = s.devApps[appId].releases.find((r) => r.id === releaseId)
          goLive(s, appId, releaseId)
          if (r?.migrationIds.length) s.tour.ship = true
        }),

      rollbackTo: (appId, releaseId) =>
        set((s) => {
          const dev = s.devApps[appId]
          const target = dev.releases.find((r) => r.id === releaseId)
          if (!target) return
          for (const r of dev.releases) if (r.channel === 'live') r.channel = 'archived'
          target.channel = 'live'
          target.rolloutPct = 100
          const app = s.apps[appId]
          app.version = target.version
          app.updatedAt = now()
          const inst = s.installs[appId]
          const pending = s.pendingUpdates[appId]
          if (pending && compareVersions(pending.toVersion, target.version) > 0) {
            delete s.pendingUpdates[appId]
            notify(s, { emoji: app.emoji, title: `${app.name} pulled its update`, body: `The developer rolled back to ${target.version}. Nothing changed in your data.` })
          }
          if (inst && compareVersions(inst.version, target.version) > 0) {
            inst.version = target.version
            inst.updatedAt = now()
            pushActivity(s, { kind: 'update', appId, text: `${app.name} was rolled back to ${target.version} by its developer. Your data wasn’t touched.`, who: 'cubby' })
          }
        }),

      setRollout: (appId, releaseId, pct) =>
        set((s) => {
          const r = s.devApps[appId].releases.find((r) => r.id === releaseId)
          if (r) r.rolloutPct = pct
        }),

      addMigration: (appId, input) => {
        const id = uid('mig')
        set((s) => {
          s.devApps[appId].migrations.push({
            id,
            createdAt: now(),
            stats: { applied: 0, pending: 0, failed: 0 },
            failures: [],
            ...input,
          })
        })
        return id
      },

      deleteMigration: (appId, migrationId) =>
        set((s) => {
          const dev = s.devApps[appId]
          dev.migrations = dev.migrations.filter((m) => m.id !== migrationId || m.releaseVersion)
        }),

      replyToReview: (appId, reviewId, text) =>
        set((s) => {
          const r = s.apps[appId].reviews.find((r) => r.id === reviewId)
          if (r) r.reply = { text, date: now() }
        }),

      setBugStatus: (appId, bugId, status) =>
        set((s) => {
          const b = s.devApps[appId].bugReports.find((b) => b.id === bugId)
          if (b) b.status = status
        }),

      addCollaborator: (appId, name) =>
        set((s) => {
          s.devApps[appId].collaborators.push({ name, emoji: ANIMALS[Math.floor(Math.random() * ANIMALS.length)], role: 'maintainer' })
        }),

      removeCollaborator: (appId, name) =>
        set((s) => {
          s.devApps[appId].collaborators = s.devApps[appId].collaborators.filter((c) => c.name !== name || c.role === 'owner')
        }),

      setNetwork: (appId, domains) =>
        set((s) => {
          s.apps[appId].network = domains
        }),

      deleteDevApp: (appId) =>
        set((s) => {
          if (s.apps[appId]?.installs > 0) return
          delete s.devApps[appId]
          delete s.apps[appId]
        }),
    })),
    {
      name: 'cubby-demo',
      version: SEED_VERSION,
      migrate: () => createSeed() as unknown as DemoState,
    },
  ),
)

export const useMe = () => useDemo((s) => s.people[s.meId])
