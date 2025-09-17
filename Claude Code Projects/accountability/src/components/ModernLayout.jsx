import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useNavigation } from '../context/NavigationContext'
import { 
  LayoutDashboard, Target, Phone, MessageSquare, Users, 
  Settings, LogOut, Menu, X, ChevronDown, Bell, Search,
  Calendar, CheckCircle, TrendingUp, Activity, Star
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { cn } from '@/lib/utils.js'

const ModernLayout = ({ user, onLogout, children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeTab, navigateToTab } = useNavigation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      tab: 'commitment',
      path: '/',
      badge: null
    },
    {
      label: 'Weekly Goals',
      icon: Target,
      tab: 'goals',
      path: '/',
      badge: null
    },
    {
      label: 'Daily Focus',
      icon: Star,
      tab: 'focus',
      path: '/',
      badge: 'New'
    },
    {
      label: 'Phone Calls',
      icon: Phone,
      tab: 'calls',
      path: '/',
      badge: null
    },
    {
      label: 'Reflections',
      icon: MessageSquare,
      tab: 'reflection',
      path: '/',
      badge: null
    }
  ]

  const adminItems = [
    {
      label: 'Team Overview',
      icon: Users,
      tab: 'team-overview',
      path: '/admin',
      badge: null
    },
    {
      label: 'Analytics',
      icon: TrendingUp,
      tab: 'analytics',
      path: '/admin',
      badge: null
    },
    {
      label: 'Settings',
      icon: Settings,
      tab: 'settings',
      path: '/admin',
      badge: null
    }
  ]

  const currentNavItems = user?.role === 'admin' 
    ? [...navigationItems, ...adminItems]
    : navigationItems

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Static gradient background - no animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20",
        "bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <span className="text-white font-bold text-lg tracking-tight">
                  Accountability
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition-colors lg:block hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {currentNavItems.map((item) => {
              // Check if active based on tab or path
              const isActive = item.tab ? activeTab === item.tab : location.pathname === item.path
              
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.tab) {
                      // Use context for tab navigation
                      console.log('Switching to tab:', item.tab)
                      navigateToTab(item.tab)
                      if (location.pathname !== '/') {
                        navigate('/')
                      }
                    } else {
                      // Use regular navigation for non-tab routes
                      console.log('Navigating to:', item.path)
                      navigate(item.path)
                    }
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn("flex-shrink-0", sidebarOpen ? "w-5 h-5" : "w-6 h-6")} />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-blue-500 text-white border-0">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-slate-800/50">
            <div className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-xl",
              "bg-slate-800/30 backdrop-blur"
            )}>
              <Avatar className="w-10 h-10 border-2 border-blue-500/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400 hover:text-white lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Date/Time */}
              <div className="hidden lg:flex items-center space-x-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{new Date().toLocaleDateString()}</span>
              </div>

              {/* Logout Button */}
              <Button
                onClick={onLogout}
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <LogOut className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800">
            {/* Mobile menu content - similar to desktop sidebar */}
            <div className="flex flex-col h-full">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
                <span className="text-white font-bold text-lg">Accountability</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Add navigation items here */}
            </div>
          </aside>
        </div>
      )}

    </div>
  )
}

export default ModernLayout