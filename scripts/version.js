#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packages = [
  'packages/sdk/package.json',
  'packages/react/package.json'
];

function updateVersion(versionType) {
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('Version type must be one of: patch, minor, major');
    process.exit(1);
  }

  packages.forEach(pkgPath => {
    const fullPath = path.join(__dirname, '..', pkgPath);
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    const [major, minor, patch] = pkg.version.split('.').map(Number);
    
    let newVersion;
    switch (versionType) {
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
    }
    
    pkg.version = newVersion;
    
    // Update workspace dependencies
    if (pkg.dependencies && pkg.dependencies['@growcado/sdk']) {
      if (pkgPath.includes('react')) {
        // React package depends on SDK, keep workspace reference for now
        pkg.dependencies['@growcado/sdk'] = 'workspace:*';
      }
    }
    
    fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${pkgPath} to version ${newVersion}`);
  });
}

// Get version type from command line arguments
const versionType = process.argv[2];
if (!versionType) {
  console.error('Usage: node scripts/version.js <patch|minor|major>');
  process.exit(1);
}

updateVersion(versionType); 