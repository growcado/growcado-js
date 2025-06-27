#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

function quickExec(cmd, cwd = process.cwd()) {
  console.log(`🔄 ${cmd}`);
  try {
    const result = execSync(cmd, { 
      stdio: 'pipe',
      cwd,
      env: { ...process.env, NO_COLOR: '1', CI: 'true', NX_NON_INTERACTIVE: 'true' },
      timeout: 30000,
      encoding: 'utf8'
    });
    console.log(`✅ Success`);
    return result;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

function quickTest() {
  console.log('🚀 Quick CI/CD Test');
  console.log('==================');
  
  // Test 1: Check if we can run basic commands
  console.log('\n📋 1. Testing basic setup...');
  const nodeVersion = quickExec('node --version');
  const pnpmVersion = quickExec('pnpm --version');
  const nxVersion = quickExec('pnpm nx --version');
  
  if (nodeVersion && pnpmVersion && nxVersion) {
    console.log(`   Node: ${nodeVersion.trim()}`);
    console.log(`   pnpm: ${pnpmVersion.trim()}`);
    console.log(`   Nx: ${nxVersion.trim()}`);
  }
  
  // Test 2: Check workspace structure
  console.log('\n📋 2. Testing workspace...');
  const projects = quickExec('pnpm nx show projects');
  if (projects) {
    console.log('   Projects found:', projects.trim().split('\n').join(', '));
  }
  
  // Test 3: Check what's affected (without running builds)
  console.log('\n📋 3. Testing affected detection...');
  const affected = quickExec('pnpm nx show projects --affected');
  if (affected) {
    console.log('   Affected projects:', affected.trim().split('\n').join(', '));
  }
  
  // Test 4: Check package versions
  console.log('\n📋 4. Testing package versions...');
  try {
    const sdkPkg = JSON.parse(fs.readFileSync('packages/sdk/package.json', 'utf8'));
    const reactPkg = JSON.parse(fs.readFileSync('packages/react/package.json', 'utf8'));
    console.log(`   @growcado/sdk: ${sdkPkg.version}`);
    console.log(`   @growcado/react: ${reactPkg.version}`);
    console.log(`   React depends on SDK: ${reactPkg.dependencies['@growcado/sdk']}`);
  } catch (error) {
    console.log(`   ❌ Could not read package.json files`);
  }
  
  // Test 5: Check if builds would work (dry run)
  console.log('\n📋 5. Testing build readiness...');
  const buildCheck = quickExec('pnpm nx run-many -t build --dry-run');
  if (buildCheck) {
    console.log('   ✅ Build commands are ready');
  }
  
  // Test 6: Check publishing readiness  
  console.log('\n📋 6. Testing publish readiness...');
  const publishCheck = quickExec('npm run publish:dry');
  if (publishCheck) {
    console.log('   ✅ Packages are ready for publishing');
  }
  
  console.log('\n🎉 Quick test completed!');
  console.log('\n📖 To run full CI/CD test: npm run test:ci-cd:all');
  console.log('📖 To see affected projects: pnpm nx show projects --affected');
  console.log('📖 To build affected: pnpm nx affected -t build');
}

quickTest(); 