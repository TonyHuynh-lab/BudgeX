import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  PiggyBank,
  Settings as SettingsIcon
} from 'lucide-react'
import { applyTheme, useSettings } from '../store/index'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { to: '/stocks', label: 'Stocks', icon: TrendingUp },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
]

export default function Layout(): React.JSX.Element {
  const { load } = useSettings()

  useEffect(() => {
    load()

    // Re-resolve 'system' theme if the OS preference changes while the app is open.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (): void => {
      const current = useSettings.getState().settings
      if (current?.theme === 'system') applyTheme('system')
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r flex flex-col py-6 px-3 gap-1">
        <span className="px-3 mb-4 text-lg font-semibold tracking-tight">Budgex</span>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
