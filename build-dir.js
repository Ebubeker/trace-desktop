const { exec, spawn } = require('child_process');
const fs = require('fs');

// Function to run command with timeout
function runWithTimeout(command, timeoutMs = 120000) {
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
        console.log('🧹 Starting directory build process...');
        
        // Step 1: Clean and build React
        console.log('⚛️  Building React app...');
        await runWithTimeout('npm run clean', 30000);
        await runWithTimeout('npm run build', 120000);
        
        // Step 2: Create unpacked directory only
        console.log('📁 Creating unpacked directory...');
        const dirCommand = 'npx electron-builder --win dir --config.compression=store';
        await runWithTimeout(dirCommand, 90000); // 90 seconds should be enough for dir build
        
        console.log('🎉 Directory build completed successfully!');
        console.log('📁 Your app is in: dist/win-unpacked/');
        console.log('🚀 Run the app: dist/win-unpacked/desktop-app.exe');
        
    } catch (error) {
        console.error('❌ Directory build failed:', error.message);
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