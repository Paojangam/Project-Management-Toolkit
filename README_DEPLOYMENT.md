# Quick Deployment Guide

## 🚀 Quick Start

### Backend (Render)

1. **Push code to GitHub**
2. **Go to Render Dashboard** → New Web Service
3. **Connect GitHub repo** → Select `backend` as root directory
4. **Set Environment Variables:**
   ```
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-uri
   JWT_SECRET=generate-with-openssl-rand-base64-32
   FRONTEND_URL=https://your-app.vercel.app (set after frontend deploy)
   ```
5. **Build Command:** `npm install`
6. **Start Command:** `npm start`
7. **Save** → Wait for deployment
8. **Copy your Render URL** (e.g., `https://your-api.onrender.com`)

### Frontend (Vercel)

1. **Go to Vercel Dashboard** → Add New Project
2. **Import GitHub repo** → Select `frontend` as root directory
3. **Framework:** Vite (auto-detected)
4. **Set Environment Variable:**
   ```
   VITE_API_BASE=https://your-api.onrender.com/api
   ```
5. **Deploy** → Wait for deployment
6. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)
7. **Update Backend:** Go back to Render → Update `FRONTEND_URL` → Restart service

## 📋 Environment Variables Checklist

### Backend (Render)
- ✅ `NODE_ENV=production`
- ✅ `MONGO_URI` (MongoDB Atlas connection string)
- ✅ `JWT_SECRET` (strong random string)
- ✅ `FRONTEND_URL` (your Vercel URL)
- ⚪ `GOOGLE_CLIENT_ID` (optional, if using Google login)
- ⚪ `JWT_EXPIRES_IN=7d` (optional, default is 7d)

### Frontend (Vercel)
- ✅ `VITE_API_BASE` (your Render backend URL + `/api`)

## 🔧 Local Development

### Backend
```bash
cd backend
# Create .env file (see backend/ENV_SETUP.md)
npm install
npm run dev
```

### Frontend
```bash
cd frontend
# Create .env file (see frontend/ENV_SETUP.md)
npm install
npm run dev
```

## ⚠️ Important Notes

1. **Render Free Tier**: Services spin down after 15 min inactivity. First request may take 30-50 seconds.
2. **CORS**: Make sure `FRONTEND_URL` in backend matches your Vercel URL exactly (including https://)
3. **MongoDB Atlas**: Add `0.0.0.0/0` to IP whitelist for Render to connect
4. **Environment Variables**: Vite requires `VITE_` prefix. Changes require redeploy.

## 🐛 Troubleshooting

- **CORS Error**: Check `FRONTEND_URL` matches Vercel URL exactly
- **401 Unauthorized**: Verify `JWT_SECRET` is set correctly
- **Database Error**: Check `MONGO_URI` and MongoDB Atlas network access
- **API Not Found**: Ensure `VITE_API_BASE` ends with `/api`

For detailed instructions, see `DEPLOYMENT.md`

