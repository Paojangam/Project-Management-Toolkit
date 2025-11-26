# Frontend Environment Variables Setup

Create a `.env` file in the `frontend` directory with the following variables:

## Required Variables

```bash
# API Base URL
# Development (local backend):
VITE_API_BASE=http://localhost:5000/api

# Production (Render backend):
# VITE_API_BASE=https://your-backend.onrender.com/api
```

## For Vercel Deployment

Set this in Vercel Dashboard → Your Project → Settings → Environment Variables:

- `VITE_API_BASE` = `https://your-backend.onrender.com/api`

**Important**: 
- Vite requires the `VITE_` prefix for environment variables
- Replace `your-backend.onrender.com` with your actual Render backend URL
- Make sure to include `/api` at the end

## Notes

- Environment variables are embedded at build time in Vite
- After changing environment variables in Vercel, you need to redeploy
- The API base URL should not have a trailing slash (except `/api`)

