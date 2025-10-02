import React, { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { TaskManagement } from './TaskManagement'
import { TimeTrackingAdmin } from './TimeTrackingAdmin'
import { UserManagement } from './UserManagement'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Logs } from '../Logs'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { UserCircle, Mail, User, LogOut } from 'lucide-react'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com'

export function AdminDashboard() {
  const { user, userProfile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('activity')
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [organizationData, setOrganizationData] = useState(null)
  const [loadingOrganization, setLoadingOrganization] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    setLoading(false)
  }

  const fetchOrganizationData = async () => {
    if (!userProfile?.org_id) return

    setLoadingOrganization(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/organization/${userProfile.org_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizationData(data)
      } else {
        console.error('Failed to fetch organization data')
        setOrganizationData(null)
      }
    } catch (error) {
      console.error('Error fetching organization data:', error)
      setOrganizationData(null)
    } finally {
      setLoadingOrganization(false)
    }
  }

  const fetchUsers = async () => {
    if (!userProfile?.org_id) {
      console.log('Cannot fetch users: org_id not available')
      setLoadingUsers(false)
      return
    }

    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'user')
        .eq('org_id', userProfile.org_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      console.log('Fetched users for activity logs:', data?.length, 'users')
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'activity' && userProfile?.org_id) {
      fetchUsers()
    } else if (activeTab === 'profile') {
      fetchOrganizationData()
    }
  }, [activeTab, userProfile?.org_id])

  React.useEffect(() => {
    if (activeTab === 'profile' && userProfile?.org_id) {
      fetchOrganizationData()
    }
  }, [userProfile?.org_id])

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <Card className="border border-gray-200/30">
            <CardHeader className="text-[#111d29]">
              <CardTitle className="text-xl font-semibold">Activity Logs</CardTitle>
              <CardDescription className="text-gray-600">
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
                      className="w-full px-3 py-2 border border-gray-200/50 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111d29]/20 focus:border-[#111d29]"
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email} ({user.id.substring(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  )}
                  {!loadingUsers && users.length === 0 && (
                    <div className="text-sm text-red-500 mt-2">
                      No users found or failed to load users. Check console for errors.
                    </div>
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
        )

      case 'tasks':
        return <TaskManagement />

      case 'time-tracking':
        return <TimeTrackingAdmin />

      case 'users':
        return <UserManagement />

      case 'profile':
        return (
          <Card className="border border-gray-200/30">
            <CardHeader className="text-[#111d29]">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <UserCircle className="h-5 w-5" />
                Profile & Organization
              </CardTitle>
              <CardDescription className="text-gray-600">
                View your profile and organization details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Profile Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">User Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {userProfile?.name || 'Not provided'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-600">Email Address</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {user?.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <div className="mt-1">
                        <Badge className={`${
                          userProfile?.role === 'admin' 
                            ? 'bg-red-100 text-red-800'
                            : userProfile?.role === 'manager'
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {userProfile?.role?.toUpperCase() || 'USER'}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-600">User ID</label>
                      <p className="text-sm font-mono text-gray-700 mt-1 break-all">
                        {user?.id || 'Not available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Organization</h3>
                {loadingOrganization ? (
                  <div className="bg-gray-50 border border-gray-200/50 rounded-lg p-6 text-center">
                    <div className="text-[#111d29]">Loading organization details...</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[#111d29]">Organization Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {organizationData?.organization.name || 'Not available'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-[#111d29]">Organization Type</label>
                        <p className="text-sm text-gray-700 mt-1">
                          {organizationData?.type || 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-[#111d29]">Organization ID</label>
                        <p className="text-sm font-mono text-gray-600 mt-1 break-all">
                          {userProfile?.org_id || 'Not available'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-[#111d29]">Member Since</label>
                        <p className="text-sm text-gray-700 mt-1">
                          {userProfile?.created_at 
                            ? new Date(userProfile.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Not available'
                          }
                        </p>
                      </div>
                    </div>

                    {organizationData?.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <label className="text-sm font-medium text-[#111d29]">Description</label>
                        <p className="text-sm text-gray-700 mt-1">
                          {organizationData.description}
                        </p>
                      </div>
                    )}

                    {organizationData?.created_at && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <div className="flex justify-between items-center text-xs text-[#111d29]">
                          <span>Organization created: {new Date(organizationData.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                          {organizationData.total_members && (
                            <span>{organizationData.total_members} member{organizationData.total_members !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#111d29] rounded-lg p-4 text-center text-white">
                    <div className="text-2xl font-bold mb-1">
                      {userProfile?.role === 'admin' ? 'Full' : 'Limited'}
                    </div>
                    <div className="text-sm text-gray-200">Access Level</div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#111d29] mb-1">
                      Active
                    </div>
                    <div className="text-sm text-gray-600">Account Status</div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#111d29] mb-1">
                      {user?.email_confirmed_at ? 'Verified' : 'Pending'}
                    </div>
                    <div className="text-sm text-gray-600">Email Status</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleSignOut}
                    className="bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with user info */}
        <Card className="border border-gray-200/30">
          <CardContent className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#111d29]">
              Admin Dashboard{userProfile?.name ? ` - ${userProfile.name}` : ''}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
} 