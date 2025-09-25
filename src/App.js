import React from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { Dashboard } from './components/Dashboard'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {user ? (
        <Dashboard />
      ) : (
        <div className="min-h-screen flex items-center justify-center p-4">
          <AuthForm />
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App