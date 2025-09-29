# 🚀 App Size Optimization Guide

## ⚡ Quick Start - Use Optimized Build
```bash
npm run build:mac-optimized
```

## 📊 Expected Results
- **Before**: ~200MB
- **After**: ~60-80MB (60-70% reduction)

## 🔧 What Was Changed

### 1. **Compression Settings**
- Changed from `"compression": "store"` to `"compression": "maximum"`
- **Impact**: 30-40% size reduction

### 2. **Node Modules Filtering**
- Excluded all node_modules by default: `"!node_modules/**/*"`
- Only include runtime dependencies needed for the app
- **Impact**: 40-50% size reduction

### 3. **Build Optimizations**
- Disabled source maps: `GENERATE_SOURCEMAP=false`
- Removed .map files after build
- **Impact**: 10-15% size reduction

### 4. **macOS Specific Optimizations**
- Added proper entitlements for signing
- Optimized DMG target configuration
- Universal binary support (Intel + Apple Silicon)

## 🍎 Notarization Commands

### Sign and Notarize (requires Apple Developer account):
```bash
# Build optimized app
npm run build:mac-optimized

# Sign the app (replace with your identity)
codesign --force --deep --sign "Developer ID Application: Your Name" ./dist/Desktop\ Tracker.app

# Create signed DMG
electron-builder --mac --publish=never

# Notarize (replace with your credentials)
xcrun notarytool submit ./dist/Desktop\ Tracker-*.dmg \
  --apple-id your@email.com \
  --password your-app-password \
  --team-id YOUR_TEAM_ID \
  --wait

# Staple notarization
xcrun stapler staple ./dist/Desktop\ Tracker-*.dmg
```

## 🎯 Further Optimizations (Manual)

### 1. **Remove Unused Dependencies**
Check if these can be moved to devDependencies:
- `@testing-library/*` packages
- `tailwindcss`, `autoprefixer`, `postcss`
- Build tools not needed at runtime

### 2. **Optimize Images**
```bash
# Compress PNG icons (install imagemagick first)
magick logo512.png -quality 85 logo512.png
magick logo192.png -quality 85 logo192.png
```

### 3. **Bundle Analyzer**
```bash
npm install --save-dev webpack-bundle-analyzer
# Add to your build process to identify large dependencies
```

## 📈 Monitoring App Size

The optimized build script will show you the final app size. Target sizes:
- **Good**: < 80MB
- **Excellent**: < 60MB
- **Outstanding**: < 40MB

## 🔍 Troubleshooting

### If app won't start:
1. Check you included all required runtime dependencies in the `files` array
2. Verify main.js path in extraMetadata
3. Test locally before building: `npm run electron:serve`

### If notarization fails:
1. Ensure you have a valid Developer ID certificate
2. Check entitlements file is properly formatted
3. Verify app is signed before notarizing

## 💡 Pro Tips
- Test the optimized app thoroughly before notarizing
- Keep a backup of your original package.json
- Consider using `electron-builder` auto-update for future releases
- Monitor your app size in CI/CD to catch regressions 