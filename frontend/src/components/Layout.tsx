import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
