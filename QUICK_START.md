# 🚀 Quick Start - Production Deployment

## One-Minute Setup Guide

### Backend (Render) - 5 minutes

```bash
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub → Select repo
4. Settings:
   - Name: project-management-api
   - Root Directory: backend
   - Build: npm install
   - Start: npm start
5. Environment Variables:
   NODE_ENV=production
   MONGO_URI=your-mongodb-uri
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://your-app.vercel.app (set later)
6. Deploy → Copy URL
```

### Frontend (Vercel) - 3 minutes

```bash
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub → Select repo
4. Settings:
   - Root Directory: frontend
   - Framework: Vite (auto)
5. Environment Variable:
   VITE_API_BASE=https://your-api.onrender.com/api
6. Deploy → Copy URL
7. Update backend FRONTEND_URL → Restart
```

## Environment Variables

### Backend (Render)
```
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=generate-strong-key
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```
VITE_API_BASE=https://your-api.onrender.com/api
```

## Test Your Deployment

1. **Backend Health**: `https://your-api.onrender.com/health`
2. **Frontend**: Visit your Vercel URL
3. **Login**: Test authentication
4. **CORS**: Should work automatically

## Need Help?

- See `DEPLOYMENT.md` for detailed instructions
- See `PRODUCTION_CHECKLIST.md` for complete checklist
- Check Render/Vercel logs for errors

---

**That's it!** Your app is now live! 🎉

