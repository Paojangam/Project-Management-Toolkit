# Backend Environment Variables Setup

Create a `.env` file in the `backend` directory with the following variables:

## Required Variables

```bash
# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/projectmanagement
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port (Render sets this automatically, but you can override)
PORT=5000

# Environment
NODE_ENV=development
```

## Optional Variables

```bash
# JWT Expiration (default: 7d)
JWT_EXPIRES_IN=7d

# Frontend URL for CORS (set this in production)
# Development:
FRONTEND_URL=http://localhost:5173
# Production:
# FRONTEND_URL=https://your-app.vercel.app

# Google OAuth Client ID (if using Google login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Server Host (default: 0.0.0.0)
HOST=0.0.0.0
```

## For Render Deployment

Set these in Render Dashboard → Your Service → Environment:

- `NODE_ENV=production`
- `MONGO_URI` (your MongoDB Atlas connection string)
- `JWT_SECRET` (strong random string)
- `FRONTEND_URL` (your Vercel deployment URL)
- `GOOGLE_CLIENT_ID` (if using Google login)
- `PORT` (Render sets this automatically, but defaults to 10000)

## Security Notes

1. **Never commit `.env` file to Git**
2. **Use strong JWT_SECRET** - at least 32 characters
3. **In production, restrict MongoDB IP whitelist** in MongoDB Atlas
4. **Use HTTPS URLs** for FRONTEND_URL in production

