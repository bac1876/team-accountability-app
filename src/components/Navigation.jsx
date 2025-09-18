import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { LogOut, Home, Settings, Menu, X } from 'lucide-react'

const Navigation = ({ user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <nav className="bg-white border-b border-border px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-lg md:text-xl font-bold text-primary">
              Team Accountability
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:ml-6 space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard' || location.pathname === '/'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Dashboard
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-10 w-10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border mt-3 pt-3 pb-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                location.pathname === '/dashboard' || location.pathname === '/'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Home className="w-5 h-5 inline mr-3" />
              Dashboard
            </Link>

            {user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Settings className="w-5 h-5 inline mr-3" />
                Admin
              </Link>
            )}

            <div className="border-t border-border mt-3 pt-3">
              <div className="px-3 py-2 text-sm text-muted-foreground">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs capitalize">{user.role}</div>
              </div>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout()
                }}
                variant="ghost"
                size="lg"
                className="w-full justify-start px-3 mt-2"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation