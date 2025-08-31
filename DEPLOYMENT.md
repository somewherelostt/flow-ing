# 🚀 Deployment Guide: MongoDB Atlas + Vercel + Render

## 📋 Prerequisites
- [x] MongoDB Atlas account
- [x] Vercel account
- [x] Render account
- [x] GitHub repository ready

---

## 🍃 MongoDB Atlas Setup

### 1. Create Cluster & Get Connection String
1. **Login to MongoDB Atlas**: https://mongodb.com/atlas
2. **Create Database**: 
   - Choose FREE M0 tier
   - Region: Choose closest to your users
   - Cluster Name: `kaizen-cluster`

3. **Database Access**:
   - Add Database User
   - Username: `kaizen-admin`
   - Password: Generate secure password (save it!)
   - Role: "Atlas admin" or "Read and write to any database"

4. **Network Access**:
   - Add IP Address
   - Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)
   - Or add specific IPs for better security

5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Choose Driver: Node.js, Version: 4.1+
   - Copy connection string:
   ```
   mongodb+srv://kaizen-admin:<password>@kaizen-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 🖥️ Backend Deployment (Render)

### 1. Push Backend to GitHub
```bash
cd backend/
git init
git add .
git commit -m "Initial backend commit"
git push origin main
```

### 2. Deploy on Render
1. **Login to Render**: https://render.com
2. **Create Web Service**:
   - Connect GitHub repository
   - Select your repository
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables** (in Render dashboard):
   ```
   DB_URL=mongodb+srv://kaizen-admin:YOUR_PASSWORD@kaizen-cluster.xxxxx.mongodb.net/kaizen-events?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   NODE_ENV=production
   PORT=4000
   ```

4. **Deploy**: Click "Create Web Service"
5. **Get URL**: Copy your backend URL (e.g., `https://kaizen-backend.onrender.com`)

---

## 🌐 Frontend Deployment (Vercel)

### 1. Environment Variables Setup
Add these in Vercel dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
NEXT_PUBLIC_KAIZEN_EVENT_CONTRACT=0x045a1763c93006ca
NEXT_PUBLIC_KAIZEN_NFT_CONTRACT=0x045a1763c93006ca
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

### 2. Deploy to Vercel
```bash
# Option 1: CLI
npm i -g vercel
vercel --prod

# Option 2: GitHub Integration
# Connect your GitHub repo to Vercel dashboard
```

---

## 🔗 Update API URLs

### Update Frontend API Calls
In your frontend, replace hardcoded backend URLs with environment variable:

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const apiUrl = (path: string) => `${API_BASE}${path}`;
```

---

## 🧪 Testing Checklist

### Backend Testing:
- [ ] `https://your-backend.onrender.com/api/health` returns `{"status":"ok"}`
- [ ] MongoDB connection successful (check Render logs)
- [ ] CORS allows your Vercel domain

### Frontend Testing:
- [ ] Wallet connection works
- [ ] Events load from MongoDB
- [ ] Event creation/deletion works
- [ ] Authentication flows work

---

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Add your Vercel URL to backend CORS origins
   - Redeploy backend after CORS update

2. **MongoDB Connection Issues**:
   - Verify connection string format
   - Check Network Access allows 0.0.0.0/0
   - Verify database user permissions

3. **Environment Variables**:
   - Double-check all env vars are set in Vercel
   - Verify NEXT_PUBLIC_ prefix for client-side vars

4. **Build Errors**:
   - Run `npm run build` locally first
   - Check TypeScript errors

---

## 🎯 Quick Deploy Commands

### Full Deployment:
```bash
# 1. Commit latest changes
git add . && git commit -m "Ready for production deployment"
git push origin main

# 2. Deploy to Vercel
npx vercel --prod

# 3. Check deployments
echo "Frontend: https://your-app.vercel.app"
echo "Backend: https://your-backend.onrender.com"
```

---

## 📱 Final Steps
1. Test all functionality on live URLs
2. Update CORS in backend if needed  
3. Monitor logs for any issues
4. Set up custom domains (optional)

Your Kaizen Flow Event Platform is now live! 🎉
