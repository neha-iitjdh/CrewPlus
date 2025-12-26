# CrewPlus Deployment Guide - Render

This guide walks you through deploying CrewPlus to Render.

## Prerequisites

- A [Render](https://render.com) account
- A MongoDB Atlas database (you already have this)
- Your repository pushed to GitHub/GitLab

## Quick Deploy with Blueprint

1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/CrewPlus.git
   git push -u origin master
   ```

2. Go to [Render Dashboard](https://dashboard.render.com)

3. Click **New** → **Blueprint**

4. Connect your GitHub repository

5. Render will detect `render.yaml` and create both services

## Manual Deploy (Alternative)

### Step 1: Deploy Backend API

1. Go to Render Dashboard → **New** → **Web Service**

2. Connect your repository

3. Configure:
   - **Name**: `crewplus-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Generate a strong random string |
   | `JWT_EXPIRE` | `7d` |
   | `CLIENT_URL` | `https://crewplus-client.onrender.com` (update after creating frontend) |

5. Click **Create Web Service**

### Step 2: Deploy Frontend

1. Go to Render Dashboard → **New** → **Static Site**

2. Connect your repository

3. Configure:
   - **Name**: `crewplus-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. Add Environment Variable:
   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://crewplus-api.onrender.com/api` |

5. Add Rewrite Rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

6. Click **Create Static Site**

### Step 3: Update Backend CORS

After both services are deployed, update the backend's `CLIENT_URL` environment variable to match your frontend URL.

## Environment Variables Reference

### Backend (server)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | Server port (default: 5000) | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `JWT_EXPIRE` | Token expiration (e.g., `7d`) | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `SMTP_HOST` | Email server host | Optional |
| `SMTP_PORT` | Email server port | Optional |
| `SMTP_USER` | Email username | Optional |
| `SMTP_PASS` | Email password | Optional |
| `SMTP_FROM` | From email address | Optional |

### Frontend (client)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |

## Post-Deployment

1. **Seed the database** (optional):
   ```bash
   # Use Render Shell or connect locally
   npm run seed
   ```

2. **Create admin user**:
   - Register a new user through the app
   - Use MongoDB Compass or Atlas to change their role to `admin`

3. **Test the deployment**:
   - Visit your frontend URL
   - Test user registration/login
   - Test product browsing
   - Test cart and checkout

## Troubleshooting

### API not connecting
- Check `REACT_APP_API_URL` is set correctly
- Verify `CLIENT_URL` in backend matches frontend URL
- Check CORS configuration in `server/src/app.js`

### Build failures
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database connection issues
- Whitelist Render IP addresses in MongoDB Atlas
- Or use `0.0.0.0/0` to allow all IPs (less secure)
- Verify connection string format

## URLs After Deployment

- **Frontend**: `https://crewplus-client.onrender.com`
- **Backend API**: `https://crewplus-api.onrender.com`
- **Health Check**: `https://crewplus-api.onrender.com/api/health`
