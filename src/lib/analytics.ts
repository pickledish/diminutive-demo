import type { AppListing, DevApp } from '@/types'
import { compareVersions, hashString, mulberry32 } from './utils'

export interface DayPoint {
  date: string
  installs: number
  uninstalls: number
  opens: number
}

export interface Analytics {
  series: DayPoint[]
  totals: {
    installs: number
    active7: number
    newInRange: number
    uninstallsInRange: number
    sharedSpaces: number
    avgMembers: number
    medianKb: number
    p90Kb: number
    errorsPer1k: number
    opensPerDay: number
  }
  retention: { d1: number; d7: number; d30: number }
  versions: { version: string; pct: number }[]
  tables: { name: string; reads: number; writes: number }[]
}

const DAY = 86_400_000

export function getAnalytics(app: AppListing, dev: DevApp, rangeDays: number): Analytics {
  const rnd = mulberry32(hashString(app.id))
  const total = app.installs
  const ageDays = Math.max(1, Math.round((Date.now() - new Date(app.createdAt).getTime()) / DAY))
  const releaseDays = new Set(
    dev.releases.filter((r) => r.channel !== 'preview').map((r) => Math.floor((Date.now() - new Date(r.createdAt).getTime()) / DAY)),
  )

  const series: DayPoint[] = []
  const base = total / Math.min(ageDays, 365)
  for (let i = 89; i >= 0; i--) {
    const growth = 0.7 + ((90 - i) / 90) * 0.6
    const weekend = [0, 6].includes(new Date(Date.now() - i * DAY).getDay()) ? 1.35 : 1
    const spike = releaseDays.has(i) ? 1.9 : releaseDays.has(i + 1) ? 1.4 : 1
    const installs = total === 0 || i > ageDays ? 0 : Math.round(base * growth * weekend * spike * (0.55 + rnd() * 0.9))
    const uninstalls = Math.round(installs * (0.05 + rnd() * 0.1))
    const opens = total === 0 ? 0 : Math.round(total * 0.42 * weekend * (0.85 + rnd() * 0.3))
    series.push({ date: new Date(Date.now() - i * DAY).toISOString().slice(0, 10), installs, uninstalls, opens })
  }
  const ranged = series.slice(-rangeDays)

  const live = dev.releases.filter((r) => r.channel === 'live' || r.channel === 'archived').sort((a, b) => compareVersions(b.version, a.version))
  let versions: { version: string; pct: number }[] = []
  if (live.length === 1) versions = [{ version: live[0].version, pct: 100 }]
  else if (live.length > 1) {
    const current = dev.releases.find((r) => r.channel === 'live') ?? live[0]
    const pendingMig = dev.migrations.find((m) => current.migrationIds.includes(m.id) && m.stats.pending > 0)
    const top = pendingMig ? Math.round((pendingMig.stats.applied / Math.max(1, pendingMig.stats.applied + pendingMig.stats.pending + pendingMig.stats.failed)) * 100) : 81
    const prev = live.find((r) => compareVersions(r.version, current.version) < 0)
    const rest = Math.max(0, 100 - top)
    versions = [
      { version: current.version, pct: top },
      ...(prev ? [{ version: prev.version, pct: Math.round(rest * 0.85) }] : []),
      { version: 'older', pct: rest - (prev ? Math.round(rest * 0.85) : 0) },
    ].filter((v) => v.pct > 0)
  }

  const tables = app.schema.map((t, i) => {
    const w = 1 / (i + 1)
    return { name: t.name, reads: Math.round(total * 9 * w * (0.6 + rnd() * 0.8)), writes: Math.round(total * 1.6 * w * (0.4 + rnd() * 0.8)) }
  })

  return {
    series: ranged,
    totals: {
      installs: total,
      active7: Math.round(total * (0.55 + rnd() * 0.15)),
      newInRange: ranged.reduce((n, d) => n + d.installs, 0),
      uninstallsInRange: ranged.reduce((n, d) => n + d.uninstalls, 0),
      sharedSpaces: app.supportsSpaces ? Math.round(total * (0.3 + rnd() * 0.2)) : 0,
      avgMembers: app.supportsSpaces ? Math.round((2.6 + rnd() * 1.6) * 10) / 10 : 1,
      medianKb: Math.round(30 + rnd() * 170),
      p90Kb: Math.round(400 + rnd() * 2200),
      errorsPer1k: Math.round((0.3 + rnd() * 1.8) * 10) / 10,
      opensPerDay: ranged.length ? Math.round(ranged.reduce((n, d) => n + d.opens, 0) / ranged.length) : 0,
    },
    retention: { d1: Math.round(76 + rnd() * 14), d7: Math.round(55 + rnd() * 15), d30: Math.round(40 + rnd() * 15) },
    versions,
    tables,
  }
}

export const kAnon = (n: number) => (n > 0 && n < 10 ? '<10' : n.toLocaleString('en-US'))
