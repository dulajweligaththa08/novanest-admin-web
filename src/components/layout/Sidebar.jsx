import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Home, Users, MessageSquare,
  Newspaper, Briefcase, LogOut, ChevronRight, Bell,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/projects',   label: 'Projects',   icon: Building2 },
  { to: '/apartments', label: 'Apartments', icon: Home },
  { to: '/customers',  label: 'Customers',  icon: Users },
  { to: '/inquiries',  label: 'Inquiries',  icon: MessageSquare },
  { to: '/news',       label: 'News',       icon: Newspaper },
  { to: '/careers',    label: 'Careers',    icon: Briefcase },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col h-full bg-navy-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <img src="/images/1logo.png" alt="NovaNest" className="h-9 w-auto flex-shrink-0" />
        <div>
          <p className="font-bold text-white leading-none">NovaNest</p>
          <p className="text-xs text-navy-300 mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
               ${isActive
                ? 'bg-gold-500 text-white'
                : 'text-navy-200 hover:bg-white/10 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-gold-400 text-sm font-semibold">
              {user?.fullName?.[0] || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-navy-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
                     text-navy-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
