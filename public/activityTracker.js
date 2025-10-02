const { activeWindow } = require('get-windows');
const { default: psList } = require('ps-list');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const path = require('path');

// Load environment variables using dotenv
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class ActivityTracker {
  constructor() {
    this.isTracking = false;
    this.isTimerRunning = false;
    this.userId = null;
    this.lastActivity = Date.now();
    this.idleThreshold = 60000; // 1 minute idle threshold
    this.trackingInterval = null;
    this.previousWindow = null;
    this.sessionStart = null;
    this.currentTaskId = null; // Track current task ID
    
    console.log('ActivityTracker initialized');
  }

  async start(userId = null) {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.userId = userId;
    this.sessionStart = new Date();
    console.log('Starting activity tracking for user:', userId);
    
    // Start tracking every 3 seconds
    this.trackingInterval = setInterval(async () => {
      try {
        const activityData = await this.gatherActivityData();
        
        // Send to API if timer is running
        if (this.isTimerRunning && this.userId) {
          await this.sendActivityToAPI(activityData);
        }
        
        // This will be sent via IPC to renderer for UI display
        global.activityData = activityData;
      } catch (error) {
        console.error('Error gathering activity data:', error);
      }
    }, 3000); // Changed to 3 seconds
    
    // Start idle detection
    this.startIdleDetection();
  }

  async stop() {
    if (!this.isTracking) return;
    
    // Send completed task if timer was running
    if (this.isTimerRunning && this.userId && this.currentTaskId) {
      await this.sendProcessedTask('completed');
    }
    
    this.isTracking = false;
    this.isTimerRunning = false;
    this.userId = null;
    this.previousWindow = null;
    this.currentTaskId = null;
    console.log('Stopping activity tracking...');
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  async setTimerStatus(isRunning, userId = null) {
    const wasRunning = this.isTimerRunning;
    
    this.isTimerRunning = isRunning;
    if (userId) {
      this.userId = userId;
    }
    console.log('Timer status updated:', { isRunning, userId });
    
    // Send processed task when timer status changes
    if (wasRunning !== isRunning && this.userId) {
      if (isRunning) {
        // Starting timer - create a new task
        this.currentTaskId = this.generateTaskId();
        await this.sendProcessedTask('started');
      } else {
        // Stopping timer - complete the current task
        await this.sendProcessedTask('completed');
        this.currentTaskId = null;
      }
    }
  }

  generateTaskId() {
    // Generate a unique task ID using timestamp and random number
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendProcessedTask(status) {
    try {
      if (!this.userId) return;

      const taskName = status === 'started' ? 'Work Session Started' : 'Work Session Ended';
      const taskDescription = status === 'started' 
        ? 'Started a new work session' 
        : 'Completed work session';

      const payload = {
        userId: this.userId,
        taskId: this.currentTaskId || this.generateTaskId(),
        taskName,
        taskDescription,
        taskStatus: status,
        taskTimestamp: new Date().toISOString()
      };

      // Use environment variable for backend URL with fallback
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/activity/addProcessedTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Processed task sent to API:', payload);
    } catch (error) {
      console.error('Failed to send processed task to API:', error);
    }
  }

  async sendActivityToAPI(activityData) {
    try {
      if (!activityData.activeWindow || !this.userId) return;

      const currentWindow = activityData.activeWindow;
      const timestamp = new Date();
      
      // Calculate duration (3 seconds since we track every 3 seconds)
      const duration = 3;
      
      const payload = {
        userId: this.userId,
        app: currentWindow.owner || 'Unknown',
        title: currentWindow.title || 'Unknown',
        timestamp: timestamp.toISOString(),
        duration: duration,
        afkStatus: activityData.idleState?.isIdle ? 'afk' : 'active',
        idleTime: Math.floor((activityData.idleState?.idleTime || 0) / 1000) // Convert to seconds
      };

      // Use environment variable for backend URL with fallback
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com';
      
      console.log(`${backendUrl}/api/activity/add`)

      const response = await fetch(`${backendUrl}/api/activity/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Activity sent to API:', payload);
    } catch (error) {
      console.error('Failed to send activity to API:', error);
    }
  }

  async gatherActivityData() {
    try {
      // Get all data in parallel
      const [activeWindow, processes, idleState] = await Promise.all([
        this.getCurrentWindow(),
        this.getRunningProcesses(),
        this.getIdleState()
      ]);

      return {
        timestamp: new Date(),
        activeWindow,
        processes: processes.slice(0, 20), // Limit to top 20 processes
        idleState,
        isTracking: this.isTracking
      };
    } catch (error) {
      console.error('Error in gatherActivityData:', error);
      return {
        timestamp: new Date(),
        activeWindow: null,
        processes: [],
        idleState: { isIdle: false, idleTime: 0 },
        error: error.message,
        isTracking: this.isTracking
      };
    }
  }

  async getCurrentWindow() {
    try {
      const window = await activeWindow();
      
      if (window) {
        return {
          title: window.title,
          owner: window.owner?.name || window.owner || 'Unknown',
          bundleId: window.owner?.bundleId || null,
          bounds: window.bounds,
          memoryUsage: window.memoryUsage || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current window:', error);
      return null;
    }
  }

  async getRunningProcesses() {
    try {
      const processes = await psList();
      
      // Sort by CPU usage (if available) or memory, limit results
      return processes
        .filter(proc => proc.name && proc.name.length > 0)
        .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
        .slice(0, 20)
        .map(proc => ({
          name: proc.name,
          pid: proc.pid,
          cpu: proc.cpu || 0,
          memory: proc.memory || 0,
          cmd: proc.cmd || ''
        }));
    } catch (error) {
      console.error('Error getting processes:', error);
      return [];
    }
  }

  startIdleDetection() {
    // Simple idle detection using Windows API via PowerShell
    setInterval(async () => {
      try {
        const idleTime = await this.getSystemIdleTime();
        const isIdle = idleTime > this.idleThreshold;
        
        if (!isIdle) {
          this.lastActivity = Date.now();
        }
      } catch (error) {
        console.error('Error in idle detection:', error);
      }
    }, 5000);
  }

  async getSystemIdleTime() {
    return new Promise((resolve) => {
      // Windows: Get idle time using PowerShell
      if (process.platform === 'win32') {
        const ps = spawn('powershell', [
          '-Command',
          `
          Add-Type @'
          using System;
          using System.Diagnostics;
          using System.Runtime.InteropServices;
          public class IdleTime {
            [DllImport("user32.dll")]
            static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
            [StructLayout(LayoutKind.Sequential)]
            struct LASTINPUTINFO {
              public static readonly int SizeOf = Marshal.SizeOf(typeof(LASTINPUTINFO));
              [MarshalAs(UnmanagedType.U4)]
              public UInt32 cbSize;
              [MarshalAs(UnmanagedType.U4)]
              public UInt32 dwTime;
            }
            public static uint GetIdleTime() {
              LASTINPUTINFO lastInPut = new LASTINPUTINFO();
              lastInPut.cbSize = (UInt32)Marshal.SizeOf(lastInPut);
              GetLastInputInfo(ref lastInPut);
              return ((UInt32)Environment.TickCount - lastInPut.dwTime);
            }
          }
'@
          [IdleTime]::GetIdleTime()
          `
        ]);

        let output = '';
        ps.stdout.on('data', (data) => {
          output += data.toString();
        });

        ps.on('close', () => {
          const idleMs = parseInt(output.trim()) || 0;
          resolve(idleMs);
        });

        ps.on('error', () => {
          resolve(0); // Fallback to 0 if error
        });
      } else {
        // For non-Windows, return 0 for now (could implement later)
        resolve(0);
      }
    });
  }

  async getIdleState() {
    const idleTime = await this.getSystemIdleTime();
    const isIdle = idleTime > this.idleThreshold;
    
    return {
      isIdle,
      idleTime,
      lastActivity: this.lastActivity,
      idleThreshold: this.idleThreshold
    };
  }

  getStatus() {
    return {
      isTracking: this.isTracking,
      lastActivity: this.lastActivity
    };
  }
}

module.exports = new ActivityTracker(); 