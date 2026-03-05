# ✅ Deployment Checklist - Bar Restaurant Management System

## Pre-Deployment (Local Testing)

- [ ] Run `npm install` in both `backend/` and `frontend/`
- [ ] Start backend: `npm run dev` in `backend/`
- [ ] Start frontend: `npm run dev` in `frontend/`
- [ ] Test login/register locally at `http://localhost:5173`
- [ ] Verify it works smoothly with no errors

---

## Step 1: Prepare Production Credentials (5 min)

### MongoDB Setup
- [ ] Create free MongoDB Atlas account: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Create a cluster
- [ ] Create a database user (username & password)
- [ ] Whitelist your IP: Network Access → Add IP Address → Allow from Anywhere
- [ ] Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
- [ ] **Save this somewhere safe!** 📌

### JWT Secret Generation
- [ ] Open terminal in `backend/` folder
- [ ] Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Copy the output (64 characters)
- [ ] **Save this somewhere safe!** 📌

---

## Step 2: Deploy Backend to Render (10 min)

- [ ] Go to [render.com](https://render.com)
- [ ] Sign up / Log in
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Select your repo
- [ ] Configure:
  - [ ] Name: `bar-restaurant-api`
  - [ ] Environment: `Node`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Root Directory: `backend`
  
- [ ] Add Environment Variables (click "Environment"):

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Your generated JWT secret |
| `FRONTEND_URL` | (temp) `http://localhost:5173` |

- [ ] Click "Deploy" and wait 3-5 minutes
- [ ] Note your Render URL: `https://bar-restaurant-api.onrender.com`
- [ ] Test: Open `https://bar-restaurant-api.onrender.com/health` in browser
  - [ ] Should see: `{"status":"ok","env":"production","dbState":1,"dbStateDesc":"connected"}`
  - [ ] If `"dbState":0`, MongoDB connection failed - check MONGODB_URI

---

## Step 3: Deploy Frontend to Vercel (5 min)

- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up / Log in
- [ ] Click "Add New..." → "Project"
- [ ] Import your GitHub repository
- [ ] Configure:
  - [ ] Framework: Select `Vite`
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`

- [ ] **IMPORTANT**: Add Environment Variables before deploying:
  - Key: `VITE_API_URL`
  - Value: `https://bar-restaurant-api.onrender.com/api`

- [ ] Click "Deploy" and wait 2-3 minutes
- [ ] Note your Vercel URL: `https://your-project.vercel.app`

---

## Step 4: Update Render with Frontend URL (3 min)

- [ ] Go back to [render.com](https://render.com)
- [ ] Select your `bar-restaurant-api` service
- [ ] Go to "Environment"
- [ ] Edit `FRONTEND_URL`: Change to your Vercel URL
  - [ ] Old: `http://localhost:5173`
  - [ ] New: `https://your-project.vercel.app`
- [ ] Save and wait for redeploy (~1 min)

---

## Final Testing ✅

### Test 1: Backend Health
```bash
curl https://bar-restaurant-api.onrender.com/health
```
- [ ] Returns 200 with connected status

### Test 2: Frontend Access
- [ ] Open `https://your-project.vercel.app`
- [ ] Should load without errors

### Test 3: Registration
- [ ] Click "Register"
- [ ] Fill in all fields
- [ ] Click "Sign Up"
- [ ] Should create account and log in automatically
- [ ] Should see Dashboard ✅

### Test 4: Login
- [ ] Log out
- [ ] Click "Login"
- [ ] Enter your credentials
- [ ] Should log in successfully
- [ ] Should see Dashboard ✅

### Test 5: Check Backend Logs (If issues)
- [ ] Go to [render.com](https://render.com)
- [ ] Select your service
- [ ] Click "Logs" tab
- [ ] Should see no errors
- [ ] Should see messages like:
  - `✅ MongoDB connected successfully`
  - `✅ Server running on port 5000`

---

## Troubleshooting

### Still Getting 500 Error on Login?

1. **Check MongoDB**
   - [ ] Verify MONGODB_URI is correct
   - [ ] Check MongoDB Atlas Network Access allows connections
   - [ ] View Render logs for "MongoDB connection error"

2. **Check JWT Secret**
   - [ ] Verify JWT_SECRET is not empty
   - [ ] JWT_SECRET should be 32+ characters
   - [ ] View Render logs for "JWT_SECRET" errors

3. **Check CORS**
   - [ ] Verify FRONTEND_URL is correct in Environment
   - [ ] Try from Vercel frontend
   - [ ] Check browser console for CORS errors

4. **View Full Error**
   - [ ] Go to the browser DevTools
   - [ ] Network tab → click failed request
   - [ ] Response tab → see actual error
   - [ ] Check Render logs for matching error

### CORS Error?

**Error in Browser Console**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
1. Check Render `FRONTEND_URL` matches your Vercel URL exactly
2. Check `backend/middleware/cors.js` includes Vercel domains
3. Redeploy Render backend

---

## Deployment Complete! 🎉

Your app is now live:
- **Backend**: `https://bar-restaurant-api.onrender.com`
- **Frontend**: `https://your-project.vercel.app`

### Next Steps
- [ ] Create admin user via registration
- [ ] Test all features work
- [ ] Configure email (optional) - see DEPLOYMENT_GUIDE.md
- [ ] Set up monitoring/alerts on Render
- [ ] Share app URL with team

---

## Quick Reference Links

- 📖 **Detailed Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 📋 **Summary**: [FIXES_SUMMARY.md](./FIXES_SUMMARY.md)
- 🔧 **Backend Setup**: [backend/PRODUCTION_SETUP.md](./backend/PRODUCTION_SETUP.md)
- 🌐 **Render Docs**: https://render.com/docs
- 🌐 **Vercel Docs**: https://vercel.com/docs
- 🌐 **MongoDB Atlas**: https://docs.atlas.mongodb.com

---

## Still Need Help?

1. Check your terminal for errors
2. View Render logs (Logs tab in service)
3. Check browser DevTools Console tab
4. Re-read the Troubleshooting section above
5. Review DEPLOYMENT_GUIDE.md for more details

**You've got this!** 💪
