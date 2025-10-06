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
  const [showFallback, setShowFallback] = useState(false)

  // Add debugging
  useEffect(() => {
    console.log('Dashboard state:', { 
      user: !!user, 
      userProfile: !!userProfile, 
      userRole: userProfile?.role,
      userEmail: user?.email,
      showFallback
    })
  }, [user, userProfile, showFallback])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && !userProfile) {
        setShowFallback(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [user, userProfile])

  useEffect(() => {
    if (userProfile) {
      setShowFallback(false)
    }
  }, [userProfile])

  const handleSignOut = async () => {
    try {
      setLoading(true)
      
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

  const isUser = userProfile?.role === 'user' || (!userProfile && showFallback) // Default to user if no profile after timeout
  const isAdmin = userProfile?.role === 'admin'
  
  // Debug role determination
  useEffect(() => {
    console.log('Role determination:', {
      userProfileRole: userProfile?.role,
      isUser,
      isAdmin,
      showFallback,
      hasUserProfile: !!userProfile
    })
  }, [userProfile?.role, isUser, isAdmin, showFallback, userProfile])
  
  // If userProfile is still loading and we haven't timed out, show loading state
  if (!userProfile && !showFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#111d29] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we load your account information</p>
        </div>
      </div>
    )
  }

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
              {!userProfile && showFallback && <span className="text-sm text-gray-500 ml-2">(Profile loading...)</span>}
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