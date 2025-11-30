# GitHub Actions - Docker Build & Push

This directory contains GitHub Actions workflows for automating the build and deployment of the PAI Website Docker image.

## Workflow: `docker-build-push.yml`

Automatically builds and pushes Docker images to Docker Hub on every commit to main branches.

### Triggers

- **Push to branches**: `main`, `master`, `develop`
- **Tags**: Any tag starting with `v` (e.g., `v1.0.0`, `v2.1.3`)
- **Pull Requests**: To `main` or `master` (builds but doesn't push)

### What It Does

1. ✅ Checks out the repository code
2. ✅ Sets up Docker Buildx for multi-platform builds
3. ✅ Logs in to Docker Hub using secrets
4. ✅ Generates Docker image tags based on branch/tag/commit
5. ✅ Builds the Docker image with caching
6. ✅ Pushes to Docker Hub (except for PRs)
7. ✅ Supports multi-architecture: `linux/amd64` and `linux/arm64`

### Image Tags Generated

| Event | Tag Example |
|-------|-------------|
| Push to `main` | `latest`, `main`, `main-abc1234` |
| Push to `develop` | `develop`, `develop-abc1234` |
| Tag `v1.2.3` | `v1.2.3`, `1.2`, `latest` |
| Pull Request #42 | `pr-42` (not pushed) |

## Setup Instructions

### 1. Create Docker Hub Account

If you don't have one, create an account at [hub.docker.com](https://hub.docker.com)

### 2. Create Docker Hub Repository

1. Go to Docker Hub
2. Click "Create Repository"
3. Name it: `pai-website` (or update `DOCKER_IMAGE_NAME` in workflow)
4. Set visibility (Public or Private)

### 3. Generate Docker Hub Access Token

1. Go to Docker Hub → Account Settings → Security
2. Click "New Access Token"
3. Name it: `GitHub Actions - PAI Website`
4. Permissions: `Read, Write, Delete`
5. Copy the token (you won't see it again!)

### 4. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these two secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | The access token you generated |

### 5. Push to GitHub

Once secrets are configured, any push to `main`, `master`, or `develop` will trigger the workflow.

## Monitoring Builds

1. Go to your GitHub repository
2. Click the "Actions" tab
3. Select "Build and Push Docker Image"
4. View logs for each run

## Using the Docker Image

### Pull the latest image

```bash
docker pull <your-dockerhub-username>/pai-website:latest
```

### Pull a specific version

```bash
docker pull <your-dockerhub-username>/pai-website:v1.0.0
```

### Run the container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host:3306/db \
  -e SESSION_SECRET=your-secret \
  --name pai-website \
  <your-dockerhub-username>/pai-website:latest
```

## Customization

### Change Docker Image Name

Edit `.github/workflows/docker-build-push.yml`:

```yaml
env:
  DOCKER_IMAGE_NAME: your-custom-name
```

### Add More Branches

Add branches to the `on.push.branches` section:

```yaml
on:
  push:
    branches:
      - main
      - staging
      - production
```

### Change Build Context

If your Dockerfile is in a different location:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./your-directory
    file: ./your-directory/Dockerfile
```

## Troubleshooting

### Build fails with "permission denied"

- Check that `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are set correctly
- Verify the access token has write permissions

### Image not appearing on Docker Hub

- Check the Actions tab for errors
- Ensure the workflow completed successfully
- Verify you're pushing to a branch listed in the workflow triggers

### Build is slow

- The workflow uses layer caching to speed up builds
- First build will be slower, subsequent builds will be faster
- Cache is stored as `buildcache` tag in your Docker Hub repo

## Advanced Features

### Multi-Architecture Support

The workflow builds for both `linux/amd64` (Intel/AMD) and `linux/arm64` (ARM/Apple Silicon).

### Layer Caching

Speeds up builds by reusing unchanged layers:
- Cache is pulled from Docker Hub before building
- Cache is pushed after successful builds
- Reduces build time by 50-80% for incremental changes

### Automatic Tagging

Images are automatically tagged based on:
- Branch name (e.g., `main`, `develop`)
- Git commit SHA (e.g., `main-abc1234`)
- Semantic version tags (e.g., `v1.2.3` → `1.2`, `latest`)

## Security Best Practices

✅ Use Docker Hub access tokens (not passwords)
✅ Store credentials in GitHub Secrets
✅ Limit token permissions to what's needed
✅ Rotate tokens periodically
✅ Use private Docker Hub repos for sensitive projects

## Next Steps

After setting up CI/CD, consider:

1. **Add automated tests** before building Docker images
2. **Set up CD** to deploy to staging/production automatically
3. **Add vulnerability scanning** with Trivy or Snyk
4. **Configure notifications** for build failures
5. **Add deployment workflows** for Kubernetes/Railway/etc.
