import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import './App.css'
import './styles/darkTheme.css'

// Import components (we'll create these)
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import Navigation from './components/Navigation'
import ModernLayout from './components/ModernLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { initializeStorage } from './utils/safeStorage'

// Component that decides which dashboard to show based on navigation
function DashboardRouter({ user }) {
  const { activeTab } = useNavigation()
  
  // Admin-only tabs/views
  const adminOnlyTabs = ['team-overview', 'analytics', 'settings', 'user-management', 'messaging']
  
  // Check if we're on an admin-only view
  const isAdminView = user.role === 'admin' && (
    adminOnlyTabs.includes(activeTab) || 
    window.location.pathname === '/admin'
  )
  
  // Show AdminDashboard for admin-only views, Dashboard for everything else
  if (isAdminView) {
    return <AdminDashboard user={user} />
  }
  
  return <Dashboard user={user} />
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    try {
      // Initialize safe storage and check for reset
      const storageOk = initializeStorage()
      if (!storageOk) {
        console.error('Storage initialization failed')
        // Clear everything and reload
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
        return
      }
      
      // Force clear any conflicting styles/classes first
      document.documentElement.className = ''
      document.body.className = ''
      
      // Always apply dark mode and ensure background
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#010409'
      document.body.style.backgroundColor = '#010409'
      
      // Clear any potentially corrupted localStorage on version mismatch
      const APP_VERSION = '1.0.4' // Incremented for user preservation fix
      const storedVersion = localStorage.getItem('appVersion')
      if (storedVersion !== APP_VERSION) {
        console.log('App version changed, clearing cache but preserving users')
        // Preserve critical user data
        const usersBackup = localStorage.getItem('teamUsers')
        const userDataBackup = localStorage.getItem('userData')
        
        // Clear everything else
        const keysToPreserve = ['teamUsers', 'userData', 'appVersion']
        const allKeys = Object.keys(localStorage)
        allKeys.forEach(key => {
          if (!keysToPreserve.includes(key)) {
            localStorage.removeItem(key)
          }
        })
        
        // Restore user data if it existed
        if (usersBackup) localStorage.setItem('teamUsers', usersBackup)
        if (userDataBackup) localStorage.setItem('userData', userDataBackup)
        
        // Update version
        localStorage.setItem('appVersion', APP_VERSION)
        
        // Clear session storage
        sessionStorage.clear()
        
        // Force page reload after clearing cache
        setTimeout(() => {
          window.location.reload()
        }, 100)
        return
      }
      
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          // Validate the user object structure
          if (parsed && typeof parsed === 'object' && parsed.id) {
            setUser(parsed)
          } else {
            throw new Error('Invalid user object')
          }
        } catch (error) {
          console.error('Error loading user session:', error)
          localStorage.removeItem('currentUser')
        }
      }
    } catch (error) {
      console.error('Critical initialization error:', error)
      // Last resort - clear everything and reload
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('Cannot clear storage:', e)
      }
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (userData) => {
    setUser(userData)
    // Save to localStorage for session persistence
    localStorage.setItem('currentUser', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    // Clear from localStorage
    localStorage.removeItem('currentUser')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <NavigationProvider>
        <Router>
          <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
            } 
          />
          
          {/* Authenticated routes */}
          {user ? (
            <>
              <Route 
                path="/" 
                element={
                  <ModernLayout user={user} onLogout={logout}>
                    <DashboardRouter user={user} />
                  </ModernLayout>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ModernLayout user={user} onLogout={logout}>
                    <Dashboard key="dashboard" user={user} />
                  </ModernLayout>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  user.role === 'admin' ? (
                    <ModernLayout user={user} onLogout={logout}>
                      <DashboardRouter user={user} />
                    </ModernLayout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
    </NavigationProvider>
  )
}

export default App
