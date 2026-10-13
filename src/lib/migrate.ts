import type { MigrationOp, Tables, TableSchema } from '@/types'

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

export function applyOpsToSchema(schema: TableSchema[], ops: MigrationOp[]): TableSchema[] {
  let next = clone(schema)
  for (const o of ops) {
    switch (o.op) {
      case 'addTable':
        if (!next.some((t) => t.name === o.table.name)) next.push(clone(o.table))
        break
      case 'dropTable':
        next = next.filter((t) => t.name !== o.table)
        break
      case 'addColumn': {
        const t = next.find((t) => t.name === o.table)
        if (t && !t.columns.some((c) => c.name === o.column.name)) t.columns.push(clone(o.column))
        break
      }
      case 'dropColumn': {
        const t = next.find((t) => t.name === o.table)
        if (t) t.columns = t.columns.filter((c) => c.name !== o.column)
        break
      }
      case 'renameColumn': {
        const t = next.find((t) => t.name === o.table)
        const c = t?.columns.find((c) => c.name === o.from)
        if (c) c.name = o.to
        break
      }
    }
  }
  return next
}

export function applyOpsToTables(tables: Tables, ops: MigrationOp[]): Tables {
  const next = clone(tables)
  for (const o of ops) {
    switch (o.op) {
      case 'addTable':
        if (!next[o.table.name]) next[o.table.name] = []
        break
      case 'dropTable':
        delete next[o.table]
        break
      case 'addColumn': {
        const rows = next[o.table]
        if (!rows) break
        rows.forEach((r, i) => {
          if (r[o.column.name] !== undefined) return
          if (o.fill?.length) r[o.column.name] = o.fill[i % o.fill.length]
          else if (o.column.default !== undefined) {
            const d = o.column.default.replace(/^'|'$/g, '')
            r[o.column.name] =
              d === 'true' ? true : d === 'false' ? false : /^-?\d+(\.\d+)?$/.test(d) ? Number(d) : /now\(\)/i.test(d) ? new Date().toISOString() : d
          } else r[o.column.name] = null
        })
        break
      }
      case 'dropColumn':
        next[o.table]?.forEach((r) => delete r[o.column])
        break
      case 'renameColumn':
        next[o.table]?.forEach((r) => {
          r[o.to] = r[o.from]
          delete r[o.from]
        })
        break
    }
  }
  return next
}
