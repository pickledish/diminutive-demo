import type { MouseEvent } from 'react'
import { useLocation, type NavigateFunction } from 'react-router'

export type Mode = 'my' | 'workshop'

/** Routes that live in the app shell. Landing and the runner are neither mode. */
export function modeOf(pathname: string): Mode | null {
  if (pathname.startsWith('/workshop')) return 'workshop'
  if (
    pathname.startsWith('/home') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/apps/') ||
    pathname.startsWith('/makers/') ||
    pathname.startsWith('/my/') ||
    pathname === '/data' ||
    pathname.startsWith('/account')
  ) {
    return 'my'
  }
  return null
}

export function crossesMode(from: string, to: string) {
  const a = modeOf(from)
  const b = modeOf(to)
  return a !== null && b !== null && a !== b
}

/** Starts the slide in the click, instead of after the next paint. */
export const modeTransition = { viewTransition: true, flushSync: true } as const

export function startModeSwitch(event: MouseEvent<HTMLAnchorElement>, navigate: NavigateFunction, to: string) {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
  if (event.currentTarget.target === '_blank') return
  event.preventDefault()
  navigate(to, modeTransition)
}

export function useMode() {
  const { pathname } = useLocation()
  const mode = modeOf(pathname)
  return { pathname, mode, workshop: mode === 'workshop' }
}
