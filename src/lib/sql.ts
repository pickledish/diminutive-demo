import type { Column, ColumnType, MigrationOp, TableSchema } from '@/types'

export interface LintCheck {
  level: 'ok' | 'warn' | 'danger'
  text: string
  /** Would fail on real installs, so the migration can't be saved. */
  blocking?: boolean
}

export interface LintResult {
  ops: MigrationOp[]
  checks: LintCheck[]
  destructive: boolean
  reversible: boolean
  statements: number
}

function mapType(raw: string): ColumnType {
  const t = raw.toLowerCase()
  if (t.includes('user')) return 'user'
  if (t.startsWith('uuid')) return 'uuid'
  if (/^(int|integer|bigint|smallint|serial)/.test(t)) return 'int'
  if (/^(real|float|double|numeric|decimal)/.test(t)) return 'real'
  if (/^bool/.test(t)) return 'bool'
  if (/^(timestamp|timestamptz|datetime)/.test(t)) return 'timestamp'
  if (/^date/.test(t)) return 'date'
  if (/^json/.test(t)) return 'json'
  return 'text'
}

function parseColumn(def: string): Column | null {
  const m = def.trim().match(/^"?(\w+)"?\s+([\w()]+)(.*)$/i)
  if (!m) return null
  const [, name, type, rest] = m
  if (/^(primary|foreign|unique|constraint|check)$/i.test(name)) return null
  const col: Column = { name, type: mapType(type) }
  if (/primary\s+key/i.test(rest)) col.pk = true
  if (!/not\s+null/i.test(rest) && !col.pk) col.nullable = true
  const ref = rest.match(/references\s+"?(\w+)"?/i)
  if (ref) col.ref = ref[1]
  const def2 = rest.match(/default\s+('[^']*'|[\w.()]+)/i)
  if (def2) col.default = def2[1]
  return col
}

function splitTopLevel(s: string) {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts
}

export function lintSql(sql: string, schema: TableSchema[] = []): LintResult {
  const cleaned = sql.replace(/--.*$/gm, '').trim()
  const statements = cleaned
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  const ops: MigrationOp[] = []
  const checks: LintCheck[] = []
  let destructive = false
  let reversible = true
  const tables = new Set(schema.map((t) => t.name))

  for (const stmt of statements) {
    const s = stmt.replace(/\s+/g, ' ')
    let m: RegExpMatchArray | null

    if ((m = s.match(/^create table (?:if not exists )?"?(\w+)"? ?\((.*)\)$/i))) {
      const [, name, body] = m
      const columns = splitTopLevel(body)
        .map(parseColumn)
        .filter((c): c is Column => !!c)
      ops.push({ op: 'addTable', table: { name, columns } })
      checks.push({ level: 'ok', text: `Creates a new table “${name}” with ${columns.length} columns. Existing data is untouched.` })
      tables.add(name)
      continue
    }

    if ((m = s.match(/^alter table "?(\w+)"? add (?:column )?(?:if not exists )?(.*)$/i))) {
      const [, table, def] = m
      const column = parseColumn(def)
      if (column) {
        ops.push({ op: 'addColumn', table, column })
        if (!tables.has(table) && schema.length) {
          checks.push({ level: 'danger', blocking: true, text: `Table “${table}” doesn't exist in the current schema.` })
        } else if (!column.nullable && !column.default) {
          checks.push({
            level: 'danger',
            blocking: true,
            text: `“${table}.${column.name}” is NOT NULL with no default. This will fail on every install that already has rows. Add a DEFAULT.`,
          })
        } else {
          checks.push({ level: 'ok', text: `Adds “${table}.${column.name}”. Safe for existing rows.` })
        }
      }
      continue
    }

    if ((m = s.match(/^alter table "?(\w+)"? drop (?:column )?(?:if exists )?"?(\w+)"?/i))) {
      const [, table, column] = m
      ops.push({ op: 'dropColumn', table, column })
      destructive = true
      reversible = false
      checks.push({
        level: 'danger',
        text: `Drops “${table}.${column}”. That data is gone for good. Users will see a red warning and must approve explicitly.`,
      })
      continue
    }

    if ((m = s.match(/^alter table "?(\w+)"? rename column "?(\w+)"? to "?(\w+)"?/i))) {
      const [, table, from, to] = m
      ops.push({ op: 'renameColumn', table, from, to })
      checks.push({
        level: 'warn',
        text: `Renames “${table}.${from}” → “${to}”. Older app versions (and beta testers) reading “${from}” will break.`,
      })
      continue
    }

    if ((m = s.match(/^drop table (?:if exists )?"?(\w+)"?/i))) {
      ops.push({ op: 'dropTable', table: m[1] })
      destructive = true
      reversible = false
      checks.push({ level: 'danger', text: `Drops the whole “${m[1]}” table. Users will be warned and must approve explicitly.` })
      continue
    }

    if (/^create (unique )?index/i.test(s)) {
      checks.push({ level: 'ok', text: 'Adds an index. Faster reads, no data changes.' })
      if (/^create unique/i.test(s)) {
        checks.push({ level: 'warn', text: 'Unique indexes fail on installs that already contain duplicates. Diminutive will roll those back automatically.' })
      }
      continue
    }

    if (/^update /i.test(s)) {
      checks.push({ level: 'warn', text: 'Rewrites existing rows. Make sure it is idempotent; it may run more than once on retry.' })
      reversible = false
      continue
    }

    if (/^delete /i.test(s)) {
      destructive = true
      reversible = false
      checks.push({ level: 'danger', text: 'Deletes rows from users’ data. Users will see a red warning.' })
      continue
    }

    checks.push({ level: 'warn', text: `Diminutive couldn't fully understand: “${s.slice(0, 60)}${s.length > 60 ? '…' : ''}”. It'll still run, but test it with a dry run.` })
  }

  if (!statements.length) checks.push({ level: 'warn', text: 'No SQL statements yet.' })

  return { ops, checks, destructive, reversible, statements: statements.length }
}

export function describeOps(ops: MigrationOp[]): string[] {
  return ops.map((o) => {
    switch (o.op) {
      case 'addColumn':
        return `Adds a “${o.column.name}” field to ${o.table}`
      case 'addTable':
        return `Adds a new “${o.table.name}” table`
      case 'dropColumn':
        return `Removes the “${o.column}” field from ${o.table} (permanently)`
      case 'dropTable':
        return `Removes the “${o.table}” table (permanently)`
      case 'renameColumn':
        return `Renames ${o.table}.${o.from} to “${o.to}”`
    }
  })
}
