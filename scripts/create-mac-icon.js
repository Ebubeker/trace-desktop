const fs = require('fs');
const path = require('path');

// This script creates a simple .icns file for macOS
// Note: For production, you should use a proper icon conversion tool

console.log('Creating macOS icon...');

// Check if pulselog.png exists
const pngPath = path.join(__dirname, '../public/pulselog.png');
const icnsPath = path.join(__dirname, '../public/pulselog.icns');

if (!fs.existsSync(pngPath)) {
    console.error('pulselog.png not found in public directory');
    process.exit(1);
}

// For now, we'll just copy the PNG as ICNS
// In production, you should use a proper tool like iconutil or online converters
try {
    fs.copyFileSync(pngPath, icnsPath);
    console.log('✅ Created pulselog.icns (using PNG as fallback)');
    console.log('⚠️  For production, convert PNG to proper ICNS format using:');
    console.log('   - iconutil (macOS built-in)');
    console.log('   - Online converters');
    console.log('   - ImageMagick');
} catch (error) {
    console.error('❌ Failed to create icon:', error.message);
    process.exit(1);
}
