#!/bin/bash

# Publish script for individual packages
# Usage: ./scripts/publish-package.sh <package-name> <version-type>
# Example: ./scripts/publish-package.sh sdk patch

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

echo "📦 Publishing @growcado/$PACKAGE_NAME..."

# Step 1: Build the package
echo "🔨 Building package..."
pnpm --filter @growcado/$PACKAGE_NAME run build

# Step 2: Bump version in source using Node.js to avoid workspace issues
echo "📈 Bumping version ($VERSION_TYPE)..."
node -e "
const fs = require('fs');
const path = require('path');
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

pkg.version = parts.join('.');
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated version to:', pkg.version);
"

# Step 3: Copy updated package.json to dist
echo "📋 Copying updated package.json..."
cp $PACKAGE_DIR/package.json $DIST_DIR/

# Step 4: Transform workspace dependencies in dist
echo "🔄 Transforming workspace dependencies..."
if [ "$PACKAGE_NAME" = "react" ]; then
    # Get the current SDK version
    SDK_VERSION=$(node -p "require('./packages/sdk/package.json').version")
    # Replace workspace dependency with actual version
    node -e "
    const fs = require('fs');
    const pkg = require('./$DIST_DIR/package.json');
    if (pkg.dependencies && pkg.dependencies['@growcado/sdk']) {
        pkg.dependencies['@growcado/sdk'] = '^$SDK_VERSION';
    }
    fs.writeFileSync('./$DIST_DIR/package.json', JSON.stringify(pkg, null, 2));
    "
fi

# Step 5: Publish from dist directory
echo "🚀 Publishing to npm..."
cd $DIST_DIR
npm publish
cd ../../..

# Step 6: Create git tag
PACKAGE_VERSION=$(node -p "require('./$PACKAGE_DIR/package.json').version")
git add $PACKAGE_DIR/package.json
git commit -m "chore: release @growcado/$PACKAGE_NAME@$PACKAGE_VERSION"
git tag "@growcado/$PACKAGE_NAME@$PACKAGE_VERSION"

echo "✅ Successfully published @growcado/$PACKAGE_NAME@$PACKAGE_VERSION"
echo "🏷️  Tagged as @growcado/$PACKAGE_NAME@$PACKAGE_VERSION" 