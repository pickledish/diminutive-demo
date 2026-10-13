import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ArrowLeft, ExternalLink, Rocket } from 'lucide-react'
import { useDemo } from '@/store'
import { bg } from '@/lib/colors'
import { liveRelease } from '@/lib/dev'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/components/ui/identity'
import { Badge, Button, LinkButton } from '@/components/ui/primitives'
import { Tabs } from '@/components/ui/Tabs'
import { DeployModal } from '@/components/dev/DeployModal'
import { StatusBadge } from '../Workshop'
import { DevOverviewTab } from './DevOverviewTab'
import { ReleasesTab } from './ReleasesTab'
import { MigrationsTab } from './MigrationsTab'
import { AnalyticsTab } from './AnalyticsTab'
import { ListingTab } from './ListingTab'
import { FeedbackTab } from './FeedbackTab'
import { DevSettingsTab } from './DevSettingsTab'

export function DevAppPage() {
  const { appId = '', tab = 'overview' } = useParams()
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const [deploying, setDeploying] = useState(false)

  if (!app || !dev) return <Navigate to="/workshop" replace />

  const live = liveRelease(dev)
  const unreleased = dev.migrations.filter((m) => !m.releaseVersion).length
  const newBugs = dev.bugReports.filter((b) => b.status === 'new').length
  const base = `/workshop/${appId}`
  const count = (n: number, tone: 'grape' | 'cherry' = 'grape') =>
    n > 0 ? (
      <Badge tone={tone} className="px-1.5 py-0 text-[10px]">
        {n}
      </Badge>
    ) : undefined

  const tabs = [
    { to: base, label: '🏠 Overview', end: true },
    { to: `${base}/releases`, label: '🚀 Releases' },
    { to: `${base}/migrations`, label: '🧬 Migrations', badge: count(unreleased) },
    { to: `${base}/analytics`, label: '📈 Analytics' },
    { to: `${base}/listing`, label: '🏷️ Store listing' },
    { to: `${base}/feedback`, label: '💬 Feedback', badge: count(newBugs, 'cherry') },
    { to: `${base}/settings`, label: '⚙️ Settings' },
  ]

  return (
    <div>
      <Link to="/workshop" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink">
        <ArrowLeft size={16} strokeWidth={3} /> Workshop
      </Link>

      <div className="brut relative mb-6 flex flex-col gap-5 overflow-hidden rounded-[24px] bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div className={cn('absolute inset-y-0 left-0 w-3 border-r-[3px] border-ink', bg[app.color])} />
        <AppIcon app={app} size="lg" className="ml-3" />
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl leading-none font-extrabold">{app.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-ink/60">
            <StatusBadge status={dev.status} />
            {live ? <Badge tone="white">v{live.version} live</Badge> : <Badge tone="muted">no live release</Badge>}
            <span className="font-mono text-xs">{appId}.cubby.app</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {app.published && (
            <LinkButton to={`/apps/${appId}`} variant="white" size="lg">
              Store page <ExternalLink size={16} strokeWidth={3} />
            </LinkButton>
          )}
          <Button size="lg" variant="grape" onClick={() => setDeploying(true)}>
            <Rocket size={18} strokeWidth={3} /> Deploy
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} className="mb-6" />

      {tab === 'overview' && <DevOverviewTab appId={appId} onDeploy={() => setDeploying(true)} />}
      {tab === 'releases' && <ReleasesTab appId={appId} onDeploy={() => setDeploying(true)} />}
      {tab === 'migrations' && <MigrationsTab appId={appId} onDeploy={() => setDeploying(true)} />}
      {tab === 'analytics' && <AnalyticsTab appId={appId} />}
      {tab === 'listing' && <ListingTab appId={appId} />}
      {tab === 'feedback' && <FeedbackTab appId={appId} />}
      {tab === 'settings' && <DevSettingsTab appId={appId} />}

      <DeployModal appId={appId} open={deploying} onClose={() => setDeploying(false)} />
    </div>
  )
}
