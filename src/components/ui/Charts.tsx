import { useState } from 'react'
import { cn } from '@/lib/utils'

export function BarChart({
  data,
  height = 160,
  barClass = 'bg-sky',
  format = (n: number) => n.toLocaleString('en-US'),
  labelEvery,
}: {
  data: { label: string; value: number; highlight?: boolean }[]
  height?: number
  barClass?: string
  format?: (n: number) => string
  labelEvery?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const every = labelEvery ?? Math.ceil(data.length / 6)
  const dense = data.length > 40
  return (
    <div>
      <div className="relative" style={{ height }}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t-2 border-dashed border-ink/10" />
          ))}
        </div>
        <div className={cn('relative flex h-full items-end', dense ? 'gap-[2px]' : 'gap-1.5')} onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div key={i} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
              <div
                className={cn(
                  'w-full rounded-t-[4px] border-ink transition-[filter]',
                  dense ? 'border-[1.5px]' : 'border-2',
                  d.highlight ? 'bg-bubblegum' : barClass,
                  hover === i && 'brightness-90',
                )}
                style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              />
              {hover === i && (
                <div className="brut-xs absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-bold text-paper">
                  {format(d.value)} <span className="font-normal text-paper/60">· {d.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={cn('mt-1.5 flex text-[11px] font-bold text-ink/50', dense ? 'gap-[2px]' : 'gap-1.5')}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 overflow-visible text-center whitespace-nowrap">
            {i % every === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ values, className, stroke = '#141414', fill = '#74b9ff' }: { values: number[]; className?: string; stroke?: string; fill?: string }) {
  if (!values.length) return null
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${30 - (v / max) * 26 - 2}`)
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn('h-10 w-full', className)}>
      <polygon points={`0,30 ${pts.join(' ')} 100,30`} fill={fill} opacity={0.5} />
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

const segClasses = ['bg-mint', 'bg-sky', 'bg-grape', 'bg-tangerine', 'bg-bubblegum', 'bg-sun']

export function StackedBar({ parts, className }: { parts: { label: string; value: number; className?: string }[]; className?: string }) {
  const total = Math.max(1, parts.reduce((n, p) => n + p.value, 0))
  return (
    <div className={className}>
      <div className="flex h-9 overflow-hidden rounded-xl border-2 border-ink bg-white">
        {parts.map((p, i) =>
          p.value > 0 ? (
            <div
              key={p.label}
              title={`${p.label}: ${Math.round((p.value / total) * 100)}%`}
              className={cn('flex h-full items-center justify-center overflow-hidden border-r-2 border-ink text-xs font-extrabold last:border-r-0', p.className ?? segClasses[i % segClasses.length])}
              style={{ width: `${(p.value / total) * 100}%` }}
            >
              {(p.value / total) * 100 > 9 && `${Math.round((p.value / total) * 100)}%`}
            </div>
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5 text-xs font-bold">
            <span className={cn('size-3 rounded-sm border-2 border-ink', p.className ?? segClasses[i % segClasses.length])} />
            {p.label}
            <span className="text-ink/50">{Math.round((p.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HBar({ label, value, max, className, right }: { label: string; value: number; max: number; className?: string; right?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-28 shrink-0 truncate font-mono text-xs font-bold">{label}</div>
      <div className="h-5 flex-1 overflow-hidden rounded-md border-2 border-ink bg-white">
        <div className={cn('h-full border-r-2 border-ink', className ?? 'bg-sky')} style={{ width: `${Math.max(2, (value / Math.max(max, 1)) * 100)}%` }} />
      </div>
      <div className="w-14 shrink-0 text-right text-xs font-bold text-ink/70">{right ?? value.toLocaleString('en-US')}</div>
    </div>
  )
}
