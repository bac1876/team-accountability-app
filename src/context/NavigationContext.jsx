import { createContext, useContext, useState } from 'react'

const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  // Start with commitment for regular users, team-overview for admin when on /admin path
  const initialTab = window.location.pathname === '/admin' ? 'team-overview' : 'dashboard'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const navigateToTab = (tab) => {
    console.log('Setting active tab to:', tab)
    setActiveTab(tab)
  }

  const navigateToCommitmentDate = (date) => {
    console.log('Navigating to commitment date:', date)
    setSelectedDate(date)
    setActiveTab('commitment')
  }

  return (
    <NavigationContext.Provider value={{
      activeTab,
      navigateToTab,
      selectedDate,
      setSelectedDate,
      navigateToCommitmentDate
    }}>
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