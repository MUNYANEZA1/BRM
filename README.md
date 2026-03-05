# Bar/Restaurant Management System

A comprehensive management system for bars and restaurants built with MongoDB, React.js (Vite), and Node.js.

## 🚀 Features

### Core Functionality
- **User Management**: Role-based access control (Admin, Manager, Cashier, Waiter, Stock Manager)
- **Menu Management**: Categories, items, pricing, availability control
- **Order Management**: Order creation, status tracking, payment processing
- **Table Management**: Table status, reservations, order assignment
- **Inventory Management**: Stock tracking, low stock alerts, expiry management
- **Reports & Analytics**: Sales reports, inventory reports, staff performance
- **Settings**: Restaurant configuration, user preferences, system settings

### User Roles & Permissions
- **Admin**: Full system access, user management, system configuration
- **Manager**: Operations oversight, reports, staff management
- **Cashier**: Order processing, payment handling, customer service
- **Waiter**: Order taking, table management, customer service
- **Stock Manager**: Inventory management, stock updates, supplier coordination

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Frontend
- **React.js** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
bar-restaurant-management-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   ├── inventoryController.js
│   │   └── tableController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── cors.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Table.js
│   │   └── InventoryItem.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── inventory.js
│   │   └── tables.js
│   ├── utils/
│   │   └── jwt.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Tables.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── README.md
└── todo.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bar-restaurant-management-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/restaurant_management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Configure Frontend Environment**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start MongoDB**
   Make sure MongoDB is running on your system.

2. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:5000`

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`

---

### 🖥️ Deployment & Production Configuration

> ⚠️ **Having issues?** Experiencing 500 errors on login/registration on Render or Vercel?
> 
> This is likely due to missing environment variables. See [PROBLEM_AND_SOLUTION.md](./PROBLEM_AND_SOLUTION.md) for a quick explanation and [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step deployment instructions.

#### Quick Start Deployment

**For fastest deployment (20-30 minutes):**
1. Read: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) ✅
2. Follow the checklist step by step
3. Deploy backend to Render
4. Deploy frontend to Vercel

#### Detailed Documentation

We've created comprehensive guides for different needs:

- 📋 **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist format (recommended for deployment)
- 📖 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Detailed guide with MongoDB, Render, and Vercel setup
- 🔍 **[PROBLEM_AND_SOLUTION.md](./PROBLEM_AND_SOLUTION.md)** - Explanation of 500 error issues and fixes
- 📋 **[FIXES_SUMMARY.md](./FIXES_SUMMARY.md)** - Summary of all code improvements made
- 🗺️ **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Index of all documentation

#### Required Backend Environment Variables

```text
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
# ^ Must start with mongodb:// or mongodb+srv://
JWT_SECRET=your_super_secret_key_min_32_characters
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Generating a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Backend Deployment (Render)

1. Create Web Service on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set environment variables (listed above)
4. Deploy - backend will be available at `https://your-service-name.onrender.com`

For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

#### Frontend Deployment (Vercel)

1. Import project on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL=https://your-render-backend-url.onrender.com/api`
4. Deploy - frontend will be available at `https://your-project.vercel.app`

#### Troubleshooting

**500 errors on login/register?**
1. Check your Render logs for error messages
2. Verify `MONGODB_URI` is set and correct
3. Verify `JWT_SECRET` is set (must be 32+ characters)
4. Ensure `FRONTEND_URL` is set to your Vercel app URL

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section for more details.

#### ✨ What We Fixed

Recent improvements for production stability:
- ✅ Environment variable validation on startup
- ✅ Better error messages for debugging
- ✅ CORS configuration for production
- ✅ Secure JWT token generation
- ✅ Input validation and error handling
- ✅ MongoDB connection validation

## 👤 Default User Accounts

The system includes demo credentials for testing:

- **Admin**: `admin` / `password123`
- **Manager**: `manager` / `password123`
- **Waiter**: `waiter` / `password123`

## 📱 Key Features Overview

### Dashboard
- Real-time metrics and KPIs
- Recent orders and activities
- Quick action buttons
- System notifications

### Order Management
- Create new orders
- Track order status (Pending → Confirmed → Preparing → Ready → Served)
- Payment processing
- Order history and search

### Menu Management
- Category management
- Menu item CRUD operations
- Pricing and availability control
- Image upload support

### Table Management
- Table status tracking (Available, Occupied, Reserved, Cleaning)
- Order assignment to tables
- Table layout visualization
- Reservation management

### Inventory Management
- Stock level tracking
- Low stock alerts
- Expiry date monitoring
- Stock movement history
- Supplier management

### User Management
- Role-based access control
- User profile management
- Activity tracking
- Permission management

### Reports & Analytics
- Sales reports (daily, weekly, monthly)
- Inventory reports
- Staff performance metrics
- Financial summaries
- Export functionality

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/toggle-status` - Toggle user status

### Menu
- `GET /api/menu/categories` - Get categories
- `POST /api/menu/categories` - Create category
- `GET /api/menu/items` - Get menu items
- `POST /api/menu/items` - Create menu item
- `PUT /api/menu/items/:id` - Update menu item
- `DELETE /api/menu/items/:id` - Delete menu item

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/payment` - Process payment

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create new table
- `PUT /api/tables/:id` - Update table
- `PATCH /api/tables/:id/status` - Update table status

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `PATCH /api/inventory/:id/stock` - Update stock level
- `GET /api/inventory/low-stock` - Get low stock items

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Database Schema

### Users Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  role: String (enum),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Menu Items Collection
```javascript
{
  name: String,
  description: String,
  category: ObjectId (ref: Category),
  price: Number,
  image: String,
  isAvailable: Boolean,
  preparationTime: Number,
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  orderNumber: String (unique),
  table: ObjectId (ref: Table),
  customer: Object,
  items: [OrderItem],
  status: String (enum),
  totalAmount: Number,
  taxAmount: Number,
  discountAmount: Number,
  paymentStatus: String (enum),
  paymentMethod: String,
  notes: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Production Build

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Environment Configuration**
   Update environment variables for production:
   - Set `NODE_ENV=production`
   - Configure production MongoDB URI
   - Set secure JWT secret
   - Configure CORS for production domains

3. **Deploy Backend**
   - Use PM2 for process management
   - Configure reverse proxy (Nginx)
   - Set up SSL certificates
   - Configure monitoring and logging

4. **Deploy Frontend**
   - Serve built files with web server
   - Configure routing for SPA
   - Set up CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User management and authentication
  - Menu and order management
  - Table and inventory management
  - Basic reporting and analytics
  - Responsive web interface

## 🎯 Future Enhancements

- Mobile application (React Native)
- Real-time notifications (WebSocket)
- Advanced analytics and reporting
- Integration with payment gateways
- Multi-location support
- Kitchen display system
- Customer loyalty program
- Online ordering system
- Delivery management
- Advanced inventory forecasting

---

**Built with ❤️ for the restaurant industry**

