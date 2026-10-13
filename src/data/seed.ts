import type {
  ActivityEvent,
  AppListing,
  AppNotification,
  Backup,
  DevApp,
  Install,
  Invite,
  Member,
  Migration,
  PendingUpdate,
  Release,
  Row,
  Space,
  Tables,
} from '@/types'
import { daysAgo, daysFromNow, hoursAgo, minutesAgo } from '@/lib/utils'
import { GG_240_OPS, GG_240_SUMMARY, GG_SCHEMA_231, seedCatalog } from './catalog'
import { ME_ID, seedDevelopers, seedPeople } from './people'

const day = (n: number) => daysAgo(n).slice(0, 10)
const dayAhead = (n: number) => daysFromNow(n).slice(0, 10)

function rows(prefix: string, data: Omit<Row, 'id'>[]): Row[] {
  return data.map((d, i) => ({ id: `${prefix}_${String(i + 1).padStart(2, '0')}`, ...d }) as Row)
}

const member = (personId: string, role: Member['role'], joined: number): Member => ({ personId, role, joinedAt: daysAgo(joined) })

/* ---------------------------- Space data ---------------------------- */

function groceryHouse(): Tables {
  return {
    lists: rows('lst', [
      { name: 'Weekly shop', emoji: '🛒', archived: false, created_by: ME_ID, created_at: daysAgo(90) },
      { name: 'Costco run', emoji: '📦', archived: false, created_by: 'usr_jess', created_at: daysAgo(40) },
      { name: 'Theo’s birthday', emoji: '🎂', archived: true, created_by: ME_ID, created_at: daysAgo(70) },
      { name: 'Thanksgiving', emoji: '🦃', archived: false, created_by: 'usr_jess', created_at: daysAgo(5) },
    ]),
    items: rows('itm', [
      { list_id: 'lst_01', name: 'Oat milk', qty: 2, done: false, added_by: 'usr_jess', added_at: hoursAgo(1) },
      { list_id: 'lst_01', name: 'Bananas', qty: 6, done: false, added_by: 'usr_theo', added_at: hoursAgo(3) },
      { list_id: 'lst_01', name: 'Sourdough loaf', qty: 1, done: true, added_by: ME_ID, added_at: daysAgo(1) },
      { list_id: 'lst_01', name: 'Eggs (dozen)', qty: 1, done: false, added_by: 'usr_jess', added_at: daysAgo(1) },
      { list_id: 'lst_01', name: 'Coffee beans', qty: 1, done: false, added_by: ME_ID, added_at: daysAgo(2) },
      { list_id: 'lst_01', name: 'Spinach', qty: 1, done: false, added_by: ME_ID, added_at: daysAgo(2) },
      { list_id: 'lst_01', name: 'Gummy worms', qty: 14, done: false, added_by: 'usr_theo', added_at: minutesAgo(20) },
      { list_id: 'lst_01', name: 'Limes', qty: 6, done: false, added_by: 'usr_jess', added_at: daysAgo(3) },
      { list_id: 'lst_01', name: 'Sharp cheddar', qty: 1, done: true, added_by: ME_ID, added_at: daysAgo(4) },
      { list_id: 'lst_01', name: 'Greek yogurt', qty: 4, done: true, added_by: 'usr_jess', added_at: daysAgo(4) },
      { list_id: 'lst_02', name: 'Paper towels', qty: 1, done: false, added_by: 'usr_jess', added_at: daysAgo(2) },
      { list_id: 'lst_02', name: 'Rotisserie chicken', qty: 2, done: false, added_by: ME_ID, added_at: daysAgo(2) },
      { list_id: 'lst_02', name: 'Frozen dumplings', qty: 3, done: false, added_by: 'usr_theo', added_at: daysAgo(5) },
      { list_id: 'lst_04', name: 'Turkey (14 lb)', qty: 1, done: false, added_by: 'usr_jess', added_at: daysAgo(4) },
      { list_id: 'lst_04', name: 'Cranberries', qty: 2, done: false, added_by: ME_ID, added_at: daysAgo(4) },
      { list_id: 'lst_04', name: 'Sweet potatoes', qty: 5, done: false, added_by: 'usr_jess', added_at: daysAgo(3) },
      { list_id: 'lst_04', name: 'Pie crust', qty: 2, done: false, added_by: ME_ID, added_at: daysAgo(1) },
      { list_id: 'lst_04', name: 'Whipped cream', qty: 2, done: false, added_by: 'usr_theo', added_at: daysAgo(1) },
    ]),
  }
}

function groceryMe(): Tables {
  return {
    lists: rows('lsm', [{ name: 'Desk snacks', emoji: '🥨', archived: false, created_by: ME_ID, created_at: daysAgo(30) }]),
    items: rows('itx', [
      { list_id: 'lsm_01', name: 'Trail mix', qty: 1, done: false, added_by: ME_ID, added_at: daysAgo(6) },
      { list_id: 'lsm_01', name: 'Lime seltzer (12 pack)', qty: 1, done: true, added_by: ME_ID, added_at: daysAgo(6) },
      { list_id: 'lsm_01', name: 'Dark chocolate', qty: 2, done: false, added_by: ME_ID, added_at: daysAgo(2) },
    ]),
  }
}

const LAKE_CREW = JSON.stringify(['usr_sam', ME_ID, 'usr_maya', 'usr_arjun'])

function splitsiesLake(): Tables {
  return {
    expenses: rows('exp', [
      { what: 'Cabin deposit', amount: 640, currency: 'USD', paid_by: 'usr_sam', split_between: LAKE_CREW, spent_on: day(30) },
      { what: 'Groceries (Costco)', amount: 184.32, currency: 'USD', paid_by: ME_ID, split_between: LAKE_CREW, spent_on: day(9) },
      { what: 'Gas, first leg', amount: 62.1, currency: 'USD', paid_by: 'usr_maya', split_between: LAKE_CREW, spent_on: day(8) },
      { what: 'Canoe rental', amount: 90, currency: 'USD', paid_by: 'usr_arjun', split_between: LAKE_CREW, spent_on: day(7) },
      { what: 'Firewood + ice', amount: 24.5, currency: 'USD', paid_by: ME_ID, split_between: LAKE_CREW, spent_on: day(7) },
      { what: 'Pizza night', amount: 76.4, currency: 'USD', paid_by: 'usr_sam', split_between: LAKE_CREW, spent_on: day(6) },
      { what: 'Fishing licenses', amount: 38, currency: 'USD', paid_by: 'usr_arjun', split_between: JSON.stringify(['usr_arjun', ME_ID]), spent_on: day(6) },
      { what: 'Sunscreen (forgot it, obviously)', amount: 14.99, currency: 'USD', paid_by: 'usr_maya', split_between: LAKE_CREW, spent_on: day(5) },
    ]),
    settlements: rows('set', [{ from_person: 'usr_maya', to_person: 'usr_sam', amount: 120, settled_at: daysAgo(3) }]),
  }
}

function bookSunday(): Tables {
  return {
    books: rows('bk', [
      { title: 'Piranesi', author: 'Susanna Clarke', status: 'finished', picked_by: 'usr_maya', rating: 4.6 },
      { title: 'Project Hail Mary', author: 'Andy Weir', status: 'finished', picked_by: ME_ID, rating: 4.8 },
      { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', status: 'finished', picked_by: 'usr_lou', rating: 3.9 },
      { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', status: 'reading', picked_by: 'usr_priya', rating: null },
      { title: 'Remarkably Bright Creatures', author: 'Shelby Van Pelt', status: 'nominated', picked_by: 'usr_maya', rating: null },
      { title: 'The House in the Cerulean Sea', author: 'TJ Klune', status: 'nominated', picked_by: ME_ID, rating: null },
    ]),
    meetings: rows('mtg', [
      { book_id: 'bk_01', meets_on: day(80), host: 'usr_maya', notes: 'Everyone agreed the house is the real main character.' },
      { book_id: 'bk_02', meets_on: day(50), host: ME_ID, notes: 'Rocky is the best character in fiction. Unanimous.' },
      { book_id: 'bk_03', meets_on: day(21), host: 'usr_lou', notes: 'Lou cried. Priya pretended not to.' },
      { book_id: 'bk_04', meets_on: dayAhead(6), host: 'usr_priya', notes: null },
    ]),
    votes: rows('vot', [
      { book_id: 'bk_05', voter: 'usr_maya', rank: 1 },
      { book_id: 'bk_06', voter: ME_ID, rank: 1 },
      { book_id: 'bk_05', voter: 'usr_lou', rank: 1 },
      { book_id: 'bk_06', voter: 'usr_priya', rank: 1 },
      { book_id: 'bk_05', voter: ME_ID, rank: 2 },
    ]),
  }
}

function habitMe(): Tables {
  const checkins: Omit<Row, 'id'>[] = []
  const pattern: [string, number[]][] = [
    ['hab_01', [0, 1, 2, 3, 4, 5, 6, 8, 9]],
    ['hab_02', [0, 2, 3, 5, 7, 9]],
    ['hab_03', [0, 1, 2, 3, 4, 6, 7]],
    ['hab_04', [1, 4, 5]],
  ]
  for (const [habit, days] of pattern) for (const d of days) checkins.push({ habit_id: habit, on_date: day(d), note: null })
  checkins.sort((a, b) => String(b.on_date).localeCompare(String(a.on_date)))
  checkins[2].note = 'Read on the train! 🚆'
  checkins[7].note = 'Biscuit found a squirrel. Long walk.'
  return {
    habits: rows('hab', [
      { name: 'Drink water', emoji: '💧', target_per_week: 7, created_at: daysAgo(120) },
      { name: 'Read 20 minutes', emoji: '📖', target_per_week: 5, created_at: daysAgo(120) },
      { name: 'Walk Biscuit', emoji: '🐕', target_per_week: 7, created_at: daysAgo(90) },
      { name: 'No phone in bed', emoji: '📵', target_per_week: 5, created_at: daysAgo(40) },
    ]),
    checkins: rows('chk', checkins),
    creature: rows('crt', [{ name: 'Pancake', form: 'Fluffy Duckling', level: 7, xp: 340 }]),
  }
}

function dragonOwls(): Tables {
  return {
    sessions: rows('ses', [
      { number: 14, title: 'The Goblin Market', played_on: day(42), recap: 'Traded Arjun’s left boot for a map. Worth it.' },
      { number: 15, title: 'Ferry to Nowhere', played_on: day(35), recap: 'Old Marrow refused gold. Wanted “a memory.” Omar gave him one about a sandwich.' },
      { number: 16, title: 'The Drowned Library', played_on: day(28), recap: 'The books are wet and also alive. Nell befriended one.' },
      { number: 17, title: 'Lanterns Below', played_on: day(14), recap: 'Do not follow the lanterns. We followed the lanterns.' },
      { number: 18, title: 'Owlbear Custody Dispute', played_on: day(7), recap: 'We now legally share an owlbear cub. Its name is Gregory.' },
    ]),
    npcs: rows('npc', [
      { name: 'Old Marrow', role: 'Ferryman', attitude: 'Mysterious', secret: false },
      { name: 'Captain Ysolde', role: 'Harbor master', attitude: 'Friendly', secret: false },
      { name: 'The Whispering Tome', role: 'Sentient book', attitude: 'Hostile', secret: false },
      { name: 'Pip Thistlewick', role: 'Halfling fence', attitude: 'Shifty', secret: false },
    ]),
    loot: rows('lt', [
      { item: 'Bag of Holding', holder: 'usr_arjun', value_gp: 500 },
      { item: 'Cursed amulet (do NOT wear)', holder: 'usr_omar', value_gp: 250 },
      { item: '340 gold pieces', holder: null, value_gp: 340 },
      { item: 'Map to the Sunken Spire', holder: ME_ID, value_gp: 0 },
      { item: 'Gregory (owlbear cub)', holder: 'usr_nell', value_gp: 0 },
    ]),
  }
}

function plantMe(): Tables {
  return {
    plants: rows('plt', [
      { name: 'Figgy', species: 'Fiddle-leaf fig', room: 'Living room', water_every_days: 7, last_watered: day(3), photo: 'figgy.jpg' },
      { name: 'Big Mon', species: 'Monstera', room: 'Living room', water_every_days: 7, last_watered: day(5), photo: 'big-mon.jpg' },
      { name: 'Sir Hiss', species: 'Snake plant', room: 'Bedroom', water_every_days: 21, last_watered: day(12), photo: null },
      { name: 'Potty', species: 'Pothos', room: 'Kitchen', water_every_days: 5, last_watered: day(6), photo: 'potty.jpg' },
      { name: 'Basil Rathbone', species: 'Basil', room: 'Kitchen windowsill', water_every_days: 2, last_watered: day(1), photo: null },
    ]),
    waterings: rows('wtr', [
      { plant_id: 'plt_05', watered_at: daysAgo(1), by: ME_ID },
      { plant_id: 'plt_01', watered_at: daysAgo(3), by: ME_ID },
      { plant_id: 'plt_05', watered_at: daysAgo(3), by: ME_ID },
      { plant_id: 'plt_02', watered_at: daysAgo(5), by: ME_ID },
      { plant_id: 'plt_04', watered_at: daysAgo(6), by: ME_ID },
      { plant_id: 'plt_01', watered_at: daysAgo(10), by: ME_ID },
      { plant_id: 'plt_03', watered_at: daysAgo(12), by: ME_ID },
      { plant_id: 'plt_02', watered_at: daysAgo(12), by: ME_ID },
    ]),
  }
}

function officePlants(): Tables {
  return {
    plants: rows('opl', [
      { name: 'Fernando', species: 'Boston fern', room: 'Reception', water_every_days: 3, last_watered: day(4), photo: 'fernando.jpg' },
      { name: 'Kevin', species: 'ZZ plant', room: 'Accounting', water_every_days: 14, last_watered: day(10), photo: null },
      { name: 'Cactus Jack', species: 'Golden barrel cactus', room: 'Window by the printer', water_every_days: 30, last_watered: day(20), photo: null },
    ]),
    waterings: rows('owt', [
      { plant_id: 'opl_01', watered_at: daysAgo(4), by: 'usr_priya' },
      { plant_id: 'opl_02', watered_at: daysAgo(10), by: 'usr_bea' },
    ]),
  }
}

function lousPotluck(): Tables {
  return {
    events: rows('evt', [{ title: 'Lou turns 40 🎂', happens_on: dayAhead(12), where: 'Lou’s backyard' }]),
    dishes: rows('dsh', [
      { event_id: 'evt_01', dish: 'Big lasagna', kind: 'main', brought_by: 'usr_lou', allergens: 'dairy, gluten' },
      { event_id: 'evt_01', dish: 'Chips (of course)', kind: 'snack', brought_by: 'usr_sam', allergens: null },
      { event_id: 'evt_01', dish: 'Lemon bars', kind: 'dessert', brought_by: 'usr_maya', allergens: 'eggs, gluten' },
      { event_id: 'evt_01', dish: 'Pork dumplings', kind: 'main', brought_by: 'usr_kenji', allergens: 'gluten' },
    ]),
    rsvps: rows('rsv', [
      { event_id: 'evt_01', person: 'usr_lou', going: true },
      { event_id: 'evt_01', person: 'usr_sam', going: true },
      { event_id: 'evt_01', person: 'usr_maya', going: true },
      { event_id: 'evt_01', person: 'usr_kenji', going: true },
      { event_id: 'evt_01', person: 'usr_bea', going: false },
    ]),
  }
}

/* ---------------------------- Assembly ---------------------------- */

export const SEED_VERSION = 7

function installFor(app: AppListing, spaceIds: string[], installedDays: number, overrides: Partial<Install> = {}): Install {
  return {
    appId: app.id,
    version: app.version,
    installedAt: daysAgo(installedDays),
    updatedAt: app.updatedAt,
    lastOpenedAt: hoursAgo(Math.max(1, installedDays % 30)),
    autoUpdate: true,
    autoApproveData: false,
    notificationsOn: true,
    schema: app.schema,
    spaceIds,
    appliedMigrations: [],
    ...overrides,
  }
}

function seedSpaces(): Record<string, Space> {
  const list: Space[] = [
    {
      id: 'sp_gg_house',
      appId: 'grocery-goblin',
      name: 'Park House',
      emoji: '🏡',
      ownerId: ME_ID,
      members: [member(ME_ID, 'owner', 120), member('usr_jess', 'editor', 119), member('usr_theo', 'editor', 100), member('usr_june', 'viewer', 30)],
      pending: [{ id: 'pi_ray', label: 'ray.park@gmail.com', role: 'viewer', sentAt: daysAgo(2) }],
      createdAt: daysAgo(120),
      tables: groceryHouse(),
      extraKb: 0,
    },
    {
      id: 'sp_gg_me',
      appId: 'grocery-goblin',
      name: 'Just me',
      emoji: '🙂',
      ownerId: ME_ID,
      members: [member(ME_ID, 'owner', 200)],
      pending: [],
      createdAt: daysAgo(200),
      tables: groceryMe(),
      extraKb: 0,
    },
    {
      id: 'sp_split_lake',
      appId: 'splitsies',
      name: 'Lake Trip 2026',
      emoji: '🏕️',
      ownerId: 'usr_sam',
      members: [member('usr_sam', 'owner', 31), member(ME_ID, 'editor', 30), member('usr_maya', 'editor', 30), member('usr_arjun', 'editor', 29)],
      pending: [],
      createdAt: daysAgo(31),
      tables: splitsiesLake(),
      extraKb: 420,
    },
    {
      id: 'sp_book_sunday',
      appId: 'book-nook',
      name: 'Sunday Readers',
      emoji: '📖',
      ownerId: ME_ID,
      members: [member(ME_ID, 'owner', 95), member('usr_maya', 'editor', 95), member('usr_lou', 'editor', 90), member('usr_priya', 'editor', 60)],
      pending: [],
      createdAt: daysAgo(95),
      tables: bookSunday(),
      extraKb: 2_300,
    },
    {
      id: 'sp_hh_me',
      appId: 'habit-hatch',
      name: 'Just me',
      emoji: '🙂',
      ownerId: ME_ID,
      members: [member(ME_ID, 'owner', 120)],
      pending: [],
      createdAt: daysAgo(120),
      tables: habitMe(),
      extraKb: 0,
    },
    {
      id: 'sp_dn_owls',
      appId: 'dragon-notes',
      name: 'The Crimson Owls',
      emoji: '🦉',
      ownerId: 'usr_kenji',
      members: [
        member('usr_kenji', 'owner', 200),
        member(ME_ID, 'editor', 190),
        member('usr_arjun', 'editor', 190),
        member('usr_omar', 'editor', 150),
        member('usr_nell', 'editor', 80),
      ],
      pending: [],
      createdAt: daysAgo(200),
      tables: dragonOwls(),
      extraKb: 6_100,
    },
    {
      id: 'sp_pp_me',
      appId: 'plant-pal',
      name: 'My jungle',
      emoji: '🌿',
      ownerId: ME_ID,
      members: [member(ME_ID, 'owner', 64)],
      pending: [],
      createdAt: daysAgo(64),
      tables: plantMe(),
      extraKb: 14_800,
    },
  ]
  return Object.fromEntries(list.map((s) => [s.id, s]))
}

export const seedSpaceTables = (): Record<string, Tables> => {
  const out: Record<string, Tables> = {}
  for (const s of Object.values(seedSpaces())) out[s.id] = s.tables
  return out
}

function seedInstalls(apps: Record<string, AppListing>): Record<string, Install> {
  const gg = apps['grocery-goblin']
  return {
    'grocery-goblin': installFor(gg, ['sp_gg_house', 'sp_gg_me'], 200, {
      version: '2.3.1',
      updatedAt: daysAgo(20),
      lastOpenedAt: hoursAgo(2),
      schema: GG_SCHEMA_231,
      appliedMigrations: ['mig_gg_1', 'mig_gg_2', 'mig_gg_3', 'mig_gg_4', 'mig_gg_5', 'mig_gg_6'],
    }),
    splitsies: installFor(apps.splitsies, ['sp_split_lake'], 30, { lastOpenedAt: daysAgo(3) }),
    'book-nook': installFor(apps['book-nook'], ['sp_book_sunday'], 95, { lastOpenedAt: daysAgo(1) }),
    'habit-hatch': installFor(apps['habit-hatch'], ['sp_hh_me'], 120, { lastOpenedAt: hoursAgo(9) }),
    'dragon-notes': installFor(apps['dragon-notes'], ['sp_dn_owls'], 190, { lastOpenedAt: daysAgo(6), updatedAt: daysAgo(4) }),
    'plant-pal': installFor(apps['plant-pal'], ['sp_pp_me'], 64, { lastOpenedAt: daysAgo(1), notificationsOn: true }),
  }
}

function seedInvites(): Invite[] {
  return [
    {
      id: 'inv_plants',
      appId: 'plant-pal',
      fromPersonId: 'usr_priya',
      spaceName: 'Office Plant Squad',
      spaceEmoji: '🌵',
      role: 'editor',
      sentAt: hoursAgo(5),
      memberIds: ['usr_priya', 'usr_bea', 'usr_omar', 'usr_nell'],
      message: 'pls help me keep the office ferns alive 🙏',
      tables: officePlants(),
    },
    {
      id: 'inv_potluck',
      appId: 'potluck-planner',
      fromPersonId: 'usr_lou',
      spaceName: 'Lou’s 40th Potluck',
      spaceEmoji: '🎂',
      role: 'editor',
      sentAt: daysAgo(1),
      memberIds: ['usr_lou', 'usr_maya', 'usr_sam', 'usr_kenji', 'usr_bea', 'usr_priya'],
      message: 'Bring something! Anything! Not chips.',
      tables: lousPotluck(),
    },
  ]
}

function seedBackups(): Backup[] {
  const list: Backup[] = []
  for (let d = 0; d < 7; d++) {
    list.push({ id: `bk_auto_${d}`, createdAt: hoursAgo(3 + d * 24), sizeKb: 25_900 - d * 140, kind: 'auto' })
  }
  list.push({ id: 'bk_gg_manual', appId: 'grocery-goblin', createdAt: daysAgo(9), sizeKb: 46, kind: 'manual', note: 'Before Thanksgiving chaos 🦃' })
  list.push({ id: 'bk_hh_pre', appId: 'habit-hatch', createdAt: daysAgo(19), sizeKb: 31, kind: 'pre-update', note: 'Before updating to 4.0.0' })
  list.push({ id: 'bk_split_manual', appId: 'splitsies', createdAt: daysAgo(12), sizeKb: 410, kind: 'manual', note: 'Pre-trip snapshot' })
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function seedActivity(): ActivityEvent[] {
  let n = 0
  const e = (at: string, kind: ActivityEvent['kind'], text: string, appId?: string, spaceId?: string, who?: string): ActivityEvent => ({
    id: `act_${++n}`,
    at,
    kind,
    text,
    appId,
    spaceId,
    who,
  })
  return [
    e(minutesAgo(20), 'write', 'Theo added 1 row to items', 'grocery-goblin', 'sp_gg_house', 'usr_theo'),
    e(hoursAgo(1), 'write', 'Jess added 1 row to items', 'grocery-goblin', 'sp_gg_house', 'usr_jess'),
    e(hoursAgo(2), 'read', 'Grocery Goblin read 22 rows while you were using it', 'grocery-goblin', 'sp_gg_house', ME_ID),
    e(hoursAgo(3), 'backup', 'Daily backup finished: everything, 25.3 MB', undefined, undefined, 'cubby'),
    e(hoursAgo(5), 'sharing', 'Priya invited you to “Office Plant Squad”', 'plant-pal', undefined, 'usr_priya'),
    e(hoursAgo(9), 'write', 'You added 2 rows to checkins', 'habit-hatch', 'sp_hh_me', ME_ID),
    e(daysAgo(1), 'sharing', 'Lou invited you to “Lou’s 40th Potluck”', 'potluck-planner', undefined, 'usr_lou'),
    e(daysAgo(1), 'write', 'Priya changed 1 row in books', 'book-nook', 'sp_book_sunday', 'usr_priya'),
    e(daysAgo(1), 'read', 'Plant Pal read 13 rows while you were using it', 'plant-pal', 'sp_pp_me', ME_ID),
    e(daysAgo(2), 'sharing', 'You invited ray.park@gmail.com to “Park House” as a viewer', 'grocery-goblin', 'sp_gg_house', ME_ID),
    e(daysAgo(3), 'write', 'Maya added 1 row to settlements', 'splitsies', 'sp_split_lake', 'usr_maya'),
    e(daysAgo(4), 'update', 'Dragon Notes updated to 2.2.0 automatically (no data changes)', 'dragon-notes', undefined, 'cubby'),
    e(daysAgo(5), 'write', 'Jess created a list: 1 row in lists', 'grocery-goblin', 'sp_gg_house', 'usr_jess'),
    e(daysAgo(6), 'update', 'Grocery Goblin 2.4.0 is waiting for your OK (it changes your data)', 'grocery-goblin', undefined, 'cubby'),
    e(daysAgo(7), 'write', 'Kenji added 1 row to sessions', 'dragon-notes', 'sp_dn_owls', 'usr_kenji'),
    e(daysAgo(9), 'backup', 'You made a backup: “Before Thanksgiving chaos 🦃”', 'grocery-goblin', undefined, ME_ID),
    e(daysAgo(12), 'export', 'You exported expenses as CSV', 'splitsies', 'sp_split_lake', ME_ID),
    e(daysAgo(19), 'schema', 'Habit Hatch 4.0.0 changed your data: adds “level” and “xp” to your creature', 'habit-hatch', 'sp_hh_me', 'cubby'),
    e(daysAgo(19), 'backup', 'Backed up Habit Hatch before updating to 4.0.0', 'habit-hatch', undefined, 'cubby'),
    e(daysAgo(20), 'update', 'Grocery Goblin updated to 2.3.1 automatically (no data changes)', 'grocery-goblin', undefined, 'cubby'),
    e(daysAgo(30), 'sharing', 'You let Grandma June into “Park House” as a viewer', 'grocery-goblin', 'sp_gg_house', ME_ID),
    e(daysAgo(30), 'sharing', 'Sam added you to “Lake Trip 2026”', 'splitsies', 'sp_split_lake', 'usr_sam'),
    e(daysAgo(30), 'install', 'You installed Splitsies', 'splitsies', undefined, ME_ID),
    e(daysAgo(34), 'schema', 'Grocery Goblin 2.3.0 changed your data: adds an “archived” flag to lists', 'grocery-goblin', 'sp_gg_house', 'cubby'),
    e(daysAgo(64), 'install', 'You installed Plant Pal', 'plant-pal', undefined, ME_ID),
  ]
}

function seedNotifications(): AppNotification[] {
  return [
    {
      id: 'ntf_4',
      at: daysAgo(2),
      emoji: '🛠️',
      title: 'Workshop: 14 installs rolled back safely',
      body: 'Grocery Goblin migration 0007 hit timeouts on large lists.',
      href: '/workshop/grocery-goblin/migrations',
      read: false,
    },
    { id: 'ntf_5', at: hoursAgo(3), emoji: '💾', title: 'Daily backup finished', body: 'Everything, 25.3 MB', href: '/data', read: true },
    { id: 'ntf_6', at: daysAgo(4), emoji: '💛', title: 'Someone tipped $5 on Chore Wheel', body: '“the wheel ended a war in our house”', href: '/workshop/chore-wheel/releases', read: true },
  ]
}

/* ---------------------------- Developer side ---------------------------- */

const GG_MIGRATIONS: Omit<Migration, 'stats' | 'failures'>[] = [
  {
    id: 'mig_gg_1',
    filename: '0001_init.sql',
    createdAt: daysAgo(400),
    releaseVersion: '1.0.0',
    sql: `create table lists (
  id uuid primary key,
  name text not null,
  created_at timestamp not null default now()
);

create table items (
  id uuid primary key,
  list_id uuid not null references lists,
  name text not null,
  done bool not null default false
);`,
    summary: ['Sets up your lists and items'],
    destructive: false,
    reversible: true,
    ops: [],
  },
  {
    id: 'mig_gg_2',
    filename: '0002_list_emoji.sql',
    createdAt: daysAgo(300),
    releaseVersion: '1.1.0',
    sql: `alter table lists add column emoji text;`,
    summary: ['Lets each list have an emoji'],
    destructive: false,
    reversible: true,
    ops: [],
  },
  {
    id: 'mig_gg_3',
    filename: '0003_item_qty.sql',
    createdAt: daysAgo(300),
    releaseVersion: '1.1.0',
    sql: `alter table items add column qty int not null default 1;`,
    summary: ['Adds a quantity to each item (starts at 1)'],
    destructive: false,
    reversible: true,
    ops: [],
  },
  {
    id: 'mig_gg_4',
    filename: '0004_added_by.sql',
    createdAt: daysAgo(120),
    releaseVersion: '2.0.0',
    sql: `-- who added what (for shared spaces)
alter table items add column added_by cubby_user;
alter table items add column added_at timestamp default now();
alter table lists add column created_by cubby_user;`,
    summary: ['Remembers who added each item, so shared lists make sense'],
    destructive: false,
    reversible: true,
    ops: [],
  },
  {
    id: 'mig_gg_5',
    filename: '0005_index_done.sql',
    createdAt: daysAgo(120),
    releaseVersion: '2.0.0',
    sql: `create index items_done_idx on items (list_id, done);`,
    summary: ['Makes long lists load faster'],
    destructive: false,
    reversible: true,
    ops: [],
  },
  {
    id: 'mig_gg_6',
    filename: '0006_list_archiving.sql',
    createdAt: daysAgo(34),
    releaseVersion: '2.3.0',
    sql: `alter table lists add column archived bool not null default false;`,
    summary: ['Adds an “archived” flag to lists'],
    destructive: false,
    reversible: true,
    ops: [],
  },
  {
    id: 'mig_gg_7',
    filename: '0007_stores_and_aisles.sql',
    createdAt: daysAgo(7),
    releaseVersion: '2.4.0',
    sql: `-- Stores you shop at
create table stores (
  id uuid primary key,
  name text not null,
  emoji text
);

-- Aisles! Best-guess for existing items.
alter table items add column aisle text;
alter table items add column store_id uuid references stores;

update items set aisle = 'Produce'
  where aisle is null and name ilike any (array['%banana%', '%lime%', '%spinach%']);`,
    summary: GG_240_SUMMARY,
    destructive: false,
    reversible: false,
    ops: GG_240_OPS,
  },
]

function rel(
  version: string,
  days: number,
  notes: string,
  channel: Release['channel'],
  migrationIds: string[] = [],
  extra: Partial<Release> = {},
): Release {
  return {
    id: `rel_${version}`,
    version,
    createdAt: daysAgo(days),
    sizeKb: 200 + ((version.length * 37 + days * 3) % 260),
    files: 8 + (days % 9),
    notes,
    channel,
    rolloutPct: 100,
    migrationIds,
    commit: Math.abs((version.charCodeAt(0) * 2654435761 + days * 97) >>> 0)
      .toString(16)
      .slice(0, 7),
    source: 'cli',
    ...extra,
  }
}

function seedDevApps(apps: Record<string, AppListing>): Record<string, DevApp> {
  const gg = apps['grocery-goblin']
  const cw = apps['chore-wheel']
  const ggMigrations: Migration[] = GG_MIGRATIONS.map((m) =>
    m.id === 'mig_gg_7'
      ? {
          ...m,
          stats: { applied: 812, pending: 458, failed: 14 },
          failures: [
            {
              code: 'STATEMENT_TIMEOUT',
              message: 'canceling statement due to statement timeout (update items …)',
              count: 11,
              resolution: 'Rolled back safely. Cubby will retry overnight with a longer timeout.',
            },
            {
              code: 'QUOTA_EXCEEDED',
              message: 'install is over its storage quota',
              count: 3,
              resolution: 'Rolled back. Those users were asked to free up space or upgrade.',
            },
          ],
        }
      : { ...m, stats: { applied: gg.installs, pending: 0, failed: 0 }, failures: [] },
  )

  const cwMigrations: Migration[] = [
    {
      id: 'mig_cw_1',
      filename: '0001_init.sql',
      createdAt: daysAgo(160),
      releaseVersion: '1.0.0',
      sql: `create table chores (
  id uuid primary key,
  name text not null,
  emoji text,
  every_days int not null default 7
);

create table spins (
  id uuid primary key,
  chore_id uuid references chores,
  assigned_to cubby_user,
  spun_at timestamp default now(),
  done bool default false
);`,
      summary: ['Sets up chores and spins'],
      destructive: false,
      reversible: true,
      ops: [],
      stats: { applied: cw.installs, pending: 0, failed: 0 },
      failures: [],
    },
    {
      id: 'mig_cw_2',
      filename: '0002_points.sql',
      createdAt: daysAgo(52),
      releaseVersion: '1.1.0',
      sql: `alter table chores add column points int not null default 1;`,
      summary: ['Adds points to chores (every chore starts at 1)'],
      destructive: false,
      reversible: true,
      ops: [],
      stats: { applied: cw.installs, pending: 0, failed: 0 },
      failures: [],
    },
  ]

  return {
    'grocery-goblin': {
      appId: 'grocery-goblin',
      status: 'live',
      createdAt: daysAgo(402),
      publishableKey: 'pk_live_gg_7Hq2xV9mK4tPz',
      collaborators: [
        { name: 'Robin Park (you)', emoji: '🦊', role: 'owner' },
        { name: 'Jess Park', emoji: '🐼', role: 'maintainer' },
      ],
      tipsCents: 18_400,
      betaTesters: 38,
      releases: [
        rel('2.5.0-beta.1', 2, 'Dark mode for night-owl shoppers 🌙', 'beta'),
        rel('2.4.0', 6, 'Sort by aisle + a Stores tab.', 'live', ['mig_gg_7']),
        rel('2.3.1', 20, 'Fix: goblin animation occasionally ate the cursor.', 'archived'),
        rel('2.3.0', 34, 'Archive old lists.', 'archived', ['mig_gg_6']),
        rel('2.2.0', 61, 'Realtime updates in shared spaces.', 'archived'),
        rel('2.1.0', 90, 'Bigger buttons for in-store, one-handed use.', 'archived', [], { source: 'web' }),
        rel('2.0.0', 120, 'Shared spaces!', 'archived', ['mig_gg_4', 'mig_gg_5']),
        rel('1.1.0', 300, 'Emoji for lists, quantities for items.', 'archived', ['mig_gg_2', 'mig_gg_3'], { source: 'web' }),
        rel('1.0.0', 400, 'First release.', 'archived', ['mig_gg_1'], { source: 'web' }),
      ],
      migrations: ggMigrations,
      bugReports: [
        { id: 'bug_1', at: daysAgo(1), from: 'Anonymous installer', text: 'Items sometimes show up twice if I add them offline and then reconnect.', version: '2.4.0', status: 'new' },
        { id: 'bug_2', at: daysAgo(2), from: 'Hannah (chose to share her name)', text: 'Love aisles but it put ice cream in Produce 😂', version: '2.4.0', status: 'new' },
        { id: 'bug_3', at: daysAgo(9), from: 'Anonymous installer', text: 'Feature idea: let viewers “request” items instead of adding them directly. My kids would love that (I would not).', version: '2.3.1', status: 'seen' },
      ],
    },
    'chore-wheel': {
      appId: 'chore-wheel',
      status: 'live',
      createdAt: daysAgo(162),
      publishableKey: 'pk_live_cw_3Lr8sN1bW6yQe',
      collaborators: [{ name: 'Robin Park (you)', emoji: '🦊', role: 'owner' }],
      tipsCents: 4_200,
      betaTesters: 0,
      releases: [
        rel('1.2.0', 15, 'Clicky wheel sound (mutable).', 'live'),
        rel('1.1.0', 52, 'Points for chores.', 'archived', ['mig_cw_2']),
        rel('1.0.0', 160, 'First release.', 'archived', ['mig_cw_1']),
      ],
      migrations: cwMigrations,
      bugReports: [{ id: 'bug_4', at: daysAgo(6), from: 'Anonymous installer', text: 'The wheel spins forever on Safari 16. It is beautiful but we need a decision.', version: '1.2.0', status: 'seen' }],
    },
    'meeple-tally': {
      appId: 'meeple-tally',
      status: 'draft',
      createdAt: daysAgo(3),
      publishableKey: 'pk_test_mt_9Dc4jF2hR7uZa',
      collaborators: [{ name: 'Robin Park (you)', emoji: '🦊', role: 'owner' }],
      tipsCents: 0,
      betaTesters: 0,
      releases: [rel('0.1.0', 1, 'Rough first cut: games + plays.', 'preview', ['mig_mt_1'])],
      migrations: [
        {
          id: 'mig_mt_1',
          filename: '0001_init.sql',
          createdAt: daysAgo(1),
          releaseVersion: '0.1.0',
          sql: `create table games (
  id uuid primary key,
  title text not null,
  min_players int,
  max_players int
);

create table plays (
  id uuid primary key,
  game_id uuid references games,
  played_on date,
  winner cubby_user
);`,
          summary: ['Sets up games and plays'],
          destructive: false,
          reversible: true,
          ops: [],
          stats: { applied: 0, pending: 0, failed: 0 },
          failures: [],
        },
      ],
      bugReports: [],
    },
  }
}

function seedPending(): Record<string, PendingUpdate> {
  return {
    'grocery-goblin': {
      appId: 'grocery-goblin',
      fromVersion: '2.3.1',
      toVersion: '2.4.0',
      notes: 'Sort your list by aisle! Plus a new Stores tab for your favorite shops.',
      dataSummary: GG_240_SUMMARY,
      ops: GG_240_OPS,
      migrationIds: ['mig_gg_7'],
      destructive: false,
      releasedAt: daysAgo(6),
    },
  }
}

export function createSeed() {
  const apps = seedCatalog()
  return {
    seedVersion: SEED_VERSION,
    meId: ME_ID,
    people: seedPeople(),
    developers: seedDevelopers(),
    apps,
    installs: seedInstalls(apps),
    spaces: seedSpaces(),
    invites: seedInvites(),
    backups: seedBackups(),
    activity: seedActivity(),
    pendingUpdates: seedPending(),
    notifications: seedNotifications(),
    devApps: seedDevApps(apps),
    trash: [] as import('@/types').TrashedInstall[],
    plan: 'free' as 'free' | 'plus',
    autoBackup: 'daily' as 'hourly' | 'daily' | 'weekly' | 'off',
    tour: {} as Partial<Record<import('@/types').TourStep, boolean>>,
  }
}

export type SeedData = ReturnType<typeof createSeed>
