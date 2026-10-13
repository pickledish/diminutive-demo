import type { Install, Role, Space } from '@/types'

export const spaceRowCount = (sp: Space) => Object.values(sp.tables).reduce((n, rows) => n + rows.length, 0)

export const spaceKb = (sp: Space) => 12 + spaceRowCount(sp) * 0.45 + sp.extraKb

interface StorageInput {
  installs: Record<string, Install>
  spaces: Record<string, Space>
}

export function appKb(s: StorageInput, appId: string) {
  const inst = s.installs[appId]
  if (!inst) return 0
  return inst.spaceIds.reduce((kb, sid) => kb + (s.spaces[sid] ? spaceKb(s.spaces[sid]) : 0), 0)
}

export function totalKb(s: StorageInput) {
  return Object.keys(s.installs).reduce((kb, id) => kb + appKb(s, id), 0)
}

export function myRole(sp: Space, meId: string): Role | undefined {
  return sp.members.find((m) => m.personId === meId)?.role
}

export const isShared = (sp: Space) => sp.members.length > 1 || sp.pending.length > 0

export function spacesFor(s: StorageInput, appId: string): Space[] {
  const inst = s.installs[appId]
  if (!inst) return []
  return inst.spaceIds.map((id) => s.spaces[id]).filter(Boolean)
}
