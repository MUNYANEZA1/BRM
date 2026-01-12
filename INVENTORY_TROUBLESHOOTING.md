# Real-Time Inventory Data Display - Troubleshooting Guide

## Issue: Inventory Not Displaying Data in Real-Time

### Root Causes & Solutions

#### 1. **Backend Not Connected or MongoDB Down**
Check if the backend server is running and MongoDB is accessible.

```powershell
# Start MongoDB (if running locally)
mongod

# In another terminal, start the backend server
cd backend
npm run dev
```

Check the logs:
- Look for "MongoDB Connected" message
- Check for connection errors

---

#### 2. **API URL Configuration**
Ensure the frontend is pointing to the correct backend URL.

**File:** `frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
```

If using a different port or IP, update accordingly.

---

#### 3. **Database is Empty**
The inventory table might be empty. Test by:

```powershell
# Run the test script
.\test-api.ps1
```

Or manually add items using the API:
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "sku": "TEST001",
    "category": "food",
    "unit": "kg",
    "currentStock": 10,
    "minimumStock": 5,
    "maximumStock": 50,
    "unitCost": 1000
  }'
```

---

#### 4. **Authentication Issues**
The inventory endpoint requires authentication. Verify:

1. User is logged in (check browser localStorage for `token`)
2. Token is valid and not expired
3. User has proper role permissions (stock_manager, manager, or admin)

**Check in browser console:**
```javascript
console.log(localStorage.getItem('token'));
console.log(localStorage.getItem('user'));
```

---

#### 5. **CORS Issues**
If you see CORS errors in browser console:

**File:** `backend/server.js` - CORS configuration is already set to allow development

Make sure:
- Backend is on `http://localhost:5000`
- Frontend is on `http://localhost:5173` (Vite default)
- Both use `localhost` (not `127.0.0.1`)

---

### How the Real-Time Updates Work Now

1. **Auto-Refresh Every 10 Seconds**
   - Data refetches automatically every 10 seconds
   - No manual refresh needed

2. **Window Focus Detection**
   - When you switch back to the browser tab, data refetches
   - Ensures always up-to-date data

3. **Manual Refresh Button**
   - Click the "Refresh" button to force an immediate update

4. **Add Item Mutation**
   - When adding a new item, the cache is invalidated
   - Data automatically refetches from the database

5. **Loading States**
   - Loading spinner shows while fetching
   - Error state shows if something goes wrong

---

### Debug Information

**Enabled in Development Mode:**
- Console logs showing item count loaded
- Debug panel showing API URL and items count
- Error messages with server response details

**To Enable More Logging:**

Open browser DevTools (F12) and run:
```javascript
localStorage.setItem('DEBUG_INVENTORY', 'true');
```

---

### Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch inventory items" | Backend not running | Start: `npm run dev` in backend folder |
| "Error loading inventory: 401" | Not authenticated | Log in first |
| "Error loading inventory: 403" | Insufficient permissions | Ensure user is admin/manager/stock_manager |
| 0 items loaded | Database is empty | Add items via API or inventory form |
| "CORS error" | Backend/Frontend URL mismatch | Check .env files and ensure localhost consistency |

---

### Step-by-Step Testing

1. **Start Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Open Application:**
   - Go to `http://localhost:5173`

4. **Login:**
   - Create account or use existing credentials

5. **Navigate to Inventory:**
   - Items should load automatically
   - Check browser console (F12) for debug messages

6. **Verify Real-Time Updates:**
   - Click "Refresh" button
   - Add a new item
   - Data should update automatically

---

### Browser Console Debugging

Open DevTools (F12) and check:

1. **Network Tab:**
   - Check if `/api/inventory` requests are succeeding (200 status)
   - Look at response payload

2. **Console Tab:**
   - Look for "Inventory data fetched: [...]"
   - Check for any error messages
   - Verify auth token is present

3. **Application Tab:**
   - Check localStorage has `token` and `user` keys

---

### MongoDB Verification

To check if data exists in MongoDB:

```powershell
# Open MongoDB shell
mongosh

# Select database
use bar_restaurant_db

# Check inventory items
db.inventoryitems.find()

# Count items
db.inventoryitems.countDocuments()

# Insert test item if none exist
db.inventoryitems.insertOne({
  name: "Test Item",
  sku: "TEST001",
  category: "food",
  unit: "kg",
  currentStock: 10,
  minimumStock: 5,
  maximumStock: 50,
  unitCost: 1000,
  isActive: true,
  createdAt: new Date()
})
```

---

### Performance Optimization (Optional)

If you want to reduce the refresh interval (more real-time but more API calls):

**File:** `frontend/src/pages/Inventory.jsx`

```javascript
refetchInterval: 5000, // 5 seconds instead of 10
```

Or to disable auto-refresh:
```javascript
refetchInterval: false, // Only manual refresh
```

---

### Still Having Issues?

1. Check browser console (F12) for errors
2. Check backend console for API errors
3. Verify MongoDB is running: `mongosh` should connect
4. Test API directly: `curl http://localhost:5000/api/inventory`
5. Check network requests in browser DevTools
6. Verify `.env` files have correct URLs

**For debugging, run:**
```powershell
.\test-api.ps1
```

This will verify:
- API is running
- Authentication works
- Inventory endpoint responds
- Data is being returned
