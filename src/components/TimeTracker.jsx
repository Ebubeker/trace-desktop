import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Play, Pause, Square } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { createTimeTrackingSession, updateTimeTrackingSession, fetchTimeTrackingStats } from '../lib/timeTracking'

const { ipcRenderer } = window.require('electron');

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com';

export function TimeTracker({ className }) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isStartingUp, setIsStartingUp] = useState(false)
  const [activityTrackingStatus, setActivityTrackingStatus] = useState({ isTracking: false })
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [pausedTime, setPausedTime] = useState(0) // Track accumulated time before pauses
  const [pauseStartTime, setPauseStartTime] = useState(null) // Track when pause started
  const [currentSessionId, setCurrentSessionId] = useState(null) // Track current session ID
  const [timeStats, setTimeStats] = useState({ today: 0, week: 0 }) // Daily and weekly stats
  const [loadingStats, setLoadingStats] = useState(false)
  const intervalRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isRunning && !isPaused && sessionStartTime) {
      // Calculate time immediately
      const calculateTime = () => {
        const now = new Date()
        const elapsed = Math.floor((now - sessionStartTime) / 1000) - pausedTime
        setTime(Math.max(0, elapsed))
      }
      
      calculateTime() // Set time immediately
      intervalRef.current = setInterval(calculateTime, 1000) // Then update every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, sessionStartTime, pausedTime])

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await ipcRenderer.invoke('activity-status')
        setActivityTrackingStatus(status)
      } catch (error) {
        console.error('Failed to update activity tracking status:', error)
        setActivityTrackingStatus({ isTracking: false })
      }
    }
    
    updateStatus()
    const statusInterval = setInterval(updateStatus, 2000)
    
    return () => clearInterval(statusInterval)
  }, [])

  useEffect(() => {
    return () => {
      ipcRenderer.invoke('activity-stop').catch(console.error)
    }
  }, [])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Fetch daily and weekly time summaries
  const fetchTimeStats = async () => {
    if (!user?.id) return
    
    try {
      setLoadingStats(true)
      const stats = await fetchTimeTrackingStats(user.id)
      setTimeStats(stats)
    } catch (error) {
      console.error('Error fetching time stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Fetch stats when component mounts and user changes
  useEffect(() => {
    if (user?.id) {
      fetchTimeStats()
    }
  }, [user?.id])

  const startTaskProcessing = async () => {
    try {
      if (!user?.id) {
        throw new Error('User ID not available')
      }

      const addUserResponse = await fetch(`${BACKEND_URL}/api/activity/worker/add/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!addUserResponse.ok) {
      }

      const startWorkerResponse = await fetch(`${BACKEND_URL}/api/activity/worker/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

    } catch (error) {
    }
  }

  const startActivityTracking = async () => {
    try {
      console.log('Starting activity tracking...')
      const result = await ipcRenderer.invoke('activity-start', { userId: user?.id })
      if (result.success) {
        console.log('Activity tracking started successfully')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to start activity tracking:', error)
    }
  }

  const setTimerRunning = async (isRunning) => {
    try {
      const result = await ipcRenderer.invoke('activity-set-timer-status', { 
        isRunning, 
        userId: user?.id 
      })
      if (result.success) {
        console.log('Timer status updated:', isRunning)
      } else {
        console.error('Failed to update timer status:', result.error)
      }
    } catch (error) {
      console.error('Failed to update timer status:', error)
    }
  }

  const stopActivityTracking = async () => {
    try {
      console.log('Stopping activity tracking...')
      const result = await ipcRenderer.invoke('activity-stop')
      if (result.success) {
        console.log('Activity tracking stopped')
      } else {
        console.error('Failed to stop activity tracking:', result.error)
      }
    } catch (error) {
      console.error('Failed to stop activity tracking:', error)
    }
  }

  const handlePlay = async () => {
    setIsStartingUp(true)
    const startTime = new Date()
    
    try {
      // Start activity tracking first
      await startActivityTracking()
      
      // eslint-disable-next-line no-unused-vars
      const response = await fetch(`${BACKEND_URL}/api/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      })

      await startTaskProcessing()

      // Create a new time tracking session
      try {
        const sessionId = await createTimeTrackingSession(user?.id, startTime)
        setCurrentSessionId(sessionId)
      } catch (error) {
        console.error('Failed to create time tracking session:', error)
      }
      
    } catch (error) {
      console.error('Failed to start tracking:', error)
    } finally {
      setIsStartingUp(false)
    }
    
    setIsRunning(true)
    setIsPaused(false)
    setSessionStartTime(startTime) // Track when this session started
    setPausedTime(0) // Reset accumulated pause time
    setPauseStartTime(null) // Clear pause start time
    setTime(0) // Reset displayed time
    
    // Notify activity tracker that timer is running
    await setTimerRunning(true)
  }

  const handlePause = async () => {
    setIsPaused(true)
    setIsRunning(false)
    setPauseStartTime(new Date()) // Track when pause started
    
    // Notify activity tracker that timer is paused
    await setTimerRunning(false)
  }

  const handleStop = async () => {
    const endTime = new Date()
    const totalDuration = time // Current tracked time in seconds
    
    // Update the time tracking session with end time
    if (currentSessionId && totalDuration > 0) {
      try {
        await updateTimeTrackingSession(currentSessionId, endTime, totalDuration)
        // Refresh stats to show updated totals
        await fetchTimeStats()
      } catch (error) {
        console.error('Failed to update time tracking session:', error)
      }
    }
    
    setIsRunning(false)
    setIsPaused(false)
    setTime(0)
    setSessionStartTime(null) // Clear session start time
    setPausedTime(0) // Reset accumulated pause time
    setPauseStartTime(null) // Clear pause start time
    setCurrentSessionId(null) // Clear session ID
    
    // Notify activity tracker that timer is stopped
    await setTimerRunning(false)
    
    // Stop activity tracking when stopping the timer
    await stopActivityTracking()
  }

  const handleResume = async () => {
    // Calculate pause duration and add to total paused time
    if (pauseStartTime) {
      const pauseDuration = Math.floor((new Date() - pauseStartTime) / 1000)
      setPausedTime(prev => prev + pauseDuration)
    }
    
    setIsRunning(true)
    setIsPaused(false)
    setPauseStartTime(null) // Clear pause start time
    
    // Notify activity tracker that timer is running again
    await setTimerRunning(true)
  }

  return (
    <Card className={`w-full border border-gray-200/30 ${className}`}>
      <CardHeader className="text-[#111d29] rounded-t-lg">
        <CardTitle className="text-center text-2xl font-semibold">
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-[#111d29] mb-2">
            {formatTime(time)}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              {isStartingUp 
                ? "Starting up..." 
                : isRunning && !isPaused 
                  ? "Running" 
                  : isPaused 
                    ? "Paused" 
                    : "Stopped"
              }
            </div>
            <div className="text-xs">
              Activity Tracking: {activityTrackingStatus.isTracking ? 
                <span className="text-green-600">Running</span> : 
                <span className="text-gray-500">Stopped</span>
              }
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {!isRunning && !isPaused && (
            <Button 
              onClick={handlePlay} 
              size="lg" 
              className="gap-2 bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
              disabled={isStartingUp}
            >
              <Play className="h-4 w-4" />
              {isStartingUp ? "Starting..." : "Start"}
            </Button>
          )}

          {isRunning && !isPaused && (
            <Button 
              onClick={handlePause} 
              variant="outline" 
              size="lg" 
              className="gap-2 border-[#111d29] text-[#111d29] hover:bg-[#111d29] hover:text-white"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}

          {isPaused && (
            <Button 
              onClick={handleResume} 
              size="lg" 
              className="gap-2 bg-[#111d29] hover:bg-[#1a2936] text-white border-none"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}

          {(isRunning || isPaused) && (
            <Button onClick={handleStop} variant="destructive" size="lg" className="gap-2">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}
        </div>

        {time > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Total time tracked: {formatTime(time)}
          </div>
        )}

        {/* Daily and Weekly Stats */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold text-sm text-center">Time Summary</h3>
          
          {loadingStats ? (
            <div className="text-center text-sm text-muted-foreground">
              Loading stats...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-[#111d29]">
                  {formatTime(timeStats.today)}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Today
                </div>
              </div>
              
              <div className="bg-[#111d29] rounded-lg p-3">
                <div className="text-2xl font-bold text-white">
                  {formatTime(timeStats.week)}
                </div>
                <div className="text-xs text-gray-200 font-medium">
                  This Week
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <button
              onClick={fetchTimeStats}
              disabled={loadingStats}
              className="text-xs text-gray-500 hover:text-[#111d29] underline disabled:opacity-50"
            >
              {loadingStats ? 'Refreshing...' : 'Refresh Stats'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}