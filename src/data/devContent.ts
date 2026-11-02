export const cliSnippet = (appId: string) => `npm create diminutive@latest ${appId}
cd ${appId}
npx diminutive dev        # runs locally with a sandbox account full of fake data
npx diminutive deploy     # uploads your static build + any new migrations`

export const sdkSnippet = (appId: string) => `import { createClient } from '@diminutive/sdk'

const diminutive = createClient({ app: '${appId}' })

// 1. Who's here? (Diminutive shows its own login if needed)
const me = await diminutive.auth.user()          // { id, name, avatar }

// 2. Read & write. Always scoped to the user's current space.
const { data: items } = await diminutive.db
  .from('items')
  .select('*')
  .eq('done', false)

await diminutive.db.from('items').insert({ name: 'Oat milk', qty: 2 })

// 3. Realtime: hear about changes from others in the space
diminutive.db.from('items').subscribe((change) => render(change))

// 4. Spaces: let users share with their people
const space = await diminutive.spaces.current()  // { id, name, members, role }
await diminutive.spaces.openInviteSheet()        // Diminutive's own invite UI`

export const migrationSnippet = `-- migrations/0002_add_aisle.sql
-- Plain SQL. Diminutive runs it on every install, one at a time,
-- after the user (or space owner) approves the update.

alter table items add column aisle text;

-- Users see this in plain words before anything changes:
-- @summary Adds an “aisle” to each item so lists sort by store layout.`

export const aiPrompt = (appId: string, name: string) => `You are building "${name}", a web app that runs on Diminutive (diminutive.app).

How Diminutive apps work:
- There is NO backend server. Ship a static site (HTML/JS/CSS). Any framework is fine.
- Use the @diminutive/sdk package for login, data, sharing and realtime. App id: "${appId}".
- Each user's data lives in THEIR account. The developer cannot query it. Never
  build features that assume you can see other users' data, analytics, or admin panels.
- Data is relational (SQL). Define tables in migrations/NNNN_name.sql files.
  Never edit an old migration; always add a new one. Prefer additive changes
  (new tables, nullable columns, defaults). Avoid DROP unless truly necessary.
- Every migration needs a one-line "@summary" comment written for normal people.
  Users read it before approving the update.
- Data lives in "spaces". Every install starts with one personal space, and users
  can create more and invite people. Use diminutive.spaces.current() and assume the user
  may switch spaces at any time. Respect roles: owner, editor, viewer.
- Network access is blocked unless the domain is in diminutive.json "network". Keep it empty
  unless the app truly needs an outside API.

Commands: \`npx diminutive dev\` to run locally with fake data, \`npx diminutive deploy\` to ship.
Docs for agents: https://diminutive.app/llms.txt`
