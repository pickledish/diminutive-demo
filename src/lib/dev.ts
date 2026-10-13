import type { AppListing, DevApp, TableSchema } from '@/types'
import { applyOpsToSchema } from './migrate'
import { compareVersions } from './utils'

/** Schema after every migration, including ones not live yet. New migrations are written against this. */
export function headSchema(app: AppListing, dev: DevApp): TableSchema[] {
  const shipped = new Set(dev.releases.filter((r) => r.channel === 'live' || r.channel === 'archived').flatMap((r) => r.migrationIds))
  return applyOpsToSchema(
    app.schema,
    dev.migrations.filter((m) => !shipped.has(m.id)).flatMap((m) => m.ops),
  )
}

export function nextMigrationPrefix(dev: DevApp) {
  const nums = dev.migrations.map((m) => parseInt(m.filename, 10)).filter((n) => !Number.isNaN(n))
  return String(Math.max(0, ...nums) + 1).padStart(4, '0')
}

export const liveRelease = (dev: DevApp) => dev.releases.find((r) => r.channel === 'live')

export const latestVersion = (dev: DevApp) => [...dev.releases].sort((a, b) => compareVersions(b.version, a.version))[0]?.version
