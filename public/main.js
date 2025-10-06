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
    // Set app icon - use pulselog.png for all platforms
    let iconPath = path.join(__dirname, 'pulselog.png');
    console.log(`${process.platform} detected, using pulselog.png icon:`, iconPath);
    
    // Check if icon file exists
    const fs = require('fs');
    if (!fs.existsSync(iconPath)) {
        console.warn('⚠️  Icon file not found:', iconPath);
        console.log('Available files in public directory:', fs.readdirSync(__dirname));
    } else {
        console.log('✅ Icon file found:', iconPath);
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Pulselog',
        icon: iconPath,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    // More reliable way to detect if we're in a packaged app
    const isPackaged = app.isPackaged || !isDev;
    
    if (isPackaged) {
        // In production/packaged app, load from build folder
        const indexPath = path.join(__dirname, '../build/index.html');
        console.log('Loading from:', indexPath);
        mainWindow.loadFile(indexPath);
    } else {
        // In development, load from dev server
        console.log('Loading from: http://localhost:3000');
        mainWindow.loadURL('http://localhost:3000');
    }
    
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
    } catch (error) {
        console.error('Error during activity tracking cleanup:', error)
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})