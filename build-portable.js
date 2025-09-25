const { exec, spawn } = require('child_process');
const fs = require('fs');

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
function runWithTimeout(command, timeoutMs = 120000) { // 2 minutes default
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
        console.log('🧹 Starting portable build process...');
        
        // Step 1: Clean directories
        await cleanDirectories();
        
        // Step 2: Build React app
        console.log('⚛️  Building React app...');
        await runWithTimeout('npm run build', 120000); // 2 minutes for React build
        
        // Step 3: Package as portable exe
        console.log('📦 Creating portable executable...');
        const portableCommand = 'npx electron-builder --win portable --config.compression=store --config.win.target=portable --config.nsis.differentialPackage=false';
        await runWithTimeout(portableCommand, 120000); // 2 minutes for portable build
        
        console.log('🎉 Portable build completed successfully!');
        console.log('📁 Check the dist/ folder for your portable executable');
        
    } catch (error) {
        console.error('❌ Portable build failed:', error.message);
        console.log('\n💡 Try these alternatives:');
        console.log('   1. npm run electron:build:simple');
        console.log('   2. npm run electron:build:legacy');
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