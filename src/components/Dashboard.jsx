import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useAuth } from '../hooks/useAuth'
import { TimeTracker } from './TimeTracker'
import { ActivityMonitor } from './ActivityMonitor'
import { Logs } from './Logs'
import { supabase } from '../lib/supabase'

export function Dashboard() {
  const { user, userProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    setLoading(false)
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'user')
        .order('created_at', { ascending: false })

      console.log(data)

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const isUser = userProfile?.role === 'user'
  const isAdmin = userProfile?.role === 'admin'
  
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimeTracker />
            <ActivityMonitor />
          </div>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                View processed activity logs from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User to View Logs:
                  </label>
                  {loadingUsers ? (
                    <div className="text-sm text-gray-500">Loading users...</div>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email} ({user.id.substring(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                {selectedUserId && (
                  <Logs userId={selectedUserId} />
                )}
                
                {!selectedUserId && !loadingUsers && users.length > 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Please select a user to view their activity logs
                  </div>
                )}
                
                {!loadingUsers && users.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No users with 'user' role found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}