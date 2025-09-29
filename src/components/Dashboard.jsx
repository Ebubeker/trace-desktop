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
    setLoading(true)
    await signOut()
    setLoading(false)
  }

  const isUser = userProfile?.role === 'user'
  const isAdmin = userProfile?.role === 'admin'

  // If admin, show the admin dashboard
  if (isAdmin) {
    return <AdminDashboard />
  }

  // For users, show the regular dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border border-gray-200/30">
          <CardContent className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">
              Welcome to your Dashboard{userProfile?.name ? `, ${userProfile.name}` : ''}!
            </h1>
            <Button
              onClick={handleSignOut}
              disabled={loading}
              className="bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>

        {isUser && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            <TimeTracker />
            <TodaysTasks />
            {/* <ActivityMonitor /> */}
          </div>
        )}
      </div>
    </div>
  )
}