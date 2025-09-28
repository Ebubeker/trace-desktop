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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Welcome to your Dashboard{userProfile?.name ? `, ${userProfile.name}` : ''}!
            </CardTitle>
            <CardDescription>
              <div className="space-y-1">
                <p>Email: {user?.email}</p>
                {userProfile?.role && <p>Role: {userProfile.role}</p>}
                {userProfile?.created_at && (
                  <p>Member since: {new Date(userProfile.created_at).toLocaleDateString()}</p>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} disabled={loading} variant="outline">
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