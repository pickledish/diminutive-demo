import { useState } from 'react'
import { Check } from 'lucide-react'
import type { AppListing, Category, ColorKey, MockKind } from '@/types'
import { useDemo } from '@/store'
import { APP_EMOJIS, CATEGORIES } from '@/data/constants'
import { COLORS, bg } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { AppCard } from '@/components/AppCard'
import { AppMock } from '@/components/AppMock'
import { EmojiPicker } from '@/components/flows/EmojiPicker'
import { Button, Callout, Card, Input, Label, Segmented, Select, Textarea, Toggle } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

type Form = Pick<AppListing, 'name' | 'tagline' | 'description' | 'category' | 'emoji' | 'color' | 'tipJar' | 'mock'> & { tags: string }

const MOCKS: { value: MockKind; label: string }[] = [
  { value: 'list', label: '📋 List' },
  { value: 'grid', label: '🔲 Grid' },
  { value: 'board', label: '🗂️ Board' },
  { value: 'chart', label: '📊 Chart' },
  { value: 'journal', label: '📓 Journal' },
]

export function ListingTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const status = useDemo((s) => s.devApps[appId].status)
  const update = useDemo((s) => s.updateListing)
  const initial = (): Form => ({
    name: app.name,
    tagline: app.tagline,
    description: app.description,
    category: app.category,
    emoji: app.emoji,
    color: app.color,
    tipJar: app.tipJar,
    mock: app.mock,
    tags: app.tags.join(', '),
  })
  const [f, setF] = useState<Form>(initial)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))

  const patch: Partial<AppListing> = { ...f, tags: f.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) }
  const preview: AppListing = { ...app, ...patch }
  const dirty = JSON.stringify(initial()) !== JSON.stringify(f)
  const emojis = APP_EMOJIS.includes(app.emoji) ? APP_EMOJIS : [app.emoji, ...APP_EMOJIS]

  const save = () => {
    update(appId, patch)
    toast({ emoji: '🏷️', title: 'Listing saved', body: status === 'live' ? 'Explore shows the new version right away.' : 'People will see this once you publish.', tone: 'success' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="flex flex-col gap-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={32} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label hint={`${f.tagline.length}/80`}>Tagline</Label>
          <Input value={f.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={80} />
        </div>
        <div>
          <Label hint="Who’s it for? What does it remember? Keep it friendly.">Description</Label>
          <Textarea rows={5} value={f.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <Label>Icon</Label>
          <EmojiPicker value={f.emoji} onChange={(e) => set('emoji', e)} options={emojis} />
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c: ColorKey) => (
              <button key={c} onClick={() => set('color', c)} className={cn('size-9 rounded-full border-[3px] border-ink transition-transform', bg[c], f.color === c ? 'scale-110 shadow-brut-xs' : 'hover:scale-105')} aria-label={c}>
                {f.color === c && <Check size={16} strokeWidth={4} className="mx-auto" />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label hint="Comma separated. Helps people find you in search.">Tags</Label>
          <Input value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="family, lists, shopping" />
        </div>
        <div>
          <Label hint="Real screenshots come from your app’s cubby.json. This picks the placeholder style.">Screenshot style</Label>
          <Segmented value={f.mock} onChange={(v) => set('mock', v)} options={MOCKS} className="flex-wrap" />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-ink/15 p-3">
          <div>
            <div className="font-bold">💛 Tip jar</div>
            <div className="text-sm text-ink/60">Shows a “Tip the maker” button. Cubby takes 0%, card fees only.</div>
          </div>
          <Toggle checked={f.tipJar} onChange={(v) => set('tipJar', v)} label="Tip jar" />
        </div>
        <div className="flex items-center justify-end gap-2 border-t-2 border-ink/10 pt-4">
          {dirty && (
            <Button variant="ghost" onClick={() => setF(initial())}>
              Discard
            </Button>
          )}
          <Button disabled={!dirty || !f.name.trim()} onClick={save}>
            Save listing
          </Button>
        </div>
      </Card>

      <aside className="flex flex-col gap-4">
        <div className="text-xs font-extrabold tracking-wider text-ink/50 uppercase">How it looks in Explore</div>
        <div className="pointer-events-none">
          <AppCard app={preview} />
        </div>
        <AppMock app={preview} compact className="h-64 shadow-brut-sm" />
        {status === 'draft' && (
          <Callout emoji="✏️" tone="white">
            This app is a draft. Nobody sees the listing until you publish from the Overview tab.
          </Callout>
        )}
      </aside>
    </div>
  )
}
