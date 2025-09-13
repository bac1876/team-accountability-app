import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import './App.css'

// Import components (we'll create these)
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import Navigation from './components/Navigation'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        {user && <Navigation user={user} onLogout={logout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
            } 
          />
          
          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'admin' ? 
                  <AdminDashboard user={user} /> : 
                  <Dashboard user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' ? 
                <AdminDashboard user={user} /> : 
                <Navigate to="/" replace />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              user ? 
                <Dashboard user={user} /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
