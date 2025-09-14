# 🚀 2D Metaverse Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Add environment variables:**
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_PASSWORD=your-super-secret-jwt-key-here
   HTTP_PORT=3000
   WS_PORT=3001
   FRONTEND_PORT=5173
   ```
4. **Deploy!** Railway will automatically build and deploy your app

### Option 2: Render

1. **Sign up at [Render.com](https://render.com)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Set build command:** `cd metaverse && pnpm install && pnpm run build:all`
5. **Set start command:** `cd metaverse && pnpm run start:all`
6. **Add environment variables** (same as Railway)

### Option 3: Vercel + Railway (Hybrid)

1. **Deploy backend to Railway** (HTTP + WebSocket + Database)
2. **Deploy frontend to Vercel** (Static hosting)
3. **Update frontend config** to point to Railway URLs

## Environment Variables Needed

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret (generate a strong random string)
JWT_PASSWORD="your-super-secret-jwt-key-here"

# Server Ports
HTTP_PORT=3000
WS_PORT=3001
FRONTEND_PORT=5173
```

## Database Setup

### For Production:
1. **Railway PostgreSQL** (easiest)
2. **Supabase** (free tier available)
3. **Neon** (serverless PostgreSQL)

### Database Migration:
```bash
cd metaverse/packages/db
npx prisma migrate deploy
```

## Pre-Deployment Checklist

- [ ] Update `config.ts` to use production URLs
- [ ] Set up production database
- [ ] Generate strong JWT secret
- [ ] Test locally with production settings
- [ ] Update CORS settings for production domain

## Post-Deployment

1. **Run database migrations**
2. **Test all functionality**
3. **Set up custom domain** (optional)
4. **Monitor logs** for any issues

## Troubleshooting

- **WebSocket issues**: Ensure your platform supports WebSockets
- **CORS errors**: Update CORS settings for your domain
- **Database connection**: Check DATABASE_URL format
- **Port issues**: Some platforms use different port assignment
