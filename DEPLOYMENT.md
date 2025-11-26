# Deployment Guide

This guide will help you deploy the Project Management application to Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)
- MongoDB Atlas account (free tier available) or MongoDB instance

## Backend Deployment (Render)

### Step 1: Prepare Backend

1. Push your backend code to GitHub
2. Make sure you have a `render.yaml` file in the backend directory

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository and branch
5. Configure:
   - **Name**: `project-management-api` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

### Step 3: Set Environment Variables in Render

Go to your service → Environment tab and add:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your-very-strong-random-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PORT=10000
```

**Important Notes:**
- `MONGO_URI`: Get this from MongoDB Atlas
- `JWT_SECRET`: Generate a strong random string (use: `openssl rand -base64 32`)
- `FRONTEND_URL`: Will be set after frontend deployment
- `PORT`: Render uses port 10000 by default, but it's set via `PORT` env var

### Step 4: Get Backend URL

After deployment, Render will provide a URL like:
`https://project-management-api.onrender.com`

**Note**: Free tier services spin down after 15 minutes of inactivity. First request may take 30-50 seconds.

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Push your frontend code to GitHub
2. Make sure `vercel.json` exists in the frontend directory

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

```
VITE_API_BASE=https://your-backend.onrender.com/api
```

Replace `your-backend.onrender.com` with your actual Render backend URL.

### Step 4: Update Backend CORS

After getting your Vercel URL (e.g., `https://your-app.vercel.app`), update the backend environment variable in Render:

```
FRONTEND_URL=https://your-app.vercel.app
```

Then restart the Render service.

---

## Environment Variables Summary

### Backend (.env or Render Environment Variables)

```bash
# Required
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

# Optional
JWT_EXPIRES_IN=7d
PORT=10000
GOOGLE_CLIENT_ID=your-google-client-id
```

### Frontend (Vercel Environment Variables)

```bash
# Required
VITE_API_BASE=https://your-backend.onrender.com/api
```

---

## Local Development Setup

### Backend

1. Create `backend/.env` file:
```bash
MONGO_URI=mongodb://localhost:27017/projectmanagement
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Start server:
```bash
npm run dev
```

### Frontend

1. Create `frontend/.env` file:
```bash
VITE_API_BASE=http://localhost:5000/api
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Start dev server:
```bash
npm run dev
```

---

## Troubleshooting

### Backend Issues

1. **CORS Errors**: Make sure `FRONTEND_URL` in backend matches your Vercel URL exactly
2. **Database Connection**: Verify `MONGO_URI` is correct and MongoDB Atlas allows connections from Render IPs (0.0.0.0/0)
3. **Port Issues**: Render sets PORT automatically, don't hardcode it
4. **Cold Starts**: Free tier services spin down after inactivity. First request will be slow

### Frontend Issues

1. **API Connection**: Verify `VITE_API_BASE` is correct and includes `/api` at the end
2. **Build Errors**: Make sure all dependencies are in `package.json`
3. **Environment Variables**: Vite requires `VITE_` prefix for env vars

### Common Errors

- **401 Unauthorized**: Check JWT_SECRET is set correctly
- **CORS Error**: Verify FRONTEND_URL matches your Vercel deployment URL
- **Database Error**: Check MONGO_URI and MongoDB connection settings
- **Socket.IO Connection Failed**: Ensure FRONTEND_URL is set correctly in backend

---

## Production Checklist

- [ ] MongoDB Atlas database created and accessible
- [ ] Backend deployed to Render with all environment variables
- [ ] Frontend deployed to Vercel with VITE_API_BASE set
- [ ] FRONTEND_URL updated in backend after getting Vercel URL
- [ ] CORS working (test API calls from frontend)
- [ ] Authentication working (test login/register)
- [ ] Socket.IO working (test real-time features)
- [ ] All features tested in production

---

## Security Notes

1. **Never commit `.env` files** - They contain sensitive data
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Restrict MongoDB IPs** - In production, limit MongoDB Atlas IP whitelist
4. **Use HTTPS** - Both Vercel and Render provide HTTPS by default
5. **Update CORS** - Only allow your production frontend URL

---

## Support

If you encounter issues:
1. Check Render logs: Service → Logs
2. Check Vercel logs: Deployment → Functions → Logs
3. Verify all environment variables are set correctly
4. Test API endpoints directly using Postman or curl

