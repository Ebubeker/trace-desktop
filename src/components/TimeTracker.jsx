import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Play, Pause, Square } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const { ipcRenderer } = window.require('electron');

export function TimeTracker({ className }) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isStartingUp, setIsStartingUp] = useState(false)
  const [activityTrackingStatus, setActivityTrackingStatus] = useState({ isTracking: false })
  // eslint-disable-next-line no-unused-vars  
  const [sessionStartTime, setSessionStartTime] = useState(null) // Track session for analytics
  const intervalRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
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
  }, [isRunning, isPaused])

  // Monitor Activity Tracking status
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Stop activity tracking when component unmounts
      ipcRenderer.invoke('activity-stop').catch(console.error)
    }
  }, [])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startTaskProcessing = async () => {
    try {
      if (!user?.id) {
        throw new Error('User ID not available')
      }

      const addUserResponse = await fetch(`https://loop-1lxq.onrender.com/api/activity/worker/add/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!addUserResponse.ok) {
        // Continue anyway, user might already be added
      }

      // eslint-disable-next-line no-unused-vars
      const startWorkerResponse = await fetch('https://loop-1lxq.onrender.com/api/activity/worker/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

    } catch (error) {
      // Don't fail the entire start process if task processing fails
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
      // Continue with timer even if tracking fails
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
    
    try {
      // Start activity tracking first
      await startActivityTracking()
      
      // eslint-disable-next-line no-unused-vars
      const response = await fetch('https://loop-1lxq.onrender.com/api/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      })

      await startTaskProcessing()
      
    } catch (error) {
      console.error('Failed to start tracking:', error)
    } finally {
      setIsStartingUp(false)
    }
    
    setIsRunning(true)
    setIsPaused(false)
    setSessionStartTime(new Date()) // Track when this session started
    
    // Notify activity tracker that timer is running
    await setTimerRunning(true)
  }

  const handlePause = async () => {
    setIsPaused(true)
    setIsRunning(false)
    
    // Notify activity tracker that timer is paused
    await setTimerRunning(false)
  }

  const handleStop = async () => {
    setIsRunning(false)
    setIsPaused(false)
    setTime(0)
    setSessionStartTime(null) // Clear session start time
    
    // Notify activity tracker that timer is stopped
    await setTimerRunning(false)
    
    // Stop activity tracking when stopping the timer
    await stopActivityTracking()
  }

  const handleResume = async () => {
    setIsRunning(true)
    setIsPaused(false)
    
    // Notify activity tracker that timer is running again
    await setTimerRunning(true)
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-primary mb-2">
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
              className="gap-2"
              disabled={isStartingUp}
            >
              <Play className="h-4 w-4" />
              {isStartingUp ? "Starting..." : "Start"}
            </Button>
          )}

          {isRunning && !isPaused && (
            <Button onClick={handlePause} variant="outline" size="lg" className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}

          {isPaused && (
            <Button onClick={handleResume} size="lg" className="gap-2">
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
      </CardContent>
    </Card>
  )
}