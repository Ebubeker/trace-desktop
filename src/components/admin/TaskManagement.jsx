import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com'

export function TaskManagement() {
  console.log('[TaskManagement] Component mounted/remounted')
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState({})
  const [selectedUserId, setSelectedUserId] = useState('')
  const [showTodayOnly, setShowTodayOnly] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    category: '',
    user_id: ''
  })

  const categories = [
    'Development',
    'Design', 
    'Research',
    'Testing',
    'Documentation',
    'Meeting',
    'Review',
    'Planning',
    'Other'
  ]

  // Helper function to check if a task is from today
  const isTaskFromToday = (task) => {
    if (!task.created_at) return false
    const today = new Date().toDateString()
    const taskDate = new Date(task.created_at).toDateString()
    return today === taskDate
  }

  // Filter tasks based on showTodayOnly state
  const getFilteredTasks = () => {
    if (showTodayOnly) {
      return tasks.filter(isTaskFromToday)
    }
    return tasks
  }

  const fetchUsers = async () => {
    console.log('[TaskManagement] fetchUsers called - org_id:', userProfile?.org_id)
    if (!userProfile?.org_id) {
      console.log('[TaskManagement] Cannot fetch users: org_id not available')
      setLoadingUsers(false)
      return
    }

    console.log('[TaskManagement] Setting loadingUsers to true')
    setLoadingUsers(true)
    try {
      console.log('[TaskManagement] Fetching from Supabase...')
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'user')
        .eq('org_id', userProfile.org_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[TaskManagement] Error fetching users:', error)
        setUsers([])
        setLoadingUsers(false)
        return
      }

      console.log('[TaskManagement] Fetched users:', data?.length, 'users')
      setUsers(data || [])
    } catch (error) {
      console.error('[TaskManagement] Error fetching users:', error)
      setUsers([])
    } finally {
      console.log('[TaskManagement] Setting loadingUsers to false')
      setLoadingUsers(false)
    }
  }

  const fetchTasks = async (userId = null) => {
    setLoadingTasks(true)
    try {
      const targetUserId = userId || selectedUserId
      let url = `${BACKEND_URL}/api/tasks`
      if (targetUserId && targetUserId !== 'all') {
        url += `?user_id=${targetUserId}`
      }
      // When no user is selected or "all" is selected, fetch all tasks (no filter)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    console.log('[TaskManagement] useEffect triggered - org_id:', userProfile?.org_id)
    if (userProfile?.org_id) {
      console.log('[TaskManagement] Fetching users and tasks...')
      fetchUsers()
      fetchTasks()
    } else {
      console.log('[TaskManagement] No org_id, setting loading states to false')
      // Ensure loading state is false if org_id is not available
      setLoadingUsers(false)
      setLoadingTasks(false)
    }
  }, [userProfile?.org_id])

  // Add useEffect to refetch tasks when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      setLoadingTasks(true)
      fetchTasks(selectedUserId)
    }
  }, [selectedUserId])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const taskData = {
        ...formData,
        duration: parseInt(formData.duration) || 0,
        created_by: userProfile?.id,
        status: editingTask ? formData.status || editingTask.status : 'pending'
      }

      const url = editingTask ? `${BACKEND_URL}/api/tasks/${editingTask.id}` : `${BACKEND_URL}/api/tasks`
      const method = editingTask ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          duration: '',
          category: '',
          user_id: ''
        })
        setEditingTask(null)
        
        // Refresh tasks list
        fetchTasks()
        
        alert(editingTask ? 'Task updated successfully!' : 'Task created successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error ${editingTask ? 'updating' : 'creating'} task: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error(`Error ${editingTask ? 'updating' : 'creating'} task:`, error)
      alert(`Error ${editingTask ? 'updating' : 'creating'} task. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setFormData({
      name: task.name,
      description: task.description,
      duration: task.duration.toString(),
      category: task.category,
      user_id: task.user_id,
      status: task.status
    })
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setFormData({
      name: '',
      description: '',
      duration: '',
      category: '',
      user_id: ''
    })
  }

  const handleDelete = async (taskId) => {

    setDeleteLoading(prev => ({ ...prev, [taskId]: true }))

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Refresh tasks list
        fetchTasks()
        alert('Task deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error deleting task: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Error deleting task. Please try again.')
    } finally {
      setDeleteLoading(prev => ({ ...prev, [taskId]: false }))
    }
  }

  const isFormValid = formData.name && formData.description && formData.category && formData.user_id

  return (
    <div className="space-y-6">
      {/* Create/Edit Task Form */}
      <Card className="border border-gray-200/30">
        <CardHeader className="text-[#111d29]">
          <CardTitle className="text-xl font-semibold">{editingTask ? 'Edit Task' : 'Create New Task'}</CardTitle>
          <CardDescription className="text-gray-600">
            {editingTask ? 'Update task details and requirements' : 'Assign tasks to users with specific requirements and duration'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Task Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter task name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="60"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the task requirements and objectives"
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">Assign to User</Label>
                {loadingUsers ? (
                  <div className="text-sm text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-red-500">No users found. Please check if users exist in your organization.</div>
                ) : (
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => handleInputChange('user_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} ({user.id.substring(0, 8)}...)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {editingTask && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading || !isFormValid}
                className="w-full md:w-auto bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
              >
                {loading ? (editingTask ? 'Updating...' : 'Creating...') : (editingTask ? 'Update Task' : 'Create Task')}
              </Button>
              
              {editingTask && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="border border-gray-200/30">
        <CardHeader className="text-[#111d29]">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">
                {showTodayOnly ? "Today's Tasks" : "All Tasks"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {showTodayOnly 
                  ? "Tasks created today" 
                  : "Overview of all created tasks"
                }
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTodayOnly(!showTodayOnly)}
              className="border-[#111d29] text-[#111d29] hover:bg-[#111d29] hover:text-white"
            >
              {showTodayOnly ? 'Show All' : 'Show Today Only'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* User Selection for Viewing Tasks */}
          <div className="mb-6">
            <Label htmlFor="user-select">Select User to View Tasks:</Label>
            {loadingUsers ? (
              <div className="text-sm text-gray-500 mt-2">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-red-500 mt-2">No users found. Please check if users exist in your organization.</div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={(value) => setSelectedUserId(value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select user to view tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.id.substring(0, 8)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {loadingTasks ? (
            <div className="text-center py-4">Loading tasks...</div>
          ) : (() => {
            const filteredTasks = getFilteredTasks()
            return filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium">{task.name}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Category: {task.category}</span>
                        {task.duration && <span>Duration: {task.duration}min</span>}
                        <span>Status: {task.status}</span>
                      </div>
                      {task.created_at && (
                        <div className="text-xs text-gray-400">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(task)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(task.id)}
                        disabled={deleteLoading[task.id]}
                      >
                        {deleteLoading[task.id] ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {showTodayOnly ? "No tasks created today" : "No tasks created yet"}
            </div>
          )
        })()}
        </CardContent>
      </Card>
    </div>
  )
} 