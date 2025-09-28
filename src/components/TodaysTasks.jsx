import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com'

export function TodaysTasks() {
  const { userProfile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [expandedTasks, setExpandedTasks] = useState(new Set())

  const fetchTodaysTasks = async () => {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/tasks?user_id=${userProfile.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Show all current tasks (pending and in_progress) plus completed tasks from today
        const today = new Date().toDateString()
        const relevantTasks = (data.tasks || []).filter(task => {
          // Show all pending and in_progress tasks regardless of date
          if (task.status === 'pending' || task.status === 'in_progress') {
            return true
          }
          // For completed tasks, only show those completed today
          if (task.status === 'completed') {
            const completedDate = new Date(task.updated_at || task.created_at).toDateString()
            return completedDate === today
          }
          return false
        })
        setTasks(relevantTasks)
      }
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaysTasks()
  }, [userProfile?.id])

  const handleMarkCompleted = async (taskId) => {
    setUpdating(prev => ({ ...prev, [taskId]: true }))

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed'
        })
      })

      if (response.ok) {
        // Update the task in local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: 'completed' } : task
          )
        )
      } else {
        console.error('Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setUpdating(prev => ({ ...prev, [taskId]: false }))
    }
  }

  const handleTaskClick = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleCheckboxClick = (e, taskId) => {
    e.stopPropagation() // Prevent task expansion when clicking checkbox
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== 'completed') {
      handleMarkCompleted(taskId)
    }
  }

  const pendingTasks = tasks.filter(task => task.status !== 'completed')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  return (
    <Card className="h-fit border border-gray-200/30">
      <CardHeader className="text-[#111d29] rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Clock className="h-5 w-5" />
          Today's Tasks
        </CardTitle>
        <CardDescription className="text-gray-600">
          Your assigned tasks for today
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No tasks assigned for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Pending ({pendingTasks.length})
                </h4>
                <div className="space-y-1">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="group">
                      {/* Main task item */}
                      <div 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        {/* Checkbox */}
                        <div
                          className="flex-shrink-0 cursor-pointer"
                          onClick={(e) => handleCheckboxClick(e, task.id)}
                        >
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                            updating[task.id] 
                              ? 'border-[#111d29] bg-gray-50' 
                              : 'border-gray-300 hover:border-[#111d29]'
                          }`}>
                            {updating[task.id] && (
                              <div className="w-2 h-2 bg-[#111d29] rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>

                        {/* Task content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-sm truncate">{task.name}</span>
                              {task.category && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {task.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {task.duration && (
                                <span className="text-xs text-gray-500 font-medium">
                                  {task.duration}min
                                </span>
                              )}
                              {task.description && (
                                <div className="text-gray-400">
                                  {expandedTasks.has(task.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable description */}
                      {task.description && expandedTasks.has(task.id) && (
                        <div className="ml-8 mr-2 mb-2 p-3 bg-gray-50 border-l-4 border-[#111d29] rounded-lg">
                          <p className="text-sm text-gray-700">{task.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Completed ({completedTasks.length})
                </h4>
                <div className="space-y-1">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="group">
                      {/* Main task item */}
                      <div 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors opacity-75"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        {/* Completed checkbox */}
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 bg-[#111d29] border-2 border-[#111d29] rounded flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        {/* Task content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-sm text-gray-600 line-through truncate">
                                {task.name}
                              </span>
                              {task.category && (
                                <Badge variant="outline" className="text-xs flex-shrink-0 opacity-60">
                                  {task.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {task.duration && (
                                <span className="text-xs text-gray-400 font-medium line-through">
                                  {task.duration}min
                                </span>
                              )}
                              {task.description && (
                                <div className="text-gray-300">
                                  {expandedTasks.has(task.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable description */}
                      {task.description && expandedTasks.has(task.id) && (
                        <div className="ml-8 mr-2 mb-2 p-3 bg-gray-50 rounded-lg border-l-4 border-[#111d29] opacity-75">
                          <p className="text-sm text-gray-600 line-through">{task.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 