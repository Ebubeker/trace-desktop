#!/bin/bash

APP="Desktop.app"
IDENTITY="Developer ID Application: Ebubeker Rexha (7MQMPR6BB5)"
ENTITLEMENTS="entitlements.plist"

echo "=== Signing all frameworks ==="
# Sign frameworks properly (resolve symlinks first)
for framework in "$APP/Contents/Frameworks"/*.framework; do
  if [ -d "$framework" ]; then
    echo "Signing framework: $framework"
    # Remove existing signature
    codesign --remove-signature "$framework" 2>/dev/null || true
    
    # Sign the actual binary (not the symlink)
    FRAMEWORK_NAME=$(basename "$framework" .framework)
    FRAMEWORK_BINARY="$framework/Versions/A/$FRAMEWORK_NAME"
    
    if [ -f "$FRAMEWORK_BINARY" ]; then
      codesign --force --sign "$IDENTITY" \
        --options runtime \
        --entitlements "$ENTITLEMENTS" \
        --timestamp \
        "$FRAMEWORK_BINARY"
    fi
    
    # Sign the framework bundle
    codesign --force --sign "$IDENTITY" \
      --options runtime \
      --entitlements "$ENTITLEMENTS" \
      --timestamp \
      "$framework"
  fi
done

echo "=== Signing Helper apps ==="
for helper in "$APP/Contents/Frameworks"/*.app; do
  if [ -d "$helper" ]; then
    echo "Signing helper: $helper"
    codesign --force --sign "$IDENTITY" \
      --options runtime \
      --entitlements "$ENTITLEMENTS" \
      --timestamp \
      "$helper"
  fi
done

echo "=== Signing chrome_crashpad_handler ==="
codesign --force --sign "$IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --timestamp \
  "$APP/Contents/Frameworks/Electron Framework.framework/Versions/A/Helpers/chrome_crashpad_handler"

echo "=== Signing Electron Framework ==="
codesign --force --sign "$IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --timestamp \
  "$APP/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"

codesign --force --sign "$IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --timestamp \
  "$APP/Contents/Frameworks/Electron Framework.framework"

echo "=== Signing main executable ==="
codesign --force --sign "$IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --timestamp \
  "$APP/Contents/MacOS/Desktop"

echo "=== Signing app bundle ==="
codesign --force --sign "$IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --timestamp \
  "$APP"

echo "=== Verifying signature ==="
codesign -vvv --deep --strict "$APP"