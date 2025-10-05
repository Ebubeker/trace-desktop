import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { UserPlus, Users, Mail, Key, User, AlertCircle, CheckCircle, Edit, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com'

export function UserManagement() {
  console.log('[UserManagement] Component mounted/remounted')
  const { userProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingData, setEditingData] = useState({ name: '', role: '' })
  const [updating, setUpdating] = useState({})
  const [deleting, setDeleting] = useState({})
  const [alert, setAlert] = useState(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user'
  })

  const [formErrors, setFormErrors] = useState({})

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
        .select('id, name, role, created_at')
        .eq('org_id', userProfile.org_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        setAlert({ type: 'error', message: 'Failed to fetch users. Please try again.' })
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setAlert({ type: 'error', message: 'Failed to fetch users. Please try again.' })
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (userProfile?.org_id) {
      fetchUsers()
    } else {
      // Ensure loading state is false if org_id is not available
      setLoadingUsers(false)
    }
  }, [userProfile?.org_id])

  const validateForm = () => {
    const errors = {}
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setCreating(true)
    setAlert(null)

    try {
      // Step 1: Create user in Supabase Auth
      console.log('Creating user in Supabase Auth...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error('Auth creation error:', authError)
        setAlert({ 
          type: 'error', 
          message: authError.message || 'Failed to create user account. Please try again.' 
        })
        return
      }

      if (!authData.user?.id) {
        setAlert({ 
          type: 'error', 
          message: 'Failed to get user ID from authentication system.' 
        })
        return
      }

      console.log('Auth user created with ID:', authData.user.id)

      // Step 2: Create user profile in backend with auth user ID
      console.log('Creating user profile in backend...')
      const response = await fetch(`${BACKEND_URL}/api/auth/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: authData.user.id, // Pass the auth user ID
          email: formData.email,
          name: formData.name,
          role: formData.role,
          org_id: userProfile.org_id,
          created_by: userProfile.id
        })
      })

      const backendData = await response.json()

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: `User "${formData.name}" has been created successfully! Auth ID: ${authData.user.id.substring(0, 8)}...` 
        })
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: 'user'
        })
        setFormErrors({})
        setShowCreateForm(false)
        
        // Refresh users list
        await fetchUsers()
      } else {
        // If backend creation fails, we should ideally clean up the auth user
        // but for now just show the error
        console.error('Backend creation failed:', backendData)
        setAlert({ 
          type: 'error', 
          message: `User created in auth but backend failed: ${backendData.message || 'Unknown error'}. Auth ID: ${authData.user.id.substring(0, 8)}...` 
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setAlert({ 
        type: 'error', 
        message: 'Failed to create user. Please check your connection and try again.' 
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = (user) => {
    setEditingUserId(user.id)
    setEditingData({ name: user.name || '', role: user.role || 'user' })
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditingData({ name: '', role: '' })
  }

  const handleUpdateUser = async (userId) => {
    if (!editingData.name.trim()) {
      setAlert({ type: 'error', message: 'Name is required' })
      return
    }

    setUpdating(prev => ({ ...prev, [userId]: true }))
    setAlert(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingData.name,
          role: editingData.role,
          updated_by: userProfile.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: 'User updated successfully!' 
        })
        
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, name: editingData.name, role: editingData.role }
              : user
          )
        )
        
        setEditingUserId(null)
        setEditingData({ name: '', role: '' })
      } else {
        setAlert({ 
          type: 'error', 
          message: data.message || 'Failed to update user. Please try again.' 
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setAlert({ 
        type: 'error', 
        message: 'Failed to update user. Please check your connection and try again.' 
      })
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleDeleteUser = async (userId, userName) => {

    setDeleting(prev => ({ ...prev, [userId]: true }))
    setAlert(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deleted_by: userProfile.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: `User "${userName}" has been deleted successfully!` 
        })
        
        // Remove from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      } else {
        setAlert({ 
          type: 'error', 
          message: data.message || 'Failed to delete user. Please try again.' 
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setAlert({ 
        type: 'error', 
        message: 'Failed to delete user. Please check your connection and try again.' 
      })
    } finally {
      setDeleting(prev => ({ ...prev, [userId]: false }))
    }
  }



  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '!bg-[#111d29] !text-white'
      case 'manager':
        return '!bg-[#111d29]/80 !text-white'
      case 'user':
        return '!bg-[#111d29]/60 !text-white'
      default:
        return '!bg-gray-100 !text-gray-800'
    }
  }

  return (
    <Card className="border border-gray-200/30">
      <CardHeader className="text-[#111d29]">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription className="text-gray-600">
              Create and manage user accounts for your organization
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-2 bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
          >
            <UserPlus className="h-4 w-4" />
            {showCreateForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert Messages */}
        {alert && (
          <Alert className={alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            {alert.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <Card className="border border-gray-200/50 bg-gray-50">
            <CardHeader className="text-[#111d29]">
              <CardTitle className="text-lg font-semibold">Create New User</CardTitle>
              <CardDescription className="text-gray-600">
                Add a new user account to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`pl-10 ${formErrors.name ? 'border-red-500' : ''}`}
                        disabled={creating}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                        disabled={creating}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 ${formErrors.password ? 'border-red-500' : ''}`}
                        disabled={creating}
                      />
                    </div>
                    {formErrors.password && (
                      <p className="text-sm text-red-600">{formErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                        disabled={creating}
                      />
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)} disabled={creating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="bg-[#111d29] hover:bg-[#1a2936] text-white border-none">
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Organization Users</h3>
            <Badge variant="outline">
              {users.length} user{users.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {loadingUsers ? (
            <div className="text-center py-8 text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found in your organization</p>
              <p className="text-sm">Create the first user account to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50">
                  {/* Left: Name */}
                  <div className="flex-1">
                    {editingUserId === user.id ? (
                      <Input
                        value={editingData.name}
                        onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                        className="text-sm"
                        placeholder="Enter name"
                        disabled={updating[user.id]}
                      />
                    ) : (
                      <span className="font-medium text-gray-900">
                        {user.name || 'Unnamed User'}
                      </span>
                    )}
                  </div>

                  {/* Center: Role */}
                  <div className="flex-1 text-center">
                    {editingUserId === user.id ? (
                      <Select 
                        value={editingData.role} 
                        onValueChange={(value) => setEditingData(prev => ({ ...prev, role: value }))}
                        disabled={updating[user.id]}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role?.toUpperCase() || 'USER'}
                      </Badge>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {editingUserId === user.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateUser(user.id)}
                          disabled={updating[user.id]}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {updating[user.id] ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={updating[user.id]}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          disabled={deleting[user.id]}
                          className="h-8 w-8 p-0 text-text-[#111d29] hover:text-[#111d29] hover:bg-[#1a2936]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={deleting[user.id]}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting[user.id] ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 