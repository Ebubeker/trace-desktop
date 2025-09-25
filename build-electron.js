const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to kill processes that might interfere
function killInterferingProcesses() {
    return new Promise((resolve) => {
        console.log('🧹 Checking for interfering processes...');
        
        // Check and kill electron processes
        exec('taskkill /f /im "electron.exe" /t 2>nul', (error) => {
            if (!error) console.log('✅ Killed electron processes');
        });
        
        // Don't kill node.exe as it might kill this script
        // Just wait a moment for cleanup
        setTimeout(() => {
            console.log('✅ Process cleanup completed');
            resolve();
        }, 1000);
    });
}

// Function to clean directories
function cleanDirectories() {
    return new Promise((resolve) => {
        console.log('🧹 Cleaning directories...');
        const dirsToClean = ['dist', 'build'];
        let cleaned = 0;
        
        if (dirsToClean.length === 0) {
            resolve();
            return;
        }
        
        dirsToClean.forEach(dir => {
            if (fs.existsSync(dir)) {
                exec(`npx rimraf "${dir}"`, (error) => {
                    if (error) {
                        console.warn(`⚠️  Warning cleaning ${dir}: ${error.message}`);
                    } else {
                        console.log(`✅ Cleaned ${dir} directory`);
                    }
                    cleaned++;
                    if (cleaned === dirsToClean.length) resolve();
                });
            } else {
                console.log(`ℹ️  ${dir} directory doesn't exist`);
                cleaned++;
                if (cleaned === dirsToClean.length) resolve();
            }
        });
    });
}

// Function to run command with timeout
function runWithTimeout(command, timeoutMs = 300000) { // 5 minutes default
    return new Promise((resolve, reject) => {
        console.log(`🚀 Running: ${command}`);
        
        const child = spawn('cmd', ['/c', command], { 
            stdio: 'inherit',
            shell: true 
        });
        
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error(`Command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

// Main build function
async function build() {
    try {
        console.log('🧹 Starting build process...');
        
        // Step 1: Kill interfering processes
        await killInterferingProcesses();
        
        // Step 2: Clean directories
        await cleanDirectories();
        
        // Step 3: Build React app
        console.log('⚛️  Building React app...');
        await runWithTimeout('npm run build', 180000); // 3 minutes for React build
        
        // Step 4: Package with Electron
        console.log('📦 Packaging with Electron Builder...');
        console.log('ℹ️  This may take 2-3 minutes. If it hangs, press Ctrl+C and try the alternative method.');
        await runWithTimeout('npm run electron:package -- --config.nsis.differentialPackage=false', 180000); // 3 minutes for Electron packaging
        
        console.log('🎉 Build completed successfully!');
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️  Build interrupted');
    process.exit(1);
});

// Start build
build(); 