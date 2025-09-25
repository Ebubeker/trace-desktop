const { app, BrowserWindow, ipcMain } = require('electron')

const path = require('path')
const isDev = require('electron-is-dev')

require('@electron/remote/main').initialize()

// Import Activity Tracker
const activityTracker = require('./activityTracker')

let mainWindow = null

// Set up IPC handlers for Activity Tracking
ipcMain.handle('activity-start', async (event, { userId }) => {
  try {
    await activityTracker.start(userId)
    return { success: true }
  } catch (error) {
    console.error('Failed to start activity tracking:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('activity-stop', async () => {
  try {
    activityTracker.stop()
    return { success: true }
  } catch (error) {
    console.error('Failed to stop activity tracking:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('activity-status', () => {
  return activityTracker.getStatus()
})

ipcMain.handle('activity-set-timer-status', async (event, { isRunning, userId }) => {
  try {
    activityTracker.setTimerStatus(isRunning, userId)
    return { success: true }
  } catch (error) {
    console.error('Failed to set timer status:', error)
    return { success: false, error: error.message }
  }
})

// Send activity data to renderer every 3 seconds
function startActivityBroadcast() {
  setInterval(() => {
    if (mainWindow && global.activityData) {
      mainWindow.webContents.send('activity-data', global.activityData)
    }
  }, 3000) // Changed to 3 seconds to match tracking interval
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    mainWindow.loadURL(
      isDev 
        ? 'http://localhost:3000' 
        : `file://${path.join(__dirname, '../build/index.html')}`
    )
    
    // Start broadcasting activity data to renderer
    startActivityBroadcast()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', async () => {
    try {
        activityTracker.stop()
        console.log('Activity tracking cleanup completed')
    } catch (error) {
        console.error('Error during activity tracking cleanup:', error)
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})