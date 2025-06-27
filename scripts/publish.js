#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  { name: '@growcado/sdk', path: 'packages/sdk' },
  { name: '@growcado/react', path: 'packages/react' }
];

function execCommand(cmd, cwd = process.cwd(), options = {}) {
  console.log(`\n🔄 Running: ${cmd}`);
  try {
    const result = execSync(cmd, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      cwd,
      env: { ...process.env, NO_COLOR: '1', CI: 'true' }
    });
    console.log(`✅ Success: ${cmd}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${cmd}`);
    if (options.silent && error.stdout) {
      console.error(error.stdout.toString());
    }
    if (options.silent && error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

function checkPackageReadiness(packagePath, packageName) {
  const pkgJsonPath = path.join(packagePath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  
  console.log(`\n📦 Checking ${packageName}:`);
  console.log(`   Version: ${pkg.version}`);
  console.log(`   Main: ${pkg.main}`);
  console.log(`   Types: ${pkg.types}`);
  
  // Check if dist directory exists
  const distPath = path.join(packagePath, 'dist');
  if (fs.existsSync(distPath)) {
    console.log(`   ✅ Dist directory exists`);
    const distFiles = fs.readdirSync(distPath);
    console.log(`   📁 Dist files: ${distFiles.join(', ')}`);
  } else {
    console.log(`   ❌ Dist directory missing - run 'npm run build' first`);
  }
  
  // Show files that would be included
  if (pkg.files) {
    console.log(`   📋 Files to publish: ${pkg.files.join(', ')}`);
  }
  
  return fs.existsSync(distPath);
}

function updateWorkspaceDependencies() {
  console.log('\n📦 Updating workspace dependencies for publishing...');
  
  const reactPkgPath = path.join(__dirname, '..', 'packages/react/package.json');
  const sdkPkgPath = path.join(__dirname, '..', 'packages/sdk/package.json');
  
  const reactPkg = JSON.parse(fs.readFileSync(reactPkgPath, 'utf8'));
  const sdkPkg = JSON.parse(fs.readFileSync(sdkPkgPath, 'utf8'));
  
  // Update React package to use published SDK version
  if (reactPkg.dependencies && reactPkg.dependencies['@growcado/sdk']) {
    const originalDep = reactPkg.dependencies['@growcado/sdk'];
    reactPkg.dependencies['@growcado/sdk'] = `^${sdkPkg.version}`;
    
    fs.writeFileSync(reactPkgPath, JSON.stringify(reactPkg, null, 2) + '\n');
    console.log(`Updated @growcado/react dependency: ${originalDep} → ^${sdkPkg.version}`);
    
    return () => {
      // Restore workspace dependency
      reactPkg.dependencies['@growcado/sdk'] = originalDep;
      fs.writeFileSync(reactPkgPath, JSON.stringify(reactPkg, null, 2) + '\n');
      console.log('Restored workspace dependency');
    };
  }
  
  return () => {};
}

async function publishPackages(isDryRun = false) {
  console.log(`\n🚀 ${isDryRun ? 'Dry run' : 'Publishing'} packages...`);
  
  if (isDryRun) {
    console.log('\n📋 Dry run mode: Checking package readiness without building');
    
    // Check if packages are ready to publish
    const sdkReady = checkPackageReadiness(
      path.join(__dirname, '..', 'packages/sdk'), 
      '@growcado/sdk'
    );
    
    const reactReady = checkPackageReadiness(
      path.join(__dirname, '..', 'packages/react'), 
      '@growcado/react'
    );
    
    console.log('\n📋 Summary:');
    console.log(`   @growcado/sdk: ${sdkReady ? '✅ Ready' : '❌ Not ready'}`);
    console.log(`   @growcado/react: ${reactReady ? '✅ Ready' : '❌ Not ready'}`);
    
    if (sdkReady && reactReady) {
      console.log('\n🎉 Both packages are ready for publishing!');
      console.log('   Run without --dry-run to publish to NPM');
    } else {
      console.log('\n⚠️  Some packages need to be built first');
      console.log('   Run "npm run build" to build all packages');
    }
    
    return;
  }
  
  // Real publishing workflow
  console.log('\n📋 Step 1: Build and test all packages');
  execCommand('npm run build');
  execCommand('npm run test');
  execCommand('npm run lint');
  
  // Step 2: Update dependencies for publishing
  const restoreDependencies = updateWorkspaceDependencies();
  
  try {
    console.log('\n📋 Step 2: Publishing @growcado/sdk');
    execCommand('npm publish --access public', path.join(__dirname, '..', 'packages/sdk'));
    
    console.log('\n📋 Step 3: Publishing @growcado/react');
    execCommand('npm publish --access public', path.join(__dirname, '..', 'packages/react'));
    
    console.log('\n🎉 All packages published successfully!');
    
  } finally {
    // Always restore workspace dependencies
    restoreDependencies();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('--dry');

publishPackages(isDryRun).catch(error => {
  console.error('❌ Publishing failed:', error.message);
  process.exit(1);
}); 