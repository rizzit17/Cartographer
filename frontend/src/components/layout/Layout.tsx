/**
 * Cartographer — App Shell Layout
 *
 * Persistent shell with Sidebar navigation + main content area.
 * Outlet renders the active page from React Router.
 */

import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
