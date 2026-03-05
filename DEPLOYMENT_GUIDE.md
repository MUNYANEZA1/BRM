# Deployment Guide - Bar Restaurant Management System

## Problem: 500 Error on Registration/Login with Render & Vercel

Your application works locally because you have a `.env` file with local values. On production (Render/Vercel), these environment variables are **NOT set**, causing:
- Missing JWT_SECRET → Token generation fails → 500 Error
- Missing MONGODB_URI → Database connection fails → 500 Error
- CORS issues → Browser blocks requests

---

## Solution: Configure Environment Variables

### 1. **Get Your MongoDB Connection String**

#### Option A: MongoDB Atlas (Cloud - Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
5. Save this for later

#### Option B: Keep Local MongoDB (Not Recommended for Production)
- If you have MongoDB running locally, the string is: `mongodb://localhost:27017/bar_restaurant_db`
- But this won't work on Render/Vercel unless your local MongoDB is exposed to the internet

---

### 2. **Generate a Secure JWT Secret**

Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a secure 64-character string. Save it.

---

### 3. **Deploy on Render (Backend)**

#### Step 1: Create a Web Service
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

#### Step 2: Basic Information
- **Name**: `bar-restaurant-api` (or your choice)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend` (if not already set)

#### Step 3: Set Environment Variables
Click on "Environment" and add these variables:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Your generated JWT secret |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g., `https://yourapp.vercel.app`) |

#### Step 4: Deploy
Click "Deploy" and wait 3-5 minutes. Your backend URL will look like: `https://bar-restaurant-api.onrender.com`

---

### 4. **Deploy on Vercel (Frontend)**

#### Step 1: Update API URL
Edit [frontend/src/services/api.js](../frontend/src/services/api.js):

```javascript
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://bar-restaurant-api.onrender.com/api'; // Update with your Render URL
```

#### Step 2: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub project
3. Set Root Directory: `frontend`
4. Click "Deploy"

#### Step 3: Configure Environment (Optional)
If you want to use environment variables:
1. Go to Project Settings → Environment Variables
2. Add `VITE_API_URL=https://bar-restaurant-api.onrender.com/api`

---

### 5. **Update CORS in Backend**

Edit [backend/middleware/cors.js](../backend/middleware/cors.js) to include your Vercel URL:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-vercel-app.vercel.app', // Add this
  process.env.FRONTEND_URL,
].filter(Boolean);
```

---

## Verification Checklist

- [ ] Created MongoDB Atlas account and got connection string
- [ ] Generated JWT_SECRET and saved it securely
- [ ] Created Render web service with correct environment variables
- [ ] Deployed backend to Render
- [ ] Updated frontend API URL
- [ ] Deployed frontend to Vercel
- [ ] Updated CORS allowed origins
- [ ] Tested login: `https://brm-backend-hak4.onrender.com/api/auth/login` returns proper error (not 500)
- [ ] Tested from frontend: registration and login work

---

## Testing

### Test Backend Health
```
GET https://your-render-url.onrender.com/health

Response should be:
{
  "status": "ok",
  "env": "production",
  "dbState": 1,
  "dbStateDesc": "connected"
}
```

### Test Login Endpoint
```bash
curl -X POST https://your-render-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password"}'
```

You should get either:
- 401: Invalid credentials (expected if user doesn't exist)
- 400: Validation error
- 500: Environment not configured properly

If you get 500, check Render logs for errors.

---

## Troubleshooting

### 500 Error on Login/Register

**Check Render Logs:**
1. Go to Render.com → Your Web Service
2. Click "Logs" tab
3. Look for error messages like:
   - `JWT_SECRET is not set` → Add JWT_SECRET variable
   - `MongoDB connection error` → Check MONGODB_URI
   - Any other error → This is your real issue

### CORS Error in Browser

**Error**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
1. Add your Vercel URL to `allowedOrigins` in [backend/middleware/cors.js](../backend/middleware/cors.js)
2. Redeploy backend
3. Clear browser cache and try again

### Database Connection Timeout

**Solution**:
1. Verify MONGODB_URI is correct
2. If using MongoDB Atlas, whitelist Render's IP:
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (or add Render's IP)

### Frontend Can't Reach Backend

**Solution**:
1. Check CORS configuration
2. Verify FRONTEND_URL environment variable is set correctly
3. Check that backend is running: `https://your-url/health`

---

## Security Best Practices

1. **Never commit .env file** - It's in .gitignore ✅
2. **Use strong JWT_SECRET** - Min 32 characters ✅
3. **Enable HTTPS** - Both Render and Vercel do this automatically ✅
4. **Restrict CORS origins** - Don't use `*` in production
5. **Hide sensitive errors** - Only show full errors in development
6. **Use Database IP Whitelist** - Don't allow "anywhere" on MongoDB Atlas in production

---

## Next Steps

1. Follow the steps above to deploy
2. Test both registration and login
3. Create an admin user through the registration endpoint
4. Configure email (optional) in environment variables
5. Monitor Render logs for any issues

**If you still get errors after setup, share the Render logs and I'll help debug!**
