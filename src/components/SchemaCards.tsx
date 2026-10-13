import type { ColorKey, TableSchema } from '@/types'
import { bgSoft } from '@/lib/colors'
import { cn } from '@/lib/utils'

export function SchemaCards({ schema, color = 'sun', highlight = [], stacked }: { schema: TableSchema[]; color?: ColorKey; highlight?: string[]; stacked?: boolean }) {
  if (!schema.length) return <p className="text-sm text-ink/60">No tables yet. Write your first migration to create some.</p>
  return (
    <div className={cn('grid gap-3', !stacked && 'sm:grid-cols-2 xl:grid-cols-3')}>
      {schema.map((t) => (
        <div key={t.name} className="overflow-hidden rounded-xl border-2 border-ink bg-white">
          <div className={cn('flex items-center justify-between gap-2 border-b-2 border-ink px-3 py-2', bgSoft[color])}>
            <span className="font-mono text-sm font-extrabold">{t.name}</span>
            <span className="text-xs font-bold text-ink/55">{t.columns.length} cols</span>
          </div>
          <div className="divide-y divide-ink/10">
            {t.columns.map((c) => (
              <div key={c.name} className={cn('flex items-center justify-between gap-2 px-3 py-1 font-mono text-xs', highlight.includes(`${t.name}.${c.name}`) && 'bg-sun/50')}>
                <span className="font-bold">
                  {c.pk && '🔑 '}
                  {c.name}
                </span>
                <span className="text-ink/45">
                  {c.type === 'user' ? 'cubby_user' : c.type}
                  {c.ref && ` → ${c.ref}`}
                  {c.nullable ? '?' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
