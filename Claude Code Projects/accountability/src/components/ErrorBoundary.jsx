import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { AlertCircle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    // Clear all localStorage to fix potential corruption
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.error('Failed to clear storage:', e)
    }
    // Reload the page
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-900">
              Something went wrong
            </h1>
            <p className="text-gray-600 text-center mb-6">
              The application encountered an error. This might be due to corrupted data in your browser.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Application
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary