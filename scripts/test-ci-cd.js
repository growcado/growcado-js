#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function execCommand(cmd, cwd = process.cwd()) {
  console.log(`\n🔄 Running: ${cmd}`);
  try {
    const result = execSync(cmd, { 
      stdio: 'inherit', 
      cwd,
      env: { ...process.env, NO_COLOR: '1', CI: 'true', NX_NON_INTERACTIVE: 'true' },
      timeout: 60000 // 60 second timeout
    });
    console.log(`✅ Success: ${cmd}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${cmd}`);
    process.exit(1);
  }
}

function checkGitStatus() {
  console.log('\n📋 Checking Git status...');
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️  You have uncommitted changes:');
      console.log(status);
      console.log('Consider committing your changes before testing CI/CD.');
    } else {
      console.log('✅ Git working directory is clean');
    }
  } catch (error) {
    console.log('⚠️  Not in a Git repository or Git not available');
  }
}

function testPRWorkflow() {
  console.log('\n🔀 Testing Pull Request Workflow (CI)');
  console.log('=====================================');
  
  console.log('\n📦 Installing dependencies...');
  try {
    execCommand('pnpm install --frozen-lockfile');
  } catch (error) {
    console.log('⚠️  Lockfile out of sync, regenerating...');
    execCommand('pnpm install');
  }
  
  console.log('\n🔍 Running affected lint...');
  execCommand('pnpm nx affected -t lint --parallel=3');
  
  console.log('\n🧪 Running affected tests...');
  execCommand('pnpm nx affected -t test --parallel=3');
  
  console.log('\n🏗️  Running affected builds...');
  execCommand('pnpm nx affected -t build --parallel=3');
  
  console.log('\n✅ PR workflow simulation completed successfully!');
}

function testReleaseWorkflow() {
  console.log('\n🚀 Testing Release Workflow (Main Branch)');
  console.log('=========================================');
  
  console.log('\n📦 Installing dependencies...');
  try {
    execCommand('pnpm install --frozen-lockfile');
  } catch (error) {
    console.log('⚠️  Lockfile out of sync, regenerating...');
    execCommand('pnpm install');
  }
  
  console.log('\n🔍 Running affected lint...');
  execCommand('pnpm nx affected -t lint --parallel=3');
  
  console.log('\n🧪 Running affected tests...');
  execCommand('pnpm nx affected -t test --parallel=3');
  
  console.log('\n🏗️  Running affected builds...');
  execCommand('pnpm nx affected -t build --parallel=3');
  
  console.log('\n📋 Checking for publishable changes...');
  try {
    const affected = execSync('pnpm nx show projects --affected --type lib --json', { encoding: 'utf8' });
    const projects = JSON.parse(affected);
    
    const publishableProjects = projects.filter(p => 
      p.includes('@growcado/sdk') || p.includes('@growcado/react')
    );
    
    if (publishableProjects.length > 0) {
      console.log('📦 Found publishable changes:', publishableProjects);
      console.log('\n🎯 Testing publish readiness...');
      execCommand('npm run publish:dry');
    } else {
      console.log('📦 No publishable changes detected');
    }
  } catch (error) {
    console.log('⚠️  Could not determine affected projects');
  }
  
  console.log('\n✅ Release workflow simulation completed successfully!');
}

function showAffectedProjects() {
  console.log('\n📊 Affected Projects Analysis');
  console.log('============================');
  
  try {
    console.log('\n🔍 All affected projects:');
    execCommand('pnpm nx show projects --affected');
    
    console.log('\n📚 Affected libraries:');
    execCommand('pnpm nx show projects --affected --type lib');
    
    console.log('\n📱 Affected applications:');
    execCommand('pnpm nx show projects --affected --type app');
    
  } catch (error) {
    console.log('⚠️  Could not analyze affected projects');
  }
}

function testSemanticVersioning() {
  console.log('\n🏷️  Testing Semantic Versioning');
  console.log('==============================');
  
  // Show current versions
  console.log('\n📋 Current package versions:');
  const sdkPkg = JSON.parse(fs.readFileSync('packages/sdk/package.json', 'utf8'));
  const reactPkg = JSON.parse(fs.readFileSync('packages/react/package.json', 'utf8'));
  
  console.log(`   @growcado/sdk: ${sdkPkg.version}`);
  console.log(`   @growcado/react: ${reactPkg.version}`);
  
  // Test version bump (dry run)
  console.log('\n🧪 Testing version bump (patch):');
  const backupSdk = { ...sdkPkg };
  const backupReact = { ...reactPkg };
  
  try {
    execCommand('node scripts/version.js patch');
    
    const newSdkPkg = JSON.parse(fs.readFileSync('packages/sdk/package.json', 'utf8'));
    const newReactPkg = JSON.parse(fs.readFileSync('packages/react/package.json', 'utf8'));
    
    console.log(`   @growcado/sdk: ${sdkPkg.version} → ${newSdkPkg.version}`);
    console.log(`   @growcado/react: ${reactPkg.version} → ${newReactPkg.version}`);
    
    // Restore original versions
    fs.writeFileSync('packages/sdk/package.json', JSON.stringify(backupSdk, null, 2) + '\n');
    fs.writeFileSync('packages/react/package.json', JSON.stringify(backupReact, null, 2) + '\n');
    
    console.log('✅ Version bump test completed (versions restored)');
    
  } catch (error) {
    // Restore on error
    fs.writeFileSync('packages/sdk/package.json', JSON.stringify(backupSdk, null, 2) + '\n');
    fs.writeFileSync('packages/react/package.json', JSON.stringify(backupReact, null, 2) + '\n');
    throw error;
  }
}

function main() {
  console.log('🚀 Growcado CI/CD Local Testing Tool');
  console.log('====================================');
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  checkGitStatus();
  
  switch (command) {
    case 'pr':
    case 'pull-request':
      testPRWorkflow();
      break;
      
    case 'release':
    case 'main':
      testReleaseWorkflow();
      break;
      
    case 'affected':
      showAffectedProjects();
      break;
      
    case 'version':
      testSemanticVersioning();
      break;
      
    case 'all':
      testPRWorkflow();
      testReleaseWorkflow();
      showAffectedProjects();
      testSemanticVersioning();
      break;
      
    default:
      console.log('\nUsage: node scripts/test-ci-cd.js <command>');
      console.log('\nCommands:');
      console.log('  pr, pull-request  Test pull request workflow');
      console.log('  release, main     Test release workflow');
      console.log('  affected          Show affected projects');
      console.log('  version           Test semantic versioning');
      console.log('  all               Run all tests');
      console.log('\nExamples:');
      console.log('  node scripts/test-ci-cd.js pr');
      console.log('  node scripts/test-ci-cd.js release');
      console.log('  node scripts/test-ci-cd.js all');
      process.exit(1);
  }
  
  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📖 For more information, see docs/CI-CD-SETUP.md');
}

main(); 