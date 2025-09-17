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
import { NavigationProvider, useNavigation } from './context/NavigationContext'

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
    // Force clear any conflicting styles/classes first
    document.documentElement.className = ''
    document.body.className = ''
    
    // Always apply dark mode
    document.documentElement.classList.add('dark')
    
    // Clear any potentially corrupted localStorage on version mismatch
    const APP_VERSION = '1.0.1'
    const storedVersion = localStorage.getItem('appVersion')
    if (storedVersion !== APP_VERSION) {
      console.log('App version changed, clearing localStorage')
      // Keep the current user but clear other potentially corrupted data
      const currentUser = localStorage.getItem('currentUser')
      localStorage.clear()
      if (currentUser) {
        localStorage.setItem('currentUser', currentUser)
      }
      localStorage.setItem('appVersion', APP_VERSION)
    }
    
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error loading user session:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setLoading(false)
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
