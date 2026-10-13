export type ColorKey =
  | 'sun'
  | 'bubblegum'
  | 'sky'
  | 'mint'
  | 'tangerine'
  | 'grape'
  | 'cherry'
  | 'lime'

export type Category =
  | 'household'
  | 'family'
  | 'friends'
  | 'money'
  | 'health'
  | 'hobbies'
  | 'games'
  | 'work'

export interface Person {
  id: string
  name: string
  emoji: string
  color: ColorKey
  email: string
}

export interface Developer {
  id: string
  name: string
  handle: string
  emoji: string
  color: ColorKey
  bio: string
  isMe?: boolean
  joinedAt: string
}

export type ColumnType = 'uuid' | 'text' | 'int' | 'real' | 'bool' | 'timestamp' | 'date' | 'json' | 'user'

export interface Column {
  name: string
  type: ColumnType
  nullable?: boolean
  pk?: boolean
  ref?: string
  default?: string
}

export interface TableSchema {
  name: string
  description?: string
  columns: Column[]
}

export type PermissionKey =
  | 'storage'
  | 'spaces'
  | 'profile'
  | 'notifications'
  | 'files'
  | 'location'
  | 'camera'

export interface ChangelogEntry {
  version: string
  date: string
  notes: string
  dataSummary?: string[]
}

export interface Review {
  id: string
  authorName: string
  authorEmoji: string
  rating: number
  text: string
  date: string
  version?: string
  reply?: { text: string; date: string }
  mine?: boolean
}

export type MockKind = 'list' | 'grid' | 'chart' | 'board' | 'journal'

export interface AppListing {
  id: string
  name: string
  emoji: string
  color: ColorKey
  tagline: string
  description: string
  category: Category
  developerId: string
  tags: string[]
  rating: number
  ratingCount: number
  installs: number
  version: string
  updatedAt: string
  createdAt: string
  sizeKb: number
  permissions: PermissionKey[]
  network: string[]
  supportsSpaces: boolean
  maxMembers?: number
  staffPick?: boolean
  mock: MockKind
  changelog: ChangelogEntry[]
  schema: TableSchema[]
  reviews: Review[]
  tipJar: boolean
  published: boolean
}

export type Role = 'owner' | 'editor' | 'viewer'

export type Cell = string | number | boolean | null
export type Row = { id: string; [column: string]: Cell }
export type Tables = Record<string, Row[]>

export interface Member {
  personId: string
  role: Role
  joinedAt: string
}

export interface PendingInvite {
  id: string
  label: string
  role: Role
  sentAt: string
}

export interface Space {
  id: string
  appId: string
  name: string
  emoji: string
  ownerId: string
  members: Member[]
  pending: PendingInvite[]
  createdAt: string
  tables: Tables
  extraKb: number
}

export interface Install {
  appId: string
  version: string
  installedAt: string
  updatedAt: string
  lastOpenedAt?: string
  autoUpdate: boolean
  autoApproveData: boolean
  notificationsOn: boolean
  schema: TableSchema[]
  spaceIds: string[]
  appliedMigrations: string[]
}

export interface Invite {
  id: string
  appId: string
  fromPersonId: string
  spaceName: string
  spaceEmoji: string
  role: Role
  sentAt: string
  memberIds: string[]
  message?: string
  tables: Tables
}

export type BackupKind = 'auto' | 'manual' | 'pre-update'

export interface Backup {
  id: string
  appId?: string
  createdAt: string
  sizeKb: number
  kind: BackupKind
  note?: string
  snapshot?: Record<string, Tables>
}

export type ActivityKind = 'read' | 'write' | 'schema' | 'sharing' | 'update' | 'backup' | 'install' | 'export'

export interface ActivityEvent {
  id: string
  appId?: string
  spaceId?: string
  at: string
  kind: ActivityKind
  text: string
  who?: string
}

export type MigrationOp =
  | { op: 'addColumn'; table: string; column: Column; fill?: Cell[] }
  | { op: 'addTable'; table: TableSchema }
  | { op: 'dropColumn'; table: string; column: string }
  | { op: 'dropTable'; table: string }
  | { op: 'renameColumn'; table: string; from: string; to: string }

export interface PendingUpdate {
  appId: string
  fromVersion: string
  toVersion: string
  notes: string
  dataSummary: string[]
  ops: MigrationOp[]
  migrationIds: string[]
  destructive: boolean
  releasedAt: string
  snoozed?: boolean
}

export interface AppNotification {
  id: string
  at: string
  emoji: string
  title: string
  body?: string
  href?: string
  read: boolean
}

export type Channel = 'live' | 'beta' | 'preview' | 'archived'

export interface Release {
  id: string
  version: string
  createdAt: string
  sizeKb: number
  files: number
  notes: string
  channel: Channel
  rolloutPct: number
  migrationIds: string[]
  commit: string
  source: 'cli' | 'web' | 'github'
}

export interface MigrationFailure {
  code: string
  message: string
  count: number
  resolution: string
}

export interface Migration {
  id: string
  filename: string
  createdAt: string
  sql: string
  summary: string[]
  destructive: boolean
  reversible: boolean
  ops: MigrationOp[]
  releaseVersion?: string
  stats: { applied: number; pending: number; failed: number }
  failures: MigrationFailure[]
}

export interface BugReport {
  id: string
  at: string
  from: string
  text: string
  version: string
  status: 'new' | 'seen' | 'fixed'
}

export interface Collaborator {
  name: string
  emoji: string
  role: 'owner' | 'maintainer'
}

export interface DevApp {
  appId: string
  status: 'draft' | 'live' | 'unlisted'
  createdAt: string
  releases: Release[]
  migrations: Migration[]
  publishableKey: string
  collaborators: Collaborator[]
  tipsCents: number
  bugReports: BugReport[]
  betaTesters: number
}

export interface TrashedInstall {
  install: Install
  deletedAt: string
  purgeAt: string
}

export type TourStep =
  | 'update'
  | 'peek'
  | 'invite'
  | 'install'
  | 'restore'
  | 'ship'
  | 'create'
