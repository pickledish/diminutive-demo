import { clsx, type ClassValue } from 'clsx'

export const cn = (...classes: ClassValue[]) => clsx(classes)

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
export const minutesAgo = (n: number) => ago(n * MINUTE)
export const hoursAgo = (n: number) => ago(n * HOUR)
export const daysAgo = (n: number) => ago(n * DAY)
export const daysFromNow = (n: number) => new Date(Date.now() + n * DAY).toISOString()
export const now = () => new Date().toISOString()

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) {
    const ahead = -diff
    if (ahead < HOUR) return `in ${Math.max(1, Math.round(ahead / MINUTE))} min`
    if (ahead < DAY) return `in ${Math.round(ahead / HOUR)}h`
    return `in ${Math.round(ahead / DAY)} days`
  }
  if (diff < 45_000) return 'just now'
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MINUTE))} min ago`
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`
  const days = Math.round(diff / DAY)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} mo ago`
  return `${Math.round(months / 12)}y ago`
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', opts)
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatKb(kb: number) {
  if (kb < 1) return `${Math.round(kb * 1024)} B`
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
  const gb = mb / 1024
  return `${gb < 10 ? gb.toFixed(1) : Math.round(gb)} GB`
}

export function compact(n: number) {
  if (n < 1000) return `${n}`
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export const number = (n: number) => n.toLocaleString('en-US')

export const money = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 === 0 ? 0 : 2 })

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${number(n)} ${n === 1 ? word : pluralWord}`

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function parseVersion(v: string) {
  const [core, pre] = v.split('-')
  const [major = 0, minor = 0, patch = 0] = core.split('.').map((x) => parseInt(x, 10) || 0)
  return { major, minor, patch, pre }
}

export function compareVersions(a: string, b: string) {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  if (va.major !== vb.major) return va.major - vb.major
  if (va.minor !== vb.minor) return va.minor - vb.minor
  if (va.patch !== vb.patch) return va.patch - vb.patch
  if (va.pre && !vb.pre) return -1
  if (!va.pre && vb.pre) return 1
  return (va.pre ?? '').localeCompare(vb.pre ?? '')
}

export function bumpVersion(v: string, kind: 'major' | 'minor' | 'patch') {
  const { major, minor, patch } = parseVersion(v)
  if (kind === 'major') return `${major + 1}.0.0`
  if (kind === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

export function downloadFile(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCsv(columns: string[], rows: Record<string, unknown>[]) {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.join(','), ...rows.map((r) => columns.map((c) => escape(r[c])).join(','))].join('\n')
}

export function copyText(text: string) {
  return navigator.clipboard?.writeText(text).catch(() => undefined)
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function randomHex(len: number) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}
