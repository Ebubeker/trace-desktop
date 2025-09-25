import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const { ipcRenderer } = window.require('electron');

export function ActivityMonitor({ className }) {
  const [activityData, setActivityData] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for activity data from main process
    const handleActivityData = (event, data) => {
      setActivityData(data)
    }

    ipcRenderer.on('activity-data', handleActivityData)

    return () => {
      ipcRenderer.removeListener('activity-data', handleActivityData)
    }
  }, [])

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatIdleTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  if (!activityData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Activity Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No activity data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            Activity Monitor
            <button 
              onClick={() => setIsVisible(!isVisible)}
              className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              {isVisible ? 'Hide Details' : 'Show Details'}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className={`ml-2 font-medium ${activityData.isTracking ? 'text-green-600' : 'text-red-600'}`}>
                {activityData.isTracking ? 'Tracking' : 'Stopped'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">User State:</span>
              <span className={`ml-2 font-medium ${activityData.idleState?.isIdle ? 'text-orange-600' : 'text-green-600'}`}>
                {activityData.idleState?.isIdle ? 'Idle' : 'Active'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Idle Time:</span>
              <span className="ml-2 font-medium">
                {formatIdleTime(activityData.idleState?.idleTime || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {activityData.timestamp ? new Date(activityData.timestamp).toLocaleTimeString() : 'Never'}
        {activityData.error && (
          <div className="text-red-600 mt-1">Error: {activityData.error}</div>
        )}
      </div>
    </div>
  )
} 