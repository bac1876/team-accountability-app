import { createContext, useContext, useState } from 'react'

const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  // Start with commitment for regular users, team-overview for admin when on /admin path
  const initialTab = window.location.pathname === '/admin' ? 'team-overview' : 'commitment'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const navigateToTab = (tab) => {
    console.log('Setting active tab to:', tab)
    setActiveTab(tab)
  }
  
  return (
    <NavigationContext.Provider value={{ activeTab, navigateToTab }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}