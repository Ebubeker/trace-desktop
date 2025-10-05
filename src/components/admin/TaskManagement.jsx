import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  CheckCircle, 
  Circle,
  Eye,
  Calendar,
  Clock,
  User,
  Tag
} from 'lucide-react'

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
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [statusLoading, setStatusLoading] = useState({})
  
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      category: '',
      user_id: ''
    })
    setEditingTask(null)
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  const handleQuickStatusChange = async (taskId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [taskId]: true }))
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Refresh tasks list
        fetchTasks()
        showNotification(`Task status updated to ${newStatus}!`, 'success')
      } else {
        const errorData = await response.json()
        showNotification(`Error updating task status: ${errorData.message || response.statusText}`, 'error')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      showNotification('Error updating task status. Please try again.', 'error')
    } finally {
      setStatusLoading(prev => ({ ...prev, [taskId]: false }))
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setSelectedTask(null)
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
        // Reset form immediately after successful submission
        resetForm()
        
        // Refresh tasks list
        fetchTasks()
        
        showNotification(editingTask ? 'Task updated successfully!' : 'Task created successfully!', 'success')
      } else {
        const errorData = await response.json()
        showNotification(`Error ${editingTask ? 'updating' : 'creating'} task: ${errorData.message || response.statusText}`, 'error')
      }
    } catch (error) {
      console.error(`Error ${editingTask ? 'updating' : 'creating'} task:`, error)
      showNotification(`Error ${editingTask ? 'updating' : 'creating'} task. Please try again.`, 'error')
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
    resetForm()
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
        showNotification('Task deleted successfully!', 'success')
      } else {
        const errorData = await response.json()
        showNotification(`Error deleting task: ${errorData.message || response.statusText}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      showNotification('Error deleting task. Please try again.', 'error')
    } finally {
      setDeleteLoading(prev => ({ ...prev, [taskId]: false }))
    }
  }

  const isFormValid = formData.name && formData.description && formData.category && formData.user_id

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Create/Edit Task Form */}
      <Card className="border border-gray-200/30">
        <CardHeader className={`text-[#111d29]`}>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            {editingTask ? (
              <>
                <Edit3 className="w-5 h-5 text-[#111d29]/50" />
                Edit Task: {editingTask.name}
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-[#111d29]" />
                Create New Task
              </>
            )}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {editingTask ? 'Update task details and requirements below' : 'Assign tasks to users with specific requirements and duration'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={editingTask?.id || 'new'} onSubmit={handleSubmit} className="space-y-4">
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
                className={`w-full md:w-auto border-none ${
                  editingTask 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-[#111d29] hover:bg-[#1a2936] text-white'
                }`}
              >
                {loading ? (
                  editingTask ? 'Updating...' : 'Creating...'
                ) : (
                  editingTask ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Task
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )
                )}
              </Button>
              
              {editingTask && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="w-full md:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Edit
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
              <div className="space-y-2">
                {filteredTasks.slice(0, 10).map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      editingTask?.id === task.id ? 'bg-blue-50 border-blue-300 shadow-md' : ''
                    }`}
                    onClick={() => handleTaskClick(task)}
                  >
                    {/* Checkbox for quick status change */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newStatus = task.status === 'completed' ? 'pending' : 'completed'
                          handleQuickStatusChange(task.id, newStatus)
                        }}
                        disabled={statusLoading[task.id]}
                        className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">{task.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{task.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>Category: {task.category}</span>
                        {task.duration && <span>Duration: {task.duration}min</span>}
                        {task.created_at && (
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(task)
                        }}
                        disabled={loading}
                        className="text-xs border-[#111d29] text-[#111d29] hover:bg-blue-50"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(task.id)
                        }}
                        disabled={deleteLoading[task.id]}
                        className="text-xs"
                      >
                        {deleteLoading[task.id] ? (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
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

      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTask.name}</h2>
                <button
                  onClick={closeTaskModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedTask.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Category
                    </h3>
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {selectedTask.category}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </h3>
                    <p className="text-gray-600">
                      {selectedTask.duration ? `${selectedTask.duration} minutes` : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      {selectedTask.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : selectedTask.status === 'in_progress' ? (
                        <Clock className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-yellow-600" />
                      )}
                      Status
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedTask.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedTask.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created
                    </h3>
                    <p className="text-gray-600">
                      {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                {selectedTask.user_id && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assigned User
                    </h3>
                    <p className="text-gray-600">
                      {users.find(u => u.id === selectedTask.user_id)?.name || 'Unknown User'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  onClick={() => {
                    closeTaskModal()
                    handleEdit(selectedTask)
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
                <Button
                  variant="outline"
                  onClick={closeTaskModal}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 