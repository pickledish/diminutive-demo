import { useLayoutEffect, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { crossesMode, startModeSwitch, useMode } from '@/lib/mode'
import { DemoBanner } from './DemoBanner'
import { Navbar } from './Navbar'
import { Logo } from '../ui/identity'

export function AppShell() {
  const { mode, pathname } = useMode()
  const navigate = useNavigate()
  const prevPath = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (!mode) return
    document.documentElement.dataset.mode = mode
    return () => {
      delete document.documentElement.dataset.mode
    }
  }, [mode])

  // React Router replays a view transition on back/forward for any path that
  // once used one. The slide is armed only for an actual mode cross, and the
  // flag is set in this layout effect so it is on <html> before the new snapshot.
  useLayoutEffect(() => {
    const root = document.documentElement
    const from = prevPath.current
    prevPath.current = pathname
    if (from && mode && crossesMode(from, pathname)) root.dataset.vtSlide = mode
    else delete root.dataset.vtSlide
    return () => {
      delete root.dataset.vtSlide
    }
  }, [mode, pathname])

  return (
    <div className="dots flex min-h-screen flex-col">
      <DemoBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-24">
        <Outlet />
      </main>
      <footer className="border-t-[3px] border-ink bg-surface-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-5 text-sm text-ink/60">
          <Logo size={24} className="[&>span:last-child]:text-lg" />
          <span>Tiny apps for your people. Your data stays with you.</span>
          <div className="ml-auto flex gap-4 font-bold">
            <Link to="/" className="hover:text-ink">
              About
            </Link>
            <Link to="/explore" className="hover:text-ink">
              Explore
            </Link>
            <Link
              to="/workshop/docs"
              onClick={(e) => {
                if (crossesMode(pathname, '/workshop/docs')) startModeSwitch(e, navigate, '/workshop/docs')
              }}
              className="hover:text-ink"
            >
              For makers
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
