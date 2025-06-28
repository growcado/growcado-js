#!/bin/bash

# Dry-run publish script for individual packages
# Usage: ./scripts/publish-package-dry-run.sh <package-name> <version-type>
# Example: ./scripts/publish-package-dry-run.sh sdk patch

set -e

PACKAGE_NAME=$1
VERSION_TYPE=${2:-patch}

if [ -z "$PACKAGE_NAME" ]; then
    echo "Error: Package name is required"
    echo "Usage: $0 <package-name> [version-type]"
    echo "Available packages: sdk, react"
    exit 1
fi

if [ "$PACKAGE_NAME" != "sdk" ] && [ "$PACKAGE_NAME" != "react" ]; then
    echo "Error: Invalid package name. Available packages: sdk, react"
    exit 1
fi

PACKAGE_DIR="packages/$PACKAGE_NAME"
DIST_DIR="dist/packages/$PACKAGE_NAME"

echo "🧪 DRY RUN: Publishing @growcado/$PACKAGE_NAME..."

# Step 1: Build the package
echo "🔨 Building package..."
pnpm --filter @growcado/$PACKAGE_NAME run build

# Step 2: Show current version and what would be bumped
echo "📈 Version information..."
CURRENT_VERSION=$(node -p "require('./$PACKAGE_DIR/package.json').version")
echo "   Current version: $CURRENT_VERSION"

# Calculate what the new version would be
NEW_VERSION=$(node -e "
const fs = require('fs');
const packagePath = './$PACKAGE_DIR/package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const parts = pkg.version.split('.');

if ('$VERSION_TYPE' === 'patch') {
    parts[2] = (parseInt(parts[2]) + 1).toString();
} else if ('$VERSION_TYPE' === 'minor') {
    parts[1] = (parseInt(parts[1]) + 1).toString();
    parts[2] = '0';
} else if ('$VERSION_TYPE' === 'major') {
    parts[0] = (parseInt(parts[0]) + 1).toString();
    parts[1] = '0';
    parts[2] = '0';
}

console.log(parts.join('.'));
")

echo "   New version would be: $NEW_VERSION (bumping $VERSION_TYPE)"

# Step 3: Show package.json transformation
echo "📋 Package.json transformation preview..."
if [ "$PACKAGE_NAME" = "react" ]; then
    SDK_VERSION=$(node -p "require('./packages/sdk/package.json').version")
    echo "   Would transform workspace dependency '@growcado/sdk': 'workspace:*' -> '^$SDK_VERSION'"
fi

# Step 4: Show what would be published
echo "🚀 Would publish from: $DIST_DIR"
echo "   Files that would be published:"
if [ -d "$DIST_DIR" ]; then
    cd $DIST_DIR
    ls -la
    echo ""
    echo "   Package contents preview:"
    find . -type f -name "*.js" -o -name "*.d.ts" -o -name "package.json" | head -10
    cd ../../..
else
    echo "   ERROR: Dist directory does not exist. Build may have failed."
fi

# Step 5: Show git operations
echo "🏷️ Would create git tag: @growcado/$PACKAGE_NAME@$NEW_VERSION"
echo "   Would commit: chore: release @growcado/$PACKAGE_NAME@$NEW_VERSION"

echo ""
echo "✅ DRY RUN COMPLETE"
echo "📝 To actually publish, run: ./scripts/publish-package.sh $PACKAGE_NAME $VERSION_TYPE" 