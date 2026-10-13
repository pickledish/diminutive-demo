import { cn } from '@/lib/utils'

const DEFAULT = ['✨', '🏡', '🏕️', '🎉', '📖', '🌿', '🍕', '🎲', '💼', '🧺', '🎂', '🚀', '🐾', '🌵', '🧑‍🍳', '🎸']

export function EmojiPicker({ value, onChange, options = DEFAULT, className }: { value: string; onChange: (e: string) => void; options?: string[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={cn(
            'flex size-9 items-center justify-center rounded-lg border-2 text-lg transition-all',
            value === e ? 'border-ink bg-sun shadow-brut-xs' : 'border-ink/15 bg-white hover:border-ink',
          )}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
