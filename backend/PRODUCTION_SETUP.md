# Backend - Quick Start for Production

## Local Development

```bash
npm install
npm run dev
```

The server runs on `http://localhost:5000`

---

## Production Deployment Issue (SOLVED ✅)

### The Problem
Your login/registration returns **500 error** on Render/Vercel because environment variables are missing.

### The Solution (3 Steps)

#### Step 1: Get MongoDB Connection
- **MongoDB Atlas** (Recommended): Go to [mongodb.com](https://www.mongodb.com/cloud/atlas), create account, create cluster, get the connection string
- Connection format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

#### Step 2: Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy this output - this is your JWT_SECRET

#### Step 3: Configure on Render
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set these environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: The secret you generated above
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `NODE_ENV`: `production`

---

## Environment Variables Required

| Variable | Example | Required |
|----------|---------|----------|
| `MONGODB_URI` | `mongodb+srv://...` | ✅ Yes |
| `JWT_SECRET` | 64-char random string | ✅ Yes |
| `NODE_ENV` | `production` or `development` | ✅ Yes |
| `FRONTEND_URL` | `https://app.vercel.app` | ✅ Yes |
| `PORT` | `5000` | ⚠️ (Default: 5000) |
| `SMTP_*` | Email config | ❌ No (Optional) |

---

## Files Modified for Better Production Support

1. **server.js** - Added environment variable validation
2. **controllers/authController.js** - Better error messages for debugging
3. **utils/jwt.js** - Error handling for missing JWT_SECRET

---

## Testing

### Health Check
```bash
curl https://your-render-api.onrender.com/health
```

### Test Login
```bash
curl -X POST https://your-render-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

---

## Need Help?

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed instructions and troubleshooting.
