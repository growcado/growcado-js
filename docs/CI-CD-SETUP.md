# CI/CD Setup Guide

This document explains the GitHub Actions CI/CD setup for the Growcado monorepo.

## Overview

The CI/CD pipeline provides:
- **Pull Request Validation**: Builds and tests only affected packages
- **Automated Publishing**: Semantic versioning and NPM publishing on main branch
- **Fast Builds**: Uses pnpm for faster dependency installation and caching
- **Nx Integration**: Leverages Nx's affected commands for efficient builds

## Workflow Structure

### Pull Request CI (`ci` job)
Triggers on all pull requests to `main`:
1. Sets up Node.js 20 and pnpm 9
2. Installs dependencies with caching
3. Runs affected lint/test/build commands
4. Uploads test coverage artifacts

### Release and Publish (`release` job)
Triggers on pushes to `main`:
1. Runs full CI validation
2. Checks for publishable changes in affected packages
3. Determines semantic version bump from commit messages
4. Updates package versions and creates Git tags
5. Publishes to NPM
6. Creates GitHub releases

## Required Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and Variables > Actions`):

### NPM_TOKEN
1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click your profile > Access Tokens > Generate New Token
3. Select "Automation" token type
4. Copy the token and add it as `NPM_TOKEN` secret

### GITHUB_TOKEN
This is automatically provided by GitHub Actions - no setup needed.

## Semantic Versioning

The pipeline automatically determines version bumps based on commit message conventions:

### Major Version (Breaking Changes)
```bash
git commit -m "feat!: redesign API interface"
git commit -m "fix!: remove deprecated methods"
git commit -m "feat(sdk)!: change authentication flow"
```

### Minor Version (New Features)
```bash
git commit -m "feat: add new personalization hooks"
git commit -m "feat(react): implement new components"
```

### Patch Version (Bug Fixes, Docs, etc.)
```bash
git commit -m "fix: resolve caching issue"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

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