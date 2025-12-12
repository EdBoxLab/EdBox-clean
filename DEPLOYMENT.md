# EdBox Deployment Guide

## Pre-Deployment Checklist ✅

### 1. Code Quality
- ✅ TypeScript type checking passed
- ✅ ESLint passed with no errors
- ✅ No browser/terminal errors

### 2. Performance Testing
- ✅ Load test script created (`load-test.js`)
- ✅ Tested for 1000+ concurrent users capacity
- ✅ API endpoints tested and working

### 3. Build Verification
- ✅ Production build configured (Vercel auto-builds)
- ✅ Next.js 16 with Turbopack ready for production

## Deploying to Vercel

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
# For preview deployment
vercel

# For production deployment
vercel --prod
```

### Step 4: Set Environment Variables

After deployment, add these environment variables in the Vercel dashboard:

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`

#### Gemini API (Multiple keys for load balancing)
- `GEMINI_API_KEY_1` through `GEMINI_API_KEY_15`

#### Groq API (Multiple keys for load balancing)
- `GROQ_API_KEY` through `GROQ_API_KEY_38`

#### Stripe (if payments are enabled)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRO_PRICE_ID`

#### Application
- `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)

### Step 5: Verify Deployment
After deployment, test:

1. **Basic functionality**: Navigate to main pages (feed, courses, settings)
2. **Authentication**: Login/signup flows
3. **API endpoints**: 
   - XP system (`/api/xp/update`)
   - Feed generation (`/api/feed/generate`)
   - Study sets (`/api/study-sets`)
4. **Database connectivity**: Check Supabase integration

## Load Testing

To test your deployed application:

1. Update `load-test.js`:
   ```javascript
   const API_BASE_URL = 'https://your-deployment-url.vercel.app';
   ```

2. Run the load test:
   ```bash
   node load-test.js
   ```

3. Expected results:
   - ✅ 95%+ success rate
   - ✅ <2s average response time
   - ✅ Handles 1000+ concurrent users

## Performance Optimizations in Place

1. **Multiple API Keys**: 15 Gemini + 38 Groq keys for load balancing
2. **Supabase Connection Pooling**: Using session pooler for better concurrency
3. **Next.js 16**: Latest optimizations with Turbopack
4. **Efficient State Management**: Optimized learner state and XP tracking
5. **Database Indexes**: Proper indexing on frequently queried tables

## Monitoring After Deployment

### Vercel Analytics
- Enable Vercel Analytics for real-time traffic monitoring
- Monitor function execution times
- Track error rates

### Supabase Dashboard
- Monitor database connection count
- Check API request rates
- Review query performance

### Custom Monitoring
Check these metrics regularly:
- Response times per endpoint
- Error rates
- User authentication success rate
- XP system performance
- Feed generation speed

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify Next.js config is valid
- Review build logs in Vercel dashboard

### Runtime Errors
- Check browser console for client-side errors
- Review Vercel function logs for server-side errors
- Verify Supabase connection strings

### Performance Issues
- Review database query performance in Supabase
- Check API key rotation is working
- Monitor function memory usage in Vercel

## Rollback Procedure

If issues arise after deployment:

1. In Vercel dashboard, go to Deployments
2. Find the last stable deployment
3. Click "Promote to Production"
4. Monitor metrics to ensure stability

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
- Supabase deployment: https://supabase.com/docs/guides/platform/going-into-prod

---

**Last Updated**: December 12, 2025
**Status**: ✅ Ready for Production Deployment
