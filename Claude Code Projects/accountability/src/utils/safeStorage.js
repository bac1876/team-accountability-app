// Safe localStorage wrapper with error handling and validation

const APP_VERSION = '1.0.2' // Increment this to force clear old data
const VERSION_KEY = 'app_version'

export const safeLocalStorage = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key)
      // Check if it's valid JSON for our app data
      if (key.includes('_data') && item) {
        try {
          JSON.parse(item)
        } catch {
          console.warn(`Corrupted data in ${key}, removing...`)
          localStorage.removeItem(key)
          return null
        }
      }
      return item
    } catch (error) {
      console.error('localStorage read error:', error)
      return null
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error('localStorage write error:', error)
      // Try to clear some space if quota exceeded
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting cleanup...')
        cleanupOldData()
        try {
          localStorage.setItem(key, value)
          return true
        } catch {
          return false
        }
      }
      return false
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('localStorage remove error:', error)
      return false
    }
  },

  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('localStorage clear error:', error)
      return false
    }
  },

  // Check if storage is working properly
  isWorking: () => {
    try {
      const testKey = '__test_storage__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}

// Clean up old or corrupted data
function cleanupOldData() {
  // Protected keys that should never be automatically deleted
  const protectedKeys = [
    'teamUsers',        // User database
    'userData',         // User data
    'usersInitialized', // Flag to prevent re-initialization
    'currentUser',      // Current session
    'appVersion'        // App version
  ]
  
  const allKeys = Object.keys(localStorage)
  
  allKeys.forEach(key => {
    // Only remove keys that aren't protected
    if (!protectedKeys.includes(key) && 
        !key.includes('user') && 
        !key.includes('User')) {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error(`Failed to remove ${key}:`, e)
      }
    }
  })
}

// Validate and fix stored data
export function validateStoredData() {
  const currentVersion = safeLocalStorage.getItem(VERSION_KEY)
  
  // Force clear if version mismatch or first run
  if (currentVersion !== APP_VERSION) {
    console.log('App version changed, validating data...')
    
    // Validate each stored item
    const userData = safeLocalStorage.getItem('user_data')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        // Basic structure validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid user data structure')
        }
      } catch (e) {
        console.error('Corrupted user data, clearing...', e)
        safeLocalStorage.removeItem('user_data')
      }
    }
    
    // Update version
    safeLocalStorage.setItem(VERSION_KEY, APP_VERSION)
  }
}

// Check for reset parameter in URL
export function checkForReset() {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('reset') === 'true') {
    console.log('Reset parameter detected, clearing storage but preserving users...')
    
    // Preserve user data before clearing
    const usersBackup = localStorage.getItem('teamUsers')
    const userDataBackup = localStorage.getItem('userData')
    const usersInitialized = localStorage.getItem('usersInitialized')
    
    // Clear storage
    safeLocalStorage.clear()
    
    // Restore user data
    if (usersBackup) localStorage.setItem('teamUsers', usersBackup)
    if (userDataBackup) localStorage.setItem('userData', userDataBackup)
    if (usersInitialized) localStorage.setItem('usersInitialized', usersInitialized)
    
    // Remove the reset parameter from URL
    urlParams.delete('reset')
    const newUrl = window.location.pathname + 
      (urlParams.toString() ? '?' + urlParams.toString() : '')
    window.history.replaceState({}, document.title, newUrl)
    return true
  }
  
  // Check for full reset (including users) - requires explicit parameter
  if (urlParams.get('fullreset') === 'true') {
    console.log('Full reset parameter detected, clearing ALL storage including users...')
    safeLocalStorage.clear()
    localStorage.removeItem('usersInitialized')
    
    // Remove the reset parameter from URL
    urlParams.delete('fullreset')
    const newUrl = window.location.pathname + 
      (urlParams.toString() ? '?' + urlParams.toString() : '')
    window.history.replaceState({}, document.title, newUrl)
    return true
  }
  
  return false
}

// Initialize storage safety checks
export function initializeStorage() {
  // Check if localStorage is available and working
  if (!safeLocalStorage.isWorking()) {
    console.error('localStorage is not available or not working properly')
    // Try to clear and fix
    try {
      localStorage.clear()
    } catch (e) {
      console.error('Cannot clear localStorage:', e)
    }
    return false
  }
  
  // Check for reset request
  if (checkForReset()) {
    console.log('Storage reset completed')
    return true
  }
  
  // Validate existing data
  validateStoredData()
  
  return true
}

export default safeLocalStorage