import type { AppListing, MockKind } from '@/types'
import { bg, bgSoft } from '@/lib/colors'
import { cn, hashString, mulberry32 } from '@/lib/utils'

const widths = (seed: string, n: number) => {
  const r = mulberry32(hashString(seed))
  return Array.from({ length: n }, () => 35 + Math.round(r() * 55))
}

function Bar({ w, className }: { w: number; className?: string }) {
  return <div className={cn('h-2 rounded-full bg-ink/15', className)} style={{ width: `${w}%` }} />
}

function ListMock({ app, labels, dense }: { app: AppListing; labels?: string[]; dense?: boolean }) {
  const w = widths(app.id + 'list', 7)
  const items = labels?.length ? labels.slice(0, dense ? 5 : 7) : w.slice(0, dense ? 5 : 7).map(() => '')
  return (
    <div className="flex flex-col gap-2">
      {items.map((label, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-2 py-1.5">
          <div className={cn('size-4 shrink-0 rounded-md border-2 border-ink', i % 3 === 2 && bg[app.color])} />
          {label ? (
            <span className={cn('truncate text-xs font-bold', i % 3 === 2 && 'text-ink/40 line-through')}>{label}</span>
          ) : (
            <Bar w={w[i % w.length]} />
          )}
          <div className="ml-auto size-4 shrink-0 rounded-full border-2 border-ink bg-ink/10" />
        </div>
      ))}
    </div>
  )
}

function GridMock({ app, labels }: { app: AppListing; labels?: string[] }) {
  const w = widths(app.id + 'grid', 6)
  return (
    <div className="grid grid-cols-3 gap-2">
      {w.map((x, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-ink bg-white p-2">
          <div className={cn('flex aspect-square w-full items-center justify-center rounded-md border-2 border-ink text-xl', i % 2 ? bgSoft[app.color] : bg[app.color])}>
            {i === 0 ? app.emoji : ''}
          </div>
          {labels?.[i] ? <span className="w-full truncate text-center text-[10px] font-bold">{labels[i]}</span> : <Bar w={x} />}
        </div>
      ))}
    </div>
  )
}

function ChartMock({ app }: { app: AppListing }) {
  const w = widths(app.id + 'chart', 8)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 rounded-lg border-2 border-ink bg-white p-2">
            <Bar w={50} className="h-1.5" />
            <div className="mt-1.5 font-display text-lg font-extrabold leading-none">{i ? '12' : '$84'}</div>
          </div>
        ))}
      </div>
      <div className="flex h-24 items-end gap-1.5 rounded-lg border-2 border-ink bg-white p-2">
        {w.map((x, i) => (
          <div key={i} className={cn('flex-1 rounded-t-sm border-2 border-ink', i === 5 ? 'bg-bubblegum' : bg[app.color])} style={{ height: `${x}%` }} />
        ))}
      </div>
    </div>
  )
}

function BoardMock({ app, labels }: { app: AppListing; labels?: string[] }) {
  const w = widths(app.id + 'board', 9)
  return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((c) => (
        <div key={c} className={cn('flex flex-col gap-1.5 rounded-lg border-2 border-ink p-1.5', bgSoft[app.color])}>
          <Bar w={60} className="h-1.5 bg-ink/30" />
          {[0, 1, 2].slice(0, 3 - (c % 2)).map((r) => (
            <div key={r} className="rounded-md border-2 border-ink bg-white p-1.5">
              {labels?.[c * 3 + r] ? <div className="truncate text-[10px] font-bold">{labels[c * 3 + r]}</div> : <Bar w={w[c * 3 + r]} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function JournalMock({ app }: { app: AppListing }) {
  const r = mulberry32(hashString(app.id + 'journal'))
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1 rounded-lg border-2 border-ink bg-white p-2">
        {Array.from({ length: 28 }, (_, i) => {
          const v = r()
          return <div key={i} className={cn('aspect-square rounded-[4px] border-[1.5px] border-ink', v > 0.66 ? bg[app.color] : v > 0.33 ? bgSoft[app.color] : 'bg-white')} />
        })}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border-2 border-ink bg-white p-2">
          <Bar w={30} className="mb-1.5 h-1.5 bg-ink/30" />
          <Bar w={85} />
        </div>
      ))}
    </div>
  )
}

export function AppMock({ app, kind, labels, className, caption, compact }: { app: AppListing; kind?: MockKind; labels?: string[]; className?: string; caption?: string; compact?: boolean }) {
  const k = kind ?? app.mock
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-paper', className)}>
      <div className={cn('flex items-center gap-2 border-b-[3px] border-ink px-3 py-2', bg[app.color])}>
        <span className="text-lg leading-none">{app.emoji}</span>
        <span className="truncate font-display text-sm font-extrabold">{app.name}</span>
        <div className="ml-auto flex gap-1">
          <span className="size-2.5 rounded-full border-2 border-ink bg-white" />
          <span className="size-2.5 rounded-full border-2 border-ink bg-white" />
        </div>
      </div>
      <div className={cn('flex-1 dots', compact ? 'p-2.5' : 'p-3')}>
        {k === 'list' && <ListMock app={app} labels={labels} dense={compact} />}
        {k === 'grid' && <GridMock app={app} labels={labels} />}
        {k === 'chart' && <ChartMock app={app} />}
        {k === 'board' && <BoardMock app={app} labels={labels} />}
        {k === 'journal' && <JournalMock app={app} />}
      </div>
      {caption && <div className="border-t-[3px] border-ink bg-white px-3 py-2 text-xs font-bold">{caption}</div>}
    </div>
  )
}
