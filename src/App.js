import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { Dashboard } from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function AppContent() {
  const { user, userProfile, loading } = useAuth()
  const [appReady, setAppReady] = useState(false)

  // Add debugging
  useEffect(() => {
    console.log('App state:', { user: !!user, userProfile: !!userProfile, loading, appReady })
  }, [user, userProfile, loading, appReady])

  // Add a small delay to ensure proper rendering on macOS
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true)
    }, 100) // Small delay to prevent white screen on macOS

    return () => clearTimeout(timer)
  }, [])

  if (loading || !appReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#111d29] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {user ? (
        <Dashboard />
      ) : (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img 
                src="/pulselog.png" 
                alt="Pulselog" 
                className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg"
              />
              <h1 className="text-3xl font-bold text-[#111d29] mb-2">Pulselog</h1>
              <p className="text-gray-600">Track your productivity and manage tasks</p>
            </div>
            <AuthForm />
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App