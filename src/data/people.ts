import type { Developer, Person } from '@/types'
import { daysAgo } from '@/lib/utils'

export const ME_ID = 'usr_robin'

export const seedPeople = (): Record<string, Person> => {
  const list: Person[] = [
    { id: ME_ID, name: 'Robin Park', emoji: '🦊', color: 'bubblegum', email: 'robin@parkhouse.fam' },
    { id: 'usr_jess', name: 'Jess Park', emoji: '🐼', color: 'mint', email: 'jess@parkhouse.fam' },
    { id: 'usr_theo', name: 'Theo Park', emoji: '🐸', color: 'lime', email: 'theo.p@school.edu' },
    { id: 'usr_june', name: 'Grandma June', emoji: '👵', color: 'grape', email: 'june.park@aol.com' },
    { id: 'usr_maya', name: 'Maya Okafor', emoji: '🦉', color: 'tangerine', email: 'maya@okafor.dev' },
    { id: 'usr_arjun', name: 'Arjun Patel', emoji: '🐙', color: 'sky', email: 'arjun.patel@mail.com' },
    { id: 'usr_sam', name: 'Sam Rivera', emoji: '🐝', color: 'sun', email: 'sam@rivera.me' },
    { id: 'usr_lou', name: 'Lou Chen', emoji: '🐢', color: 'mint', email: 'lou@chen.house' },
    { id: 'usr_priya', name: 'Priya Shah', emoji: '🦄', color: 'bubblegum', email: 'priya@shah.studio' },
    { id: 'usr_kenji', name: 'Kenji Mori', emoji: '🐧', color: 'sky', email: 'kenji@moridnd.club' },
    { id: 'usr_bea', name: 'Bea Lindqvist', emoji: '🦋', color: 'grape', email: 'bea@lindqvist.se' },
    { id: 'usr_omar', name: 'Omar Haddad', emoji: '🦁', color: 'tangerine', email: 'omar@haddad.io' },
    { id: 'usr_nell', name: 'Nell Byrne', emoji: '🐨', color: 'lime', email: 'nell@byrne.ie' },
  ]
  return Object.fromEntries(list.map((p) => [p.id, p]))
}

export const seedDevelopers = (): Record<string, Developer> => {
  const list: Developer[] = [
    {
      id: 'dev_robin',
      name: 'Robin Park',
      handle: 'robinmakes',
      emoji: '🦊',
      color: 'bubblegum',
      bio: 'Parent, tinkerer, and the reason my family has 3 grocery apps. Builds with way too much AI help.',
      isMe: true,
      joinedAt: daysAgo(410),
    },
    {
      id: 'dev_noodle',
      name: 'Noodle Labs',
      handle: 'noodlelabs',
      emoji: '🍜',
      color: 'tangerine',
      bio: 'Two roommates who keep building apps to settle arguments.',
      joinedAt: daysAgo(380),
    },
    {
      id: 'dev_ada',
      name: 'Ada Byte',
      handle: 'adabyte',
      emoji: '🤖',
      color: 'sky',
      bio: 'Retired COBOL programmer. These days I just describe what I want and argue with the robot.',
      joinedAt: daysAgo(300),
    },
    {
      id: 'dev_kevin',
      name: 'Kevin from Accounting',
      handle: 'kevin.builds',
      emoji: '🧮',
      color: 'lime',
      bio: 'I turned one spreadsheet into an app. Then I could not stop.',
      joinedAt: daysAgo(350),
    },
    {
      id: 'dev_moss',
      name: 'Moss & Pebble',
      handle: 'mossandpebble',
      emoji: '🌿',
      color: 'mint',
      bio: 'A tiny two-person studio making calm software for growing things.',
      joinedAt: daysAgo(260),
    },
    {
      id: 'dev_tavi',
      name: 'Tavi Okonkwo',
      handle: 'tavi',
      emoji: '🎨',
      color: 'grape',
      bio: 'Designer learning to code one prompt at a time.',
      joinedAt: daysAgo(190),
    },
    {
      id: 'dev_sunday',
      name: 'Sunday Software',
      handle: 'sundaysoftware',
      emoji: '☀️',
      color: 'sun',
      bio: 'Weekend projects for families and friends. Shipped every Sunday, mostly.',
      joinedAt: daysAgo(330),
    },
    {
      id: 'dev_quest',
      name: 'Questline Co.',
      handle: 'questline',
      emoji: '🐉',
      color: 'cherry',
      bio: 'Tools for tabletop nerds, by tabletop nerds. Roll for initiative.',
      joinedAt: daysAgo(240),
    },
  ]
  return Object.fromEntries(list.map((d) => [d.id, d]))
}
