import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useAuth } from '../hooks/useAuth'
import { TimeTracker } from './TimeTracker'
import { ActivityMonitor } from './ActivityMonitor'
import { TodaysTasks } from './TodaysTasks'
import { AdminDashboard } from './admin/AdminDashboard'
import { supabase } from '../lib/supabase'

export function Dashboard() {
  const { user, userProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      
      // Add timeout wrapper to ensure loading state is reset
      const signOutWithTimeout = Promise.race([
        signOut(),
        new Promise((resolve) => setTimeout(() => resolve({ error: null }), 6000))
      ])
      
      const { error } = await signOutWithTimeout
      if (error) {
        console.error('Failed to sign out:', error)
        alert('Failed to sign out. Please try again.')
      }
    } catch (error) {
      console.error('Error during sign out:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isUser = userProfile?.role === 'user' || !userProfile // Default to user if no profile
  const isAdmin = userProfile?.role === 'admin'

  // If admin, show the admin dashboard
  if (isAdmin) {
    return <AdminDashboard />
  }

  // For users, show the regular dashboard
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#111d29]">
              Welcome to your Dashboard{userProfile?.name ? `, ${userProfile.name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <Button
              onClick={handleSignOut}
              disabled={loading}
              className="bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {isUser && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              <TimeTracker />
              <TodaysTasks />
              {/* <ActivityMonitor /> */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}