# CI/CD Setup Guide

This guide will help you set up automated Docker image builds and deployments for the PAI Website.

## Quick Setup (5 minutes)

### Step 1: Create Docker Hub Access Token

1. Go to [Docker Hub](https://hub.docker.com) and log in
2. Click your profile → Account Settings → Security
3. Click **"New Access Token"**
4. Name: `GitHub Actions - PAI Website`
5. Permissions: **Read, Write, Delete**
6. Click **Generate** and copy the token

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:

   | Name | Value |
   |------|-------|
   | `DOCKER_USERNAME` | Your Docker Hub username |
   | `DOCKER_PASSWORD` | The access token from Step 1 |

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Add CI/CD workflow"
git push origin main
```

That's it! The workflow will automatically build and push your Docker image.

## What Happens Next

Every time you push to `main`, `master`, or `develop`:

1. ✅ GitHub Actions builds a Docker image
2. ✅ Runs multi-architecture builds (AMD64 + ARM64)
3. ✅ Pushes to Docker Hub with automatic tags
4. ✅ Uses layer caching for faster builds

## Image Tags

Your images will be tagged as:

- `latest` - Latest build from main branch
- `main` - Latest build from main branch
- `main-abc1234` - Specific commit SHA
- `v1.2.3` - Semantic version tags (if you create Git tags)

## Pulling Your Image

```bash
# Pull latest
docker pull <your-username>/pai-website:latest

# Pull specific version
docker pull <your-username>/pai-website:v1.0.0
```

## Running Your Image

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host:3306/db \
  -e SESSION_SECRET=your-secret-key \
  --name pai-website \
  <your-username>/pai-website:latest
```

## Monitoring Builds

View build status:
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Select **"Build and Push Docker Image"**

## Troubleshooting

**Build fails?**
- Check that secrets are set correctly in GitHub
- Verify Docker Hub access token has write permissions

**Image not on Docker Hub?**
- Check Actions tab for errors
- Ensure workflow completed successfully

For detailed documentation, see `.github/workflows/README.md`
