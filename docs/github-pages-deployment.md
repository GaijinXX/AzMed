# GitHub Pages Deployment Guide

## Overview

This guide covers deploying the Azerbaijan Drug Database to GitHub Pages at https://gaijinxx.github.io/AzMed/

## Repository Setup

Your repository: https://github.com/GaijinXX/AzMed.git

## Prerequisites

1. GitHub repository with admin access
2. GitHub Actions enabled
3. GitHub Pages enabled in repository settings

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/GaijinXX/AzMed
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Configure Repository Secrets

Add the following secrets in your repository settings:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:

```
VITE_SUPABASE_URL=https://uxmvulvmvtismnokxsry.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXZ1bHZtdnRpc21ub2t4c3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDA2NTksImV4cCI6MjA2ODc3NjY1OX0.PadYJ9W2Abp4TV5QLZvn1TidYz7Hdec8fwNwrehH6Q4
```

### 3. Deployment Process

The deployment is fully automated via GitHub Actions:

1. **Push to main branch** triggers the deployment
2. **Tests run** automatically (linting, unit tests)
3. **Build process** creates optimized production build
4. **Deploy to GitHub Pages** publishes the site

### 4. Manual Deployment (if needed)

You can also deploy manually:

```bash
# Build for GitHub Pages
npm run build:gh-pages

# The dist/ folder contains the built files
# Upload these to GitHub Pages manually if needed
```

## Configuration Details

### Base URL Configuration

The application is configured with the correct base URL for GitHub Pages:

- **Production URL**: https://gaijinxx.github.io/AzMed/
- **Base Path**: `/AzMed/`
- **Vite Config**: `base: '/AzMed/'` in production mode

### Build Optimization

The GitHub Pages build includes:

- React 19 optimizations with React Compiler
- Code splitting for better caching
- Asset optimization and compression
- Security headers and performance optimizations

### Environment Variables

GitHub Pages deployment uses production environment variables with:

- Supabase production credentials
- Analytics and error tracking enabled
- Optimized performance settings

## Workflow Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`) includes:

1. **Test Job**:
   - Checkout code
   - Setup Node.js 18
   - Install dependencies
   - Run linting
   - Run unit tests

2. **Build Job**:
   - Setup GitHub Pages
   - Build production version
   - Upload build artifacts

3. **Deploy Job**:
   - Deploy to GitHub Pages
   - Only runs on main branch pushes

## Monitoring and Verification

After deployment, verify:

1. **Site loads**: https://gaijinxx.github.io/AzMed/
2. **All features work**: Search, pagination, sorting, language switching
3. **No console errors**: Check browser developer tools
4. **Performance**: Check loading times and responsiveness
5. **Mobile compatibility**: Test on different devices

## Troubleshooting

### Common Issues

1. **404 Error on Page Refresh**:
   - GitHub Pages doesn't support client-side routing by default
   - The workflow includes a 404.html redirect to handle this

2. **Assets Not Loading**:
   - Check that base URL is correctly set to `/AzMed/`
   - Verify all asset paths are relative

3. **Build Failures**:
   - Check GitHub Actions logs
   - Verify all secrets are properly set
   - Ensure tests are passing

4. **Supabase Connection Issues**:
   - Verify environment variables are set correctly
   - Check Supabase project settings and CORS configuration

### Debug Commands

```bash
# Test build locally
npm run build:gh-pages
npm run preview

# Check GitHub Actions logs
# Go to Actions tab in your repository

# Test production build
NODE_ENV=production npm run build:prod
```

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure DNS settings for your domain
3. Update the base URL configuration in `vite.config.js`

## Security Considerations

- Environment variables are stored as GitHub Secrets
- No sensitive data is exposed in the client-side code
- HTTPS is enforced by GitHub Pages
- Security headers are configured in the build

## Performance Optimization

The GitHub Pages deployment includes:

- **Gzip compression** by GitHub Pages CDN
- **Global CDN** distribution
- **Optimized caching** headers
- **Code splitting** for faster loading
- **Asset optimization** for smaller bundle sizes

## Maintenance

### Regular Tasks

1. **Monitor deployment status** in GitHub Actions
2. **Update dependencies** regularly
3. **Monitor performance** metrics
4. **Check for security updates**

### Updating the Site

1. Make changes to your code
2. Push to the main branch
3. GitHub Actions will automatically deploy
4. Verify the changes at https://gaijinxx.github.io/AzMed/

## Support

For deployment issues:

1. Check GitHub Actions logs
2. Review this documentation
3. Check GitHub Pages status: https://www.githubstatus.com/
4. Contact repository maintainers

---

**Deployment URL**: https://gaijinxx.github.io/AzMed/
**Repository**: https://github.com/GaijinXX/AzMed
**Last Updated**: $(date)