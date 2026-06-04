#!/usr/bin/env bash
# Local iOS build + ASC upload — no EAS required
# Usage: ./scripts/build-ios-local.sh [appstore|adhoc] [--upload]
#
# Prerequisites:
#   1. dist-cert.p12 imported to keychain (run setup-certs step below)
#   2. App Store provisioning profile installed (see install_profile step)
#   3. ASC_API_KEY_ID, ASC_API_KEY_ISSUER, ASC_API_KEY_PATH set in .env

set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env (contains ASC credentials and app env vars)
if [ -f ".env" ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

SCHEME="Camerbay"
WORKSPACE="ios/Camerbay.xcworkspace"
ARCHIVE_PATH="build/Camerbay.xcarchive"
EXPORT_PATH="build/ipa"
EXPORT_OPTIONS="scripts/ios-export-options-appstore.plist"
TEAM_ID="6U6HM5M627"
DIST_CERT="credentials/ios/dist-cert.p12"

DISTRIBUTION=${1:-appstore}
UPLOAD=false
[[ "${2:-}" == "--upload" ]] && UPLOAD=true

# ── Clock guard ───────────────────────────────────────────────────────────
check_clock() {
    local server_date server_epoch local_epoch skew
    server_date=$(curl -sI --max-time 5 https://api.appstoreconnect.apple.com 2>/dev/null \
        | grep -i "^date:" | sed 's/[Dd]ate: //' | tr -d '\r')
    if [ -z "$server_date" ]; then
        echo "WARNING: Could not verify system clock (network unavailable)"
        return
    fi
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
}

# ── STEP 1: Import certificate ─────────────────────────────────────────────
setup_certs() {
    echo "→ Importing distribution certificate…"
    if [ ! -f "$DIST_CERT" ]; then
        echo "ERROR: $DIST_CERT not found"
        exit 1
    fi

    # Prompt for p12 password if not set
    if [ -z "${CERT_PASSWORD:-}" ]; then
        echo -n "  Enter p12 password (leave blank if none): "
        read -rs CERT_PASSWORD
        echo ""
    fi

    # Create a temporary keychain to avoid touching login keychain
    KEYCHAIN_NAME="camerbay-build.keychain"
    KEYCHAIN_PASSWORD="camerbay-tmp-$(date +%s)"

    security delete-keychain "$KEYCHAIN_NAME" 2>/dev/null || true
    security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"
    security set-keychain-settings -lut 21600 "$KEYCHAIN_NAME"
    security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

    # Add to search list (preserve existing keychains)
    security list-keychains -d user -s "$KEYCHAIN_NAME" $(security list-keychains -d user | xargs)

    security import "$DIST_CERT" \
        -k "$KEYCHAIN_NAME" \
        -T /usr/bin/codesign \
        -T /usr/bin/productbuild \
        -P "$CERT_PASSWORD"

    security set-key-partition-list \
        -S apple-tool:,apple:,codesign: \
        -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

    echo "✓ Certificate imported to $KEYCHAIN_NAME"
}

# ── STEP 2: Install provisioning profile ──────────────────────────────────
install_profile() {
    local profile="credentials/ios/localbuild.mobileprovision"
    if [ ! -f "$profile" ]; then
        echo "ERROR: $profile not found"
        echo "  Download App Store profile from developer.apple.com → Certificates, IDs & Profiles"
        exit 1
    fi

    local uuid
    uuid=$(security cms -D -i "$profile" | plutil -extract UUID raw -)
    local dest="$HOME/Library/MobileDevice/Provisioning Profiles/${uuid}.mobileprovision"
    mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
    cp "$profile" "$dest"
    echo "✓ Profile installed: $uuid"

    local name
    name=$(security cms -D -i "$profile" | plutil -extract Name raw -)
    echo "  Profile name: $name"
}

# ── STEP 3: Build archive ─────────────────────────────────────────────────
build_archive() {
    echo "→ Building archive…"
    mkdir -p build

    # Load production env vars (override .env)
    if [ -f ".env.production" ]; then
        echo "  Loading .env.production…"
        set -a
        # shellcheck disable=SC1091
        source .env.production
        set +a
    else
        echo "WARNING: .env.production not found — using values from .env"
    fi

    export NODE_ENV=production
    export EXPO_NO_METRO_WORKSPACE_ROOT=1

    # Auto-increment build number using timestamp
    BUILD_NUMBER=$(date +%s)
    echo "  Build number: $BUILD_NUMBER"

    local profile_uuid
    profile_uuid=$(security cms -D -i "credentials/ios/localbuild.mobileprovision" | plutil -extract UUID raw -)
    echo "  Using profile UUID: $profile_uuid"

    xcodebuild archive \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration Release \
        -archivePath "$ARCHIVE_PATH" \
        -destination "generic/platform=iOS" \
        CODE_SIGN_STYLE="Manual" \
        DEVELOPMENT_TEAM="$TEAM_ID" \
        CODE_SIGN_IDENTITY="Apple Distribution" \
        PROVISIONING_PROFILE="$profile_uuid" \
        PROVISIONING_PROFILE_SPECIFIER="local-build" \
        CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
        MARKETING_VERSION="1.0.0"

    echo "✓ Archive: $ARCHIVE_PATH"
}

# ── STEP 4: Export .ipa ───────────────────────────────────────────────────
export_ipa() {
    echo "→ Exporting .ipa…" >&2
    rm -rf "$EXPORT_PATH"

    xcodebuild -exportArchive \
        -archivePath "$ARCHIVE_PATH" \
        -exportOptionsPlist "$EXPORT_OPTIONS" \
        -exportPath "$EXPORT_PATH" >&2

    local ipa
    ipa=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)
    echo "✓ IPA: $ipa" >&2
    echo "$ipa"
}

# ── STEP 5: Upload to ASC ─────────────────────────────────────────────────
upload_to_asc() {
    local ipa="$1"

    if [ -z "${ASC_API_KEY_ID:-}" ] || [ -z "${ASC_API_KEY_ISSUER:-}" ] || [ -z "${ASC_API_KEY_PATH:-}" ]; then
        echo "ERROR: ASC_API_KEY_ID, ASC_API_KEY_ISSUER, ASC_API_KEY_PATH must be set in .env"
        exit 1
    fi

    echo "→ Uploading to App Store Connect…"
    xcrun altool --upload-app \
        -f "$ipa" \
        -t ios \
        --api-key "$ASC_API_KEY_ID" \
        --api-issuer "$ASC_API_KEY_ISSUER" \
        --p8-file-path "$ASC_API_KEY_PATH" \
        --show-progress

    echo "✓ Upload complete — check App Store Connect for processing status"
}

# ── MAIN ──────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════"
echo " Camerbay iOS local build"
echo " Distribution: $DISTRIBUTION"
echo "═══════════════════════════════════════"

if $UPLOAD; then
    check_clock
fi

# Skip setup_certs if SKIP_CERT_IMPORT=1 (cert already in keychain via Xcode)
if [ "${SKIP_CERT_IMPORT:-0}" != "1" ]; then
    setup_certs
fi
install_profile
build_archive
IPA=$(export_ipa)

if $UPLOAD; then
    upload_to_asc "$IPA"
else
    echo ""
    echo "Built: $IPA"
    echo "To upload: $0 $DISTRIBUTION --upload"
fi
