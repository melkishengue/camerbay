#!/usr/bin/env bash
# Re-export existing archive and upload to App Store Connect.
# Requires ASC_API_KEY_ID, ASC_API_KEY_ISSUER, ASC_API_KEY_PATH in .env
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env
if [ -f ".env" ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

if [ -z "${ASC_API_KEY_ID:-}" ] || [ -z "${ASC_API_KEY_ISSUER:-}" ] || [ -z "${ASC_API_KEY_PATH:-}" ]; then
    echo "ERROR: ASC_API_KEY_ID, ASC_API_KEY_ISSUER, ASC_API_KEY_PATH must be set in .env"
    exit 1
fi

# ── Clock guard ────────────────────────────────────────────────────────────
server_date=$(curl -sI --max-time 5 https://api.appstoreconnect.apple.com 2>/dev/null \
    | grep -i "^date:" | sed 's/[Dd]ate: //' | tr -d '\r')
if [ -n "$server_date" ]; then
    server_epoch=$(date -j -f "%a, %d %b %Y %T %Z" "$server_date" "+%s" 2>/dev/null)
    local_epoch=$(date -u "+%s")
    skew=$(( local_epoch - server_epoch ))
    [ "$skew" -lt 0 ] && skew=$(( -skew ))
    if [ "$skew" -gt 60 ]; then
        echo "ERROR: System clock skew ${skew}s — JWT auth will fail."
        echo "  Fix: sudo sntp -sS time.apple.com"
        exit 1
    fi
    echo "✓ Clock OK (skew ${skew}s)"
fi

xcodebuild -exportArchive \
    -archivePath build/Camerbay.xcarchive \
    -exportOptionsPlist scripts/ios-export-options-appstore.plist \
    -exportPath build/ipa

IPA=$(find build/ipa -name "*.ipa" | head -1)
echo "✓ IPA: $IPA"

xcrun altool --upload-app \
    -f "$IPA" \
    -t ios \
    --api-key "$ASC_API_KEY_ID" \
    --api-issuer "$ASC_API_KEY_ISSUER" \
    --p8-file-path "$ASC_API_KEY_PATH" \
    --show-progress

echo "✓ Upload complete"
