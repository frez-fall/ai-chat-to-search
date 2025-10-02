# Deployment Guide

This guide covers deploying the AI Flight Search system to production environments.

## ✅ Current Deployment Status

**Live Application**: https://frontend-5bhr9o1el-rahul-paylatertravs-projects.vercel.app

**Vercel Dashboard**: https://vercel.com/rahul-paylatertravs-projects/frontend

## 🔐 CRITICAL SECURITY ALERT

Your API keys have been exposed in the codebase and MUST be regenerated immediately:

1. **Regenerate OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Delete the exposed key starting with: `sk-proj-Sh2C08Al...`
   - Create a new key

2. **Regenerate Supabase Keys**
   - Go to: https://app.supabase.com
   - Navigate to Settings → API
   - Regenerate both anon and service role keys

## 📝 Required Environment Variables

Add these in Vercel Dashboard: https://vercel.com/rahul-paylatertravs-projects/frontend/settings/environment-variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | https://platform.openai.com/api-keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |

## 🚀 Quick Deploy to GitHub

### 1. Create GitHub Repository

```bash
# Option A: Using GitHub CLI (recommended)
gh repo create ai-chat-to-search --public --description "AI-powered natural language flight search system"

# Option B: Manual steps
# 1. Go to https://github.com/new
# 2. Repository name: ai-chat-to-search
# 3. Description: AI-powered natural language flight search system
# 4. Make it public (or private if preferred)
# 5. DO NOT initialize with README (we already have one)
```

### 2. Add GitHub Remote and Push

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/ai-chat-to-search.git

# Push main branch to GitHub
git branch -M main
git push -u origin main

# Verify the push
git remote -v
```

### 3. Verify GitHub Repository

Your repository should now contain:
- Complete source code (70+ files)
- Proper .gitignore (no sensitive data)
- Comprehensive documentation
- Ready-to-run setup scripts

## 🌐 Production Deployment Options

### Option 1: Vercel (Recommended for Next.js)

**Frontend Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? ai-flight-search-frontend
# - In which directory is your code located? ./
```

**Backend Deployment:**
```bash
# Deploy backend
cd ../backend
vercel

# Environment variables in Vercel dashboard:
# - OPENAI_API_KEY
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
# - NODE_ENV=production
```

### Option 2: Railway

**One-click deploy:**
```bash
# Connect GitHub repository
# Railway will auto-detect Next.js projects
# Add environment variables in Railway dashboard
```

### Option 3: Self-hosted (Docker)

**Create Docker files:**

`backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

`frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - NODE_ENV=production
```

## 🔒 Environment Configuration

### Production Environment Variables

**Backend (.env.production):**
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_ENVIRONMENT=production
```

### Security Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] Production API keys are different from development
- [ ] Supabase RLS policies are configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Monitoring is set up

## 🗄️ Database Deployment

### Supabase Production Setup

1. **Create Production Project:**
   ```bash
   # Create new Supabase project for production
   # Use different project from development
   ```

2. **Run Migrations:**
   ```sql
   -- In Supabase SQL Editor
   -- Run: backend/supabase/migrations/001_initial_schema.sql
   -- Run: backend/supabase/seeds/destination_recommendations.sql
   ```

3. **Configure RLS:**
   ```sql
   -- Adjust RLS policies for production
   -- Review authentication requirements
   ```

### Database Backup Strategy

```bash
# Automated backups (Supabase Pro)
# Daily automatic backups available
# Point-in-time recovery available

# Manual backup
pg_dump "postgresql://..." > backup.sql
```

## 📊 Monitoring & Analytics

### Health Checks

```bash
# Production health check
curl https://your-api-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "openai": "configured",
    "supabase": "configured"
  }
}
```

### Error Tracking

**Sentry Integration:**
```bash
npm install @sentry/nextjs

# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

**OpenAI Usage Monitoring:**
```bash
# Monitor token usage
# Set up billing alerts
# Track API response times
```

## 🔄 CI/CD Pipeline

### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous version
git log --oneline -10  # Find commit hash
git revert COMMIT_HASH
git push origin main

# Or revert to specific tag
git checkout v1.0.0
git checkout -b hotfix/rollback
git push origin hotfix/rollback
```

### Database Rollback

```bash
# Supabase point-in-time recovery
# Available in Supabase dashboard
# Can restore to any point in time
```

## 📈 Performance Optimization

### Production Settings

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-cdn-domain.com'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}
```

### CDN Configuration

- Enable gzip/brotli compression
- Set appropriate cache headers
- Use image optimization
- Enable HTTP/2

## 🔐 Security Hardening

### Production Security

```js
// Security headers
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}
```

### API Rate Limiting

```js
// Implement rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 📞 Post-Deployment Checklist

- [ ] All services are healthy
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] DNS records updated
- [ ] SSL certificates active
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] Team has access to production systems
- [ ] Documentation updated with production URLs
- [ ] Load testing completed

## 🎯 Production URLs

After deployment, update these in your documentation:

- **Frontend:** https://your-frontend-domain.com
- **Backend API:** https://your-backend-domain.com/api
- **Health Check:** https://your-backend-domain.com/api/health
- **Documentation:** https://your-frontend-domain.com/docs

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check NEXT_PUBLIC_API_URL configuration
   - Verify backend CORS settings

2. **Database Connection:**
   - Confirm Supabase credentials
   - Check network connectivity

3. **OpenAI API Errors:**
   - Verify API key is valid
   - Check billing and usage limits

4. **Build Failures:**
   - Clear node_modules and reinstall
   - Check for TypeScript errors

### Support Resources

- GitHub Issues: Create issue in your repository
- Vercel Support: For deployment issues
- Supabase Support: For database issues
- OpenAI Support: For API issues