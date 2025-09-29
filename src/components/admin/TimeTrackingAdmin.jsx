import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Clock, Calendar, User, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com'

export function TimeTrackingAdmin() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('all')
  const [timeData, setTimeData] = useState([])
  const [summaryStats, setSummaryStats] = useState({})
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingTimeData, setLoadingTimeData] = useState(false)
  const [dateRange, setDateRange] = useState('week') // today, week, month, all

  const fetchUsers = async () => {
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

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchTimeTrackingData = async () => {
    setLoadingTimeData(true)
    try {
      let url
      if (selectedUserId === 'all') {
        // Fetch all users' stats
        url = `${BACKEND_URL}/api/time-tracking/stats`
      } else {
        // Fetch specific user's stats
        url = `${BACKEND_URL}/api/time-tracking/stats/${selectedUserId}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        if (selectedUserId === 'all') {
          // Handle all users response structure
          setTimeData(data.users_stats || [])
          setSummaryStats({
            total_seconds: getTotalSeconds(data.totals, dateRange),
            active_users: data.total_users || 0,
            avg_session_seconds: calculateAverageSession(data.totals, dateRange),
            user_summaries: data.users_stats || []
          })
        } else {
          // Handle individual user response structure
          setTimeData([])
          setSummaryStats({
            total_seconds: getTotalSeconds(data, dateRange),
            active_users: 1,
            avg_session_seconds: getTotalSeconds(data, dateRange) / getSessionsCount(data, dateRange) || 0,
            user_summaries: []
          })
        }
      } else {
        console.error('Failed to fetch time tracking data')
      }
    } catch (error) {
      console.error('Error fetching time tracking data:', error)
    } finally {
      setLoadingTimeData(false)
    }
  }

  // Helper functions to get data based on date range
  const getTotalSeconds = (data, range) => {
    switch (range) {
      case 'today':
        return data.today_seconds || 0
      case 'week':
        return data.week_seconds || 0
      default:
        return data.week_seconds || 0
    }
  }

  const getSessionsCount = (data, range) => {
    switch (range) {
      case 'today':
        return data.sessions_today || 0
      case 'week':
        return data.sessions_week || 0
      default:
        return data.sessions_week || 0
    }
  }

  const calculateAverageSession = (totals, range) => {
    const totalSeconds = getTotalSeconds(totals, range)
    const totalSessions = getSessionsCount(totals, range)
    return totalSessions > 0 ? Math.floor(totalSeconds / totalSessions) : 0
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (users.length > 0) {
      fetchTimeTrackingData()
    }
  }, [selectedUserId, dateRange, users])

  const formatTime = (seconds) => {
    if (!seconds) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRangeLabel = (range) => {
    switch (range) {
      case 'today': return 'Today'
      case 'week': return 'This Week'
      default: return 'This Week'
    }
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? (user.name || user.email) : 'Unknown User'
  }

  return (
    <Card className="border border-gray-200/30">
      <CardHeader className="text-[#111d29]">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Clock className="h-5 w-5" />
          Time Tracking Analytics
        </CardTitle>
        <CardDescription className="text-gray-600">
          Monitor and analyze user time tracking across your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Filter:
            </label>
            {loadingUsers ? (
              <div className="text-sm text-gray-500">Loading users...</div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range:
            </label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={fetchTimeTrackingData} disabled={loadingTimeData}>
              {loadingTimeData ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Time</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatTime(summaryStats.total_seconds)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-700">
                    {summaryStats.active_users || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg Session</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatTime(summaryStats.avg_session_seconds)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Tracking Data Display */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {selectedUserId === 'all' 
                ? `User Statistics - ${getRangeLabel(dateRange)}`
                : `Time Tracking Sessions - ${getRangeLabel(dateRange)}`
              }
            </h3>
            <Badge variant="outline">
              {selectedUserId === 'all'
                ? `${timeData.length} user${timeData.length !== 1 ? 's' : ''}`
                : `${timeData.length} session${timeData.length !== 1 ? 's' : ''}`
              }
            </Badge>
          </div>

          {loadingTimeData ? (
            <div className="text-center py-8 text-gray-500">
              Loading time tracking data...
            </div>
          ) : timeData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {selectedUserId === 'all'
                  ? 'No user time tracking data found for the selected criteria'
                  : 'No time tracking sessions found for the selected criteria'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedUserId === 'all' ? (
                // Render user statistics
                timeData.map((userStat) => (
                  <Card key={userStat.user_id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{getUserName(userStat.user_id)}</p>
                            <p className="text-sm text-gray-600">
                              {getSessionsCount(userStat, dateRange)} session{getSessionsCount(userStat, dateRange) !== 1 ? 's' : ''} tracked
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-bold text-lg">
                              {formatTime(getTotalSeconds(userStat, dateRange))}
                            </span>
                          </div>
                          <Badge variant="default">
                            {getTotalSeconds(userStat, dateRange) > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Render individual user sessions (this would need a different endpoint for session details)
                <div className="text-center py-8 text-gray-500">
                  <p>Individual session details coming soon</p>
                  <p className="text-sm">Currently showing summary stats for selected user</p>
                </div>
              )}
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  )
} 