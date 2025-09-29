const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized macOS build...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  execSync('npm run clean', { stdio: 'inherit' });

  // Build React app with optimizations
  console.log('📦 Building React app...');
  execSync('GENERATE_SOURCEMAP=false npm run build', { stdio: 'inherit' });

  // Copy main.js to build directory
  console.log('📋 Copying Electron main files...');
  if (!fs.existsSync('./build')) {
    fs.mkdirSync('./build');
  }
  
  fs.copyFileSync('./public/main.js', './build/main.js');
  if (fs.existsSync('./public/preload.js')) {
    fs.copyFileSync('./public/preload.js', './build/preload.js');
  }
  fs.copyFileSync('./public/activityTracker.js', './build/activityTracker.js');

  // Remove source maps and unnecessary files from build
  console.log('🗑️ Removing unnecessary files...');
  const buildDir = './build/static';
  if (fs.existsSync(buildDir)) {
    const removeSourceMaps = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          removeSourceMaps(filePath);
        } else if (file.endsWith('.map')) {
          fs.unlinkSync(filePath);
          console.log(`  Removed: ${filePath}`);
        }
      });
    };
    removeSourceMaps(buildDir);
  }

  // Build for macOS with optimizations
  console.log('🍎 Building macOS app...');
  const buildCommand = process.env.NODE_ENV === 'production' 
    ? 'electron-builder --mac --config.compression=maximum --config.mac.target.arch=universal'
    : 'electron-builder --mac --config.compression=maximum';
  
  execSync(buildCommand, { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
  console.log('📊 Check the dist/ folder for your optimized app');

  // Display size information
  if (fs.existsSync('./dist')) {
    const files = fs.readdirSync('./dist');
    files.forEach(file => {
      if (file.endsWith('.dmg') || file.endsWith('.app')) {
        const stats = fs.statSync(path.join('./dist', file));
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📦 ${file}: ${sizeInMB} MB`);
      }
    });
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 