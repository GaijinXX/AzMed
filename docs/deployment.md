# Deployment Guide for Azerbaijan Drug Database

## Overview

This guide covers the complete deployment process for the Azerbaijan Drug Database application, including environment setup, build optimization, and hosting configuration.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git repository access
- Supabase project credentials

## Environment Setup

### 1. Environment Variables

Create environment files for different deployment stages:

#### Production (.env.production)
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://uxmvulvmvtismnokxsry.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_key
VITE_APP_TITLE=Azerbaijan Drug Database
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
GENERATE_SOURCEMAP=false
```

#### Staging (.env.staging)
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://uxmvulvmvtismnokxsry.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_key
VITE_APP_TITLE=Azerbaijan Drug Database (Staging)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=true
GENERATE_SOURCEMAP=true
```

### 2. Build Commands

```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod

# Build with bundle analysis
npm run build:analyze
```

## Deployment Options

### Option 1: GitHub Pages Deployment (Recommended)

#### Automatic Deployment
1. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Select "GitHub Actions" as source

2. Add repository secrets:
   ```
   VITE_SUPABASE_URL=https://uxmvulvmvtismnokxsry.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. Push to main branch triggers automatic deployment
4. Site will be available at: https://gaijinxx.github.io/AzMed/

#### Manual Deployment
```bash
# Build for GitHub Pages
npm run build:gh-pages

# The dist/ folder contains the built files
```

### Option 2: Netlify Deployment

#### Manual Deployment
1. Build the application:
   ```bash
   npm run build:prod
   ```

2. Deploy to Netlify:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

#### Automatic Deployment
1. Connect your Git repository to Netlify
2. Configure build settings:
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
   - Node version: `18`

3. Set environment variables in Netlify dashboard
4. Enable automatic deployments on push to main branch

### Option 2: Vercel Deployment

#### Manual Deployment
1. Build the application:
   ```bash
   npm run build:prod
   ```

2. Deploy to Vercel:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

#### Automatic Deployment
1. Connect your Git repository to Vercel
2. Configure project settings:
   - Framework: Vite
   - Build command: `npm run build:prod`
   - Output directory: `dist`

3. Set environment variables in Vercel dashboard
4. Enable automatic deployments

### Option 3: GitHub Actions CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Runs tests and linting on every push
2. Builds the application for staging and production
3. Deploys to staging on pull requests
4. Deploys to production on main branch pushes

#### Required Secrets
Set these secrets in your GitHub repository:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
NETLIFY_SITE_ID
NETLIFY_AUTH_TOKEN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Performance Optimization

### Build Optimizations

The application includes several React 19 and Vite optimizations:

1. **React Compiler**: Automatic optimization of components and hooks
2. **Code Splitting**: Vendor and feature-based chunk splitting
3. **Asset Optimization**: Optimized file naming and caching
4. **Bundle Analysis**: Built-in bundle size analysis

### Monitoring Setup

The application includes comprehensive monitoring:

1. **Performance Metrics**: Web Vitals (LCP, FID, CLS)
2. **Error Tracking**: Global error handlers and React error boundaries
3. **Analytics**: User interaction tracking (optional)
4. **Health Checks**: Service availability monitoring

### Caching Strategy

Optimized caching headers are configured for:

- **Static Assets**: 1 year cache with immutable flag
- **HTML Files**: 1 hour cache for content updates
- **API Responses**: 5 minutes cache for data freshness

## Security Configuration

### Headers
Both Netlify and Vercel configurations include security headers:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Content Security Policy
Implement CSP headers for additional security:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' https://uxmvulvmvtismnokxsry.supabase.co;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://uxmvulvmvtismnokxsry.supabase.co;
```

## Testing Before Deployment

### Pre-deployment Checklist

1. **Run Tests**:
   ```bash
   npm run test:run
   npm run test:coverage
   ```

2. **Lint Code**:
   ```bash
   npm run lint
   npm run lint:fix
   ```

3. **Build and Preview**:
   ```bash
   npm run build:prod
   npm run preview
   ```

4. **Performance Check**:
   ```bash
   npm run build:analyze
   ```

### Manual Testing

1. Test all major user flows:
   - Search functionality
   - Pagination
   - Column sorting
   - Language switching
   - Theme switching
   - Column visibility

2. Test responsive design on different screen sizes
3. Test accessibility with screen readers
4. Test performance with large datasets

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Check environment variables

2. **Runtime Errors**:
   - Check browser console for errors
   - Verify Supabase credentials
   - Check network connectivity

3. **Performance Issues**:
   - Run bundle analysis
   - Check CDN configuration
   - Monitor Web Vitals

### Debug Commands

```bash
# Check build output
npm run build:prod && ls -la dist/

# Analyze bundle size
npm run build:analyze

# Test production build locally
npm run preview:prod

# Check environment variables
echo $NODE_ENV
```

## Monitoring and Maintenance

### Post-deployment Monitoring

1. **Performance Monitoring**:
   - Monitor Web Vitals scores
   - Track bundle size changes
   - Monitor API response times

2. **Error Tracking**:
   - Monitor error rates
   - Track user-reported issues
   - Monitor console errors

3. **Usage Analytics**:
   - Track user interactions
   - Monitor search patterns
   - Analyze user flows

### Regular Maintenance

1. **Dependencies**:
   - Update dependencies monthly
   - Security audit with `npm audit`
   - Test after updates

2. **Performance**:
   - Regular bundle analysis
   - Performance testing
   - CDN cache optimization

3. **Security**:
   - Regular security scans
   - Update security headers
   - Monitor for vulnerabilities

## Rollback Procedures

### Quick Rollback

1. **Netlify**:
   ```bash
   netlify rollback
   ```

2. **Vercel**:
   - Use Vercel dashboard to rollback to previous deployment

3. **GitHub Actions**:
   - Revert the problematic commit
   - Push to trigger new deployment

### Emergency Procedures

1. Take down the site temporarily if critical issues occur
2. Investigate and fix issues in development
3. Deploy hotfix through staging first
4. Monitor closely after deployment

## Support and Documentation

### Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React 19 Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

### Getting Help

1. Check application logs and monitoring data
2. Review this deployment guide
3. Check GitHub Issues for known problems
4. Contact the development team for support