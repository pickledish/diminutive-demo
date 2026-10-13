import type { Category, PermissionKey, Role } from '@/types'

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'household', label: 'Home', emoji: '🏠' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends', emoji: '🍕' },
  { id: 'money', label: 'Money', emoji: '💸' },
  { id: 'health', label: 'Wellbeing', emoji: '🌱' },
  { id: 'hobbies', label: 'Hobbies', emoji: '🧶' },
  { id: 'games', label: 'Games', emoji: '🎲' },
  { id: 'work', label: 'Small teams', emoji: '💼' },
]

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c
export const categoryEmoji = (c: Category) => CATEGORIES.find((x) => x.id === c)?.emoji ?? '✨'

export const PERMISSIONS: Record<PermissionKey, { emoji: string; label: string; detail: string; optional?: boolean }> = {
  storage: {
    emoji: '🗄️',
    label: 'Keep data in your cubby',
    detail: 'The app can save and read its own data, only inside your cubby, only while you use it.',
  },
  spaces: {
    emoji: '👥',
    label: 'Shared spaces',
    detail: 'You can invite people into a space. Everyone in it sees the same data.',
  },
  profile: {
    emoji: '🪪',
    label: 'Your name & avatar',
    detail: 'Shown to people you share a space with. Never your email.',
  },
  notifications: {
    emoji: '🔔',
    label: 'Send you nudges',
    detail: 'Reminders and pings, routed through Cubby. Turn them off anytime.',
    optional: true,
  },
  files: {
    emoji: '🖼️',
    label: 'Photos & files',
    detail: 'Attachments you add are stored in your cubby and count toward your storage.',
  },
  location: {
    emoji: '📍',
    label: 'Your location (when asked)',
    detail: 'Your browser will ask first, every time. Coordinates stay in your cubby.',
    optional: true,
  },
  camera: {
    emoji: '📷',
    label: 'Camera (when asked)',
    detail: 'For snapping photos. Your browser will ask first.',
    optional: true,
  },
}

export const ROLES: Record<Role, { label: string; emoji: string; detail: string }> = {
  owner: { label: 'Owner', emoji: '👑', detail: 'Owns the data. Controls members, backups and deletion.' },
  editor: { label: 'Editor', emoji: '✏️', detail: 'Can add and change things.' },
  viewer: { label: 'Viewer', emoji: '👀', detail: 'Can look, not touch.' },
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    storageKb: 1024 * 1024,
    perks: ['Unlimited apps', '1 GB of storage', 'Daily backups, kept 14 days', 'Shared spaces up to 10 people'],
  },
  plus: {
    name: 'Plus',
    price: 4,
    storageKb: 25 * 1024 * 1024,
    perks: ['Everything in Free', '25 GB of storage', 'Hourly backups, kept 1 year', 'Shared spaces up to 50 people', 'Supports the makers you use most'],
  },
} as const

export const ANIMALS = ['🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐢', '🐙', '🦑', '🦀', '🐡', '🐬', '🦭', '🦦', '🦥']

export const APP_EMOJIS = ['🧌', '🎡', '🎲', '🍜', '🌮', '🧁', '🪩', '🛼', '🧃', '🪴', '📚', '🎯', '🧩', '🎸', '🏓', '🚲', '🧺', '🧸', '🪁', '🍉', '🌶️', '🐝', '🦖', '🛸', '🔮', '🗺️', '🧪', '⏰', '🎨', '🍳']
