# Quick Start: CI/CD Setup

## ✅ Status: Ready! 
Your CI/CD is configured with three separate workflows for clean separation of concerns.

## 🚀 Immediate Next Steps

### 1. Set Up NPM Token (Required for Publishing)
1. Go to [npmjs.com](https://www.npmjs.com) → Profile → Access Tokens
2. Create a new **Automation** token
3. In GitHub: `Settings > Secrets and Variables > Actions`
4. Add secret: `NPM_TOKEN` = your token

### 2. Test Everything Works
```bash
# Quick test your setup
npm run test:ci-cd:quick

# Test affected commands
pnpm nx show projects --affected

# Test building affected packages
pnpm nx affected -t build

# Test publishing (dry run)
npm run publish:dry
```

## 🎯 How the Three Workflows Work

### 1. **Pull Requests** (`.github/workflows/ci.yml`)
- **Triggers:** On PRs to main
- **Actions:** Verify and test affected packages
- **Purpose:** Quality gate before merging

### 2. **Main Branch** (`.github/workflows/ci.yml`)  
- **Triggers:** On pushes to main
- **Actions:** Verify, build, and test affected packages
- **Purpose:** Ensure main branch stays healthy

### 3. **Publishing** (`.github/workflows/publish.yml`)
- **Triggers:** When you create a GitHub release
- **Actions:** Build, test, and publish to NPM
- **Purpose:** Manual release control

## 📋 Publishing Workflow

### Creating a Release
1. **Create a GitHub release** with version tag (e.g., `v1.2.3`)
2. **GitHub Actions automatically:**
   - Extracts version from tag
   - Updates package.json files
   - Builds and tests packages
   - Publishes to NPM
   - Creates workflow summary

### Version Tag Examples
```bash
v1.0.0    # Major release
v0.2.0    # Minor release  
v0.1.1    # Patch release
1.0.0     # Also works (without 'v' prefix)
```

## 🧪 Current Package Status

```
@growcado/sdk: 0.0.1 ✅ Ready for publishing
@growcado/react: 0.0.1 ✅ Ready for publishing
  └── depends on: @growcado/sdk (workspace:*)
```

## 🎉 You're Ready!

After committing your files and adding the NPM token, your CI/CD will:
- ✅ Test pull requests automatically  
- ✅ Publish packages on main branch merges
- ✅ Only build what's changed (fast!)
- ✅ Use proper semantic versioning
- ✅ Create GitHub releases automatically

**Next:** Commit your files, set the NPM token, and make your first PR! 