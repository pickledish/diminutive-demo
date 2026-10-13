import { Outlet, ScrollRestoration, createHashRouter } from 'react-router'
import { Toaster } from './components/ui/toast'
import { AppShell } from './components/layout/AppShell'
import { TourWidget } from './components/layout/TourWidget'
import { Landing } from './pages/Landing'
import { NotFound } from './pages/NotFound'
import { Home } from './pages/user/Home'
import { Explore } from './pages/user/Explore'
import { Listing } from './pages/user/Listing'
import { Maker } from './pages/user/Maker'
import { ManageApp } from './pages/user/manage/ManageApp'
import { Runner } from './pages/user/Runner'
import { DataBackups } from './pages/user/DataBackups'
import { Account } from './pages/user/Account'
import { Workshop } from './pages/dev/Workshop'
import { NewApp } from './pages/dev/NewApp'
import { Docs } from './pages/dev/Docs'
import { DevAppPage } from './pages/dev/app/DevAppPage'

function Root() {
  return (
    <>
      <ScrollRestoration getKey={(location) => location.pathname} />
      <Outlet />
      <TourWidget />
      <Toaster />
    </>
  )
}

export const router = createHashRouter([
  {
    element: <Root />,
    errorElement: <NotFound />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/run/:appId', element: <Runner /> },
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <Home /> },
          { path: '/explore', element: <Explore /> },
          { path: '/apps/:appId', element: <Listing /> },
          { path: '/makers/:handle', element: <Maker /> },
          { path: '/my/:appId/:tab?', element: <ManageApp /> },
          { path: '/data', element: <DataBackups /> },
          { path: '/account', element: <Account /> },
          { path: '/workshop', element: <Workshop /> },
          { path: '/workshop/new', element: <NewApp /> },
          { path: '/workshop/docs', element: <Docs /> },
          { path: '/workshop/:appId/:tab?', element: <DevAppPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
