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
    --apiKey RL7K7Z6KN8 \
    --apiIssuer e1632d6e-c5ac-4e40-9287-ae3bbba9565d \
    --show-progress

echo "✓ Upload complete"
