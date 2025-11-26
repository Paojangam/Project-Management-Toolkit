# Production Deployment Checklist

## Pre-Deployment

### Backend
- [ ] MongoDB Atlas database created
- [ ] MongoDB connection string ready
- [ ] JWT_SECRET generated (use: `openssl rand -base64 32`)
- [ ] All environment variables documented
- [ ] `.env` file is in `.gitignore`
- [ ] `render.yaml` file created
- [ ] Health check endpoint working (`/health`)
- [ ] CORS configured for production
- [ ] Socket.IO CORS configured
- [ ] Error handling middleware in place
- [ ] All routes protected with authentication

### Frontend
- [ ] `vercel.json` file created
- [ ] API base URL uses environment variable (`VITE_API_BASE`)
- [ ] No hardcoded localhost URLs
- [ ] Build command works (`npm run build`)
- [ ] All environment variables documented
- [ ] `.env` file is in `.gitignore`

## Deployment Steps

### 1. Backend (Render)
- [ ] Push code to GitHub
- [ ] Create new Web Service in Render
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add all environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGO_URI` (MongoDB Atlas connection string)
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `FRONTEND_URL` (will update after frontend deploy)
  - [ ] `GOOGLE_CLIENT_ID` (if using Google login)
- [ ] Deploy and wait for success
- [ ] Test health endpoint: `https://your-api.onrender.com/health`
- [ ] Copy backend URL

### 2. Frontend (Vercel)
- [ ] Push code to GitHub
- [ ] Create new project in Vercel
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Framework: Vite (auto-detected)
- [ ] Add environment variable:
  - [ ] `VITE_API_BASE=https://your-api.onrender.com/api`
- [ ] Deploy and wait for success
- [ ] Copy frontend URL

### 3. Update Backend CORS
- [ ] Go back to Render dashboard
- [ ] Update `FRONTEND_URL` environment variable with Vercel URL
- [ ] Restart Render service
- [ ] Verify CORS is working

## Post-Deployment Testing

### Backend Tests
- [ ] Health check: `GET /health` returns 200
- [ ] Root endpoint: `GET /` returns API info
- [ ] Register: `POST /api/auth/register` works
- [ ] Login: `POST /api/auth/login` works
- [ ] Protected route: `GET /api/projects` requires auth
- [ ] CORS: Frontend can make requests

### Frontend Tests
- [ ] App loads without errors
- [ ] Login works
- [ ] Register works
- [ ] Projects list loads
- [ ] Can create project
- [ ] Can create task
- [ ] Can add comments
- [ ] Real-time updates work (Socket.IO)
- [ ] No console errors

## Common Issues & Solutions

### Issue: CORS Error
**Solution**: 
- Verify `FRONTEND_URL` in backend matches Vercel URL exactly
- Check for trailing slashes
- Ensure protocol is `https://` in production

### Issue: 401 Unauthorized
**Solution**:
- Check `JWT_SECRET` is set correctly
- Verify token is being sent in Authorization header
- Check token hasn't expired

### Issue: Database Connection Failed
**Solution**:
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
- Verify database user has correct permissions

### Issue: Socket.IO Not Connecting
**Solution**:
- Verify `FRONTEND_URL` is set in backend
- Check Socket.IO CORS configuration
- Ensure frontend is using correct backend URL

### Issue: Environment Variables Not Working
**Solution**:
- Vite: Must use `VITE_` prefix
- Changes require redeploy
- Check variable names match exactly

## Security Checklist

- [ ] `JWT_SECRET` is strong and unique
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets committed to Git
- [ ] MongoDB IP whitelist configured
- [ ] CORS restricted to production frontend URL only
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Error messages don't expose sensitive info

## Performance

- [ ] Database indexes created (if needed)
- [ ] Image uploads optimized (if using)
- [ ] API responses are paginated where needed
- [ ] Frontend assets are optimized (Vite handles this)

## Monitoring

- [ ] Render logs accessible
- [ ] Vercel logs accessible
- [ ] Error tracking set up (optional)
- [ ] Health check endpoint monitored

---

**Ready for Production?** ✅

If all items are checked, your app is ready for production deployment!

