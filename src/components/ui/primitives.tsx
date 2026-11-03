import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'pink' | 'blue' | 'mint' | 'white' | 'dark' | 'danger' | 'ghost' | 'grape'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent',
  pink: 'bg-bubblegum',
  blue: 'bg-sky',
  mint: 'bg-mint',
  grape: 'bg-grape',
  white: 'bg-white',
  dark: 'bg-ink text-paper',
  danger: 'bg-cherry',
  ghost: 'border-transparent! shadow-none! bg-transparent hover:bg-ink/8 active:translate-0!',
}

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-8.5 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10.5 px-4 text-[15px] rounded-xl gap-2',
  lg: 'h-13 px-6 text-lg rounded-xl gap-2.5',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'brut-sm press inline-flex select-none items-center justify-center whitespace-nowrap font-bold leading-none disabled:pointer-events-none disabled:opacity-45',
    variants[variant],
    sizes[size],
    className,
  )

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant, size, className, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />
))
Button.displayName = 'Button'

export function LinkButton({ variant, size, className, ...props }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

export function Card({ className, children, as: As = 'div', ...rest }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <As className={cn('brut rounded-2xl bg-white', className)} {...rest}>
      {children}
    </As>
  )
}

export function CardHeader({ title, subtitle, action, className, emoji }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string; emoji?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b-[3px] border-ink px-5 py-3.5', className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-lg font-extrabold leading-tight">
          {emoji && <span>{emoji}</span>}
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink/65">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

const badgeTones = {
  default: 'bg-white',
  white: 'bg-white',
  sun: 'bg-sun',
  accent: 'bg-accent',
  pink: 'bg-bubblegum',
  blue: 'bg-sky',
  sky: 'bg-sky',
  mint: 'bg-mint',
  grape: 'bg-grape',
  cherry: 'bg-cherry',
  lime: 'bg-lime',
  tangerine: 'bg-tangerine',
  dark: 'bg-ink text-paper',
  muted: 'bg-ink/5 border-ink/25! text-ink/70',
} as const

export type BadgeTone = keyof typeof badgeTones

export function Badge({ tone = 'default', className, children, title }: { tone?: BadgeTone; className?: string; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold leading-tight',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Sticker({ tone = 'sun', rotate = -3, className, children }: { tone?: BadgeTone; rotate?: number; className?: string; children: ReactNode }) {
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn('brut-xs inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-display text-xs font-extrabold uppercase tracking-wide', badgeTones[tone], className)}
    >
      {children}
    </span>
  )
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border-2 border-ink transition-colors disabled:opacity-40',
        size === 'md' ? 'h-7 w-12' : 'h-6 w-10',
        checked ? 'bg-mint' : 'bg-ink/10',
      )}
    >
      <span
        className={cn(
          'absolute rounded-full border-2 border-ink bg-white shadow-brut-xs transition-all',
          size === 'md' ? 'size-5' : 'size-4',
          checked ? (size === 'md' ? 'left-[22px]' : 'left-[18px]') : 'left-0.5',
        )}
      />
    </button>
  )
}

const fieldBase =
  'w-full rounded-xl border-2 border-ink bg-white px-3 font-medium outline-none transition-shadow placeholder:text-ink/35 focus:shadow-brut-sm disabled:bg-ink/5 disabled:text-ink/50'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, 'h-10.5', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, 'py-2.5', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        fieldBase,
        "h-10.5 cursor-pointer appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23141414' stroke-width='2.5' fill='none'/%3E%3C/svg%3E\")] bg-[right_12px_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ children, hint, className }: { children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-1.5', className)}>
      <div className="text-sm font-bold">{children}</div>
      {hint && <div className="text-xs text-ink/60">{hint}</div>}
    </div>
  )
}

export function Meter({ value, max, tone = 'mint', className, segments }: { value: number; max: number; tone?: BadgeTone; className?: string; segments?: { value: number; className: string; label?: string }[] }) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100)
  return (
    <div className={cn('h-4 overflow-hidden rounded-full border-2 border-ink bg-white', className)}>
      {segments ? (
        <div className="flex h-full">
          {segments.map((s, i) => (
            <div key={i} title={s.label} className={cn('h-full border-r-2 border-ink last:border-r-0', s.className)} style={{ width: `${Math.max(0.8, (s.value / Math.max(max, 1)) * 100)}%` }} />
          ))}
        </div>
      ) : (
        <div className={cn('h-full border-r-2 border-ink', badgeTones[tone])} style={{ width: `${Math.max(pct, 2)}%` }} />
      )}
    </div>
  )
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} strokeWidth={2.5} className={i <= Math.round(value) ? 'fill-sun text-ink' : 'fill-white text-ink/30'} />
      ))}
    </span>
  )
}

export function EmptyState({ emoji, title, children, action, className }: { emoji: string; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border-[3px] border-dashed border-ink/30 px-6 py-10 text-center', className)}>
      <div className="mb-2 text-5xl">{emoji}</div>
      <div className="font-display text-xl font-extrabold">{title}</div>
      {children && <div className="mt-1 max-w-md text-ink/65">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action, emoji, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; emoji?: string; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-3 text-4xl font-extrabold sm:text-5xl">
          {emoji && <span className="inline-block animate-wiggle">{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-lg text-ink/70">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'default', emoji, className }: { label: string; value: ReactNode; sub?: ReactNode; tone?: BadgeTone; emoji?: string; className?: string }) {
  return (
    <div className={cn('brut rounded-2xl p-4', badgeTones[tone], className)}>
      <div className="flex items-center justify-between text-sm font-bold text-ink/70">
        {label}
        {emoji && <span className="text-lg">{emoji}</span>}
      </div>
      <div className="mt-1 font-display text-3xl font-extrabold leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-xs font-medium text-ink/65">{sub}</div>}
    </div>
  )
}

export function Callout({ emoji = '💡', tone = 'accent', children, className, action }: { emoji?: string; tone?: BadgeTone; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border-2 border-ink p-3 text-sm', badgeTones[tone], className)}>
      <span className="text-lg leading-none">{emoji}</span>
      <div className="min-w-0 flex-1 leading-snug">{children}</div>
      {action}
    </div>
  )
}

/** The one-line explainer at the top of a tab. Plain text on the page background, with an optional control on the right. */
export function TabIntro({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-0 text-[15px] text-ink/65">{children}</p>
      {action}
    </div>
  )
}

/** Comic-style speech bubble for out-of-character demo commentary. Tail sits bottom-right. */
export function EditorsNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative mb-3 self-start', className)}>
      <p className="rounded-xl rounded-br-none border-2 border-ink bg-sun px-3.5 py-1.5 text-sm shadow-brut-sm">
        <b className="font-extrabold">Note from Brandon:</b> {children}
      </p>
      {/* Tail: the bubble's right edge continues straight down; the diagonal runs from the bottom edge to meet it.
          Path coords: y=0..2 overlaps the 2px bottom border, x=14..16 overlaps the right border. Shadow copy offset 3px to match shadow-brut-sm. */}
      <svg aria-hidden width="16" height="14" viewBox="0 0 16 14" overflow="visible" className="absolute top-[calc(100%-2px)] right-0">
        <path d="M3 4 L18 16 L18 3 Z" fill="var(--color-ink)" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
        {/* Fill is flat-topped so it fully erases the bubble's bottom border under the tail's base; outline is drawn separately (no top edge). */}
        <path d="M1 -0.5 L14 -0.5 L14 12 L0 1 Z" fill="var(--color-sun)" />
        <path d="M0 1 L15 13 L15 0" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border-2 border-ink bg-white px-1.5 py-0.5 font-mono text-xs font-bold shadow-brut-xs">{children}</kbd>
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-xl border-2 border-ink bg-white p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-lg px-3 py-1 text-sm font-bold transition-colors', value === o.value ? 'bg-ink text-paper' : 'hover:bg-ink/8')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
