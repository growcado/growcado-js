# CI/CD Setup Guide

This document explains the GitHub Actions CI/CD setup for the Growcado monorepo.

## Overview

The CI/CD pipeline provides:
- **Pull Request Validation**: Verify and test only affected packages
- **Main Branch CI**: Verify, build, and test affected packages  
- **Manual Publishing**: Publish to NPM when you create GitHub releases
- **Fast Builds**: Uses pnpm for faster dependency installation and caching
- **Nx Integration**: Leverages Nx's affected commands for efficient builds

## Workflow Structure

### 1. Pull Request CI (`.github/workflows/ci.yml`)
Triggers on pull requests to `main`:
1. Sets up Node.js 20 and pnpm 9
2. Installs dependencies with caching
3. Runs affected lint and test commands
4. Uploads test coverage artifacts

### 2. Main Branch CI (`.github/workflows/ci.yml`)
Triggers on pushes to `main`:
1. Sets up Node.js 20 and pnpm 9
2. Installs dependencies with caching
3. Runs affected lint, test, and build commands
4. Uploads build artifacts

### 3. Publish to NPM (`.github/workflows/publish.yml`)
Triggers when you create a GitHub release:
1. Extracts version from release tag
2. Updates package.json files to match release version
3. Builds and tests all packages
4. Publishes to NPM with proper versioning
5. Creates workflow summary

## Required Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and Variables > Actions`):

### NPM_TOKEN
1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click your profile > Access Tokens > Generate New Token
3. Select "Automation" token type
4. Copy the token and add it as `NPM_TOKEN` secret

### GITHUB_TOKEN
This is automatically provided by GitHub Actions - no setup needed.

## Publishing Process

Publishing is now **manual and controlled** through GitHub releases:

### Creating a Release
1. **Go to GitHub** → Releases → "Create a new release"
2. **Choose a tag** (e.g., `v1.2.3`, `v0.1.0`, `1.0.0`)
3. **Write release notes** describing the changes
4. **Publish the release**
5. **GitHub Actions automatically publishes** to NPM

### Version Tag Examples
```bash
v1.0.0    # Major release (breaking changes)
v0.2.0    # Minor release (new features)
v0.1.1    # Patch release (bug fixes)
1.0.0     # Also works without 'v' prefix
```

### What Happens During Publishing
1. **Version extraction** from your release tag
2. **Package.json updates** to match the release version
3. **Dependency resolution** (React package gets SDK version)
4. **Build and test** all packages
5. **NPM publishing** with public access
6. **Summary report** in GitHub Actions

## Local Testing

### 1. Test Affected Commands
```bash
# Install dependencies
pnpm install

# Test what the CI will run on a PR
pnpm nx affected -t lint
pnpm nx affected -t test  
pnpm nx affected -t build

# Test full workspace (what runs on main)
pnpm nx run-many -t lint,test,build
```

### 2. Test Publishing Locally
```bash
# Dry run to check package readiness
npm run publish:dry

# Test version bumping
node scripts/version.js patch  # or minor/major

# Test build and publish flow
npm run publish:prepare
```

### 3. Test with Local Registry
```bash
# Start local NPM registry
pnpm nx local-registry

# In another terminal, publish to local registry
NPM_REGISTRY=http://localhost:4873 node scripts/publish.js

# Test installing from local registry
npm install @growcado/sdk@latest --registry http://localhost:4873
```

## Verification Steps

### After Setting Up Secrets

1. **Test CI Pipeline**:
   - Create a feature branch
   - Make a small change to a package
   - Open a pull request
   - Verify the CI job runs and passes

2. **Test Publishing Pipeline**:
   - Merge a PR with a proper commit message
   - Check that the release job runs
   - Verify packages are published to NPM
   - Confirm GitHub release is created

### Monitoring

1. **GitHub Actions**: Monitor workflow runs in the Actions tab
2. **NPM Registry**: Check package versions at npmjs.com
3. **Releases**: View created releases in GitHub
4. **Artifacts**: Download test coverage reports from workflow runs

## Troubleshooting

### Common Issues

1. **NPM Publishing Fails**:
   - Verify `NPM_TOKEN` secret is set correctly
   - Check if package names are available
   - Ensure you have publish permissions

2. **Version Bump Fails**:
   - Check commit message format
   - Verify Git configuration in workflow

3. **Affected Commands Don't Work**:
   - Ensure you have a clean Git working directory
   - Check that NX base and head SHAs are set correctly

### Debug Commands

```bash
# Check what packages are affected
pnpm nx show projects --affected

# Debug with verbose output
pnpm nx affected -t build --verbose

# Check package readiness
npm run publish:dry

# View Nx graph
pnpm nx graph
```

## Advanced Configuration

### Customizing Version Detection

Edit the "Determine version bump type" step in `.github/workflows/ci-cd.yml` to modify how semantic versions are detected from commit messages.

### Adding More Package Types

Update the "Check if there are publishable changes" step to include additional package patterns:

```bash
if echo "$AFFECTED" | grep -E '"@growcado/(sdk|react|new-package)"' > /dev/null; then
```

### Environment-Specific Builds

Add environment-specific secrets and modify the workflow to handle different deployment targets (staging, production, etc.).

## Security Considerations

1. **Token Permissions**: Use automation tokens with minimal required permissions
2. **Branch Protection**: Enable branch protection rules on `main`
3. **Required Reviews**: Require code reviews before merging PRs
4. **Dependency Updates**: Regularly update GitHub Actions and dependencies

## Next Steps

After basic CI/CD is working, consider adding:
- Integration tests with real API endpoints
- Performance benchmarking
- Security scanning
- Automatic dependency updates with Dependabot
- Multi-environment deployments
- Release notes automation 