#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

xcodebuild -exportArchive \
    -archivePath build/Camerbay.xcarchive \
    -exportOptionsPlist scripts/ios-export-options-appstore.plist \
    -exportPath build/ipa

IPA=$(find build/ipa -name "*.ipa" | head -1)
echo "✓ IPA: $IPA"

xcrun altool --upload-app \
    -f "$IPA" \
    -t ios \
    --api-key Z864Z9F63H \
    --api-issuer e1632d6e-c5ac-4e40-9287-ae3bbba9565d \
    --p8-file-path ./AuthKey_Z864Z9F63H.p8 \
    --show-progress

echo "✓ Upload complete"
