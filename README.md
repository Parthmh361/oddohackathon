# StockMaster - Inventory Management System

A comprehensive, full-stack Inventory Management System built with React, Express.js, and PostgreSQL. Designed for the Odoo Hiring Hackathon, this system digitizes and streamlines all stock-related operations within a business.

## Features

### Authentication & Security
- JWT-based authentication
- OTP-based password reset
- User roles (Inventory Manager, Warehouse Staff)
- Secure password hashing with bcryptjs

### Core Features
- **Dashboard**: Real-time KPIs and inventory metrics
- **Product Management**: Create and manage products with SKUs, categories, and reorder rules
- **Receipts (Incoming Stock)**: Track supplier shipments and validate stock increases
- **Deliveries (Outgoing Stock)**: Manage customer shipments and validate stock decreases
- **Internal Transfers**: Move stock between warehouses with automatic ledger updates
- **Stock Adjustments**: Fix inventory discrepancies between recorded and physical counts
- **Warehouse Management**: Configure multiple warehouse locations
- **Stock Ledger**: Complete audit trail of all inventory movements

### Dynamic Filters
- By document type (Receipts, Deliveries, Internal Transfers, Adjustments)
- By status (Draft, Waiting, Ready, Done, Canceled)
- By warehouse/location
- By product category
- Smart product search by SKU or name

### Dashboard KPIs
- Total products in stock
- Low stock / Out of stock items
- Pending receipts
- Pending deliveries
- Internal transfers scheduled
- Stock by warehouse

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Node.js** - Runtime

## Project Structure

```
stockmaster/
├── src/                           # Frontend (React)
│   ├── pages/                     # Page components
│   │   ├── AuthPage.tsx          # Login/Signup/Password Reset
│   │   ├── Dashboard.tsx         # Dashboard with KPIs
│   │   ├── Products.tsx          # Product management
│   │   ├── Receipts.tsx          # Incoming stock
│   │   ├── Deliveries.tsx        # Outgoing stock
│   │   ├── Transfers.tsx         # Internal transfers
│   │   ├── Adjustments.tsx       # Stock adjustments
│   │   ├── Settings.tsx          # Warehouse configuration
│   │   └── Profile.tsx           # User profile
│   ├── components/
│   │   └── Sidebar.tsx           # Navigation sidebar
│   ├── utils/
│   │   └── api.ts                # API client and endpoints
│   ├── App.tsx                   # Main app component with routing
│   └── main.tsx                  # Entry point
│
├── server/                        # Backend (Express)
│   ├── routes/                   # API routes
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── products.js          # Product endpoints
│   │   ├── receipts.js          # Receipt endpoints
│   │   ├── deliveries.js        # Delivery endpoints
│   │   ├── transfers.js         # Transfer endpoints
│   │   ├── adjustments.js       # Adjustment endpoints
│   │   ├── dashboard.js         # Dashboard metrics
│   │   └── warehouse.js         # Warehouse configuration
│   ├── db/
│   │   ├── connection.js        # PostgreSQL connection pool
│   │   └── init.js              # Database schema initialization
│   ├── utils/
│   │   └── auth.js              # JWT and password utilities
│   └── index.js                 # Server entry point
│
├── .env                          # Environment variables
├── package.json                  # Project dependencies
└── vite.config.ts               # Vite configuration
```

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

### 1. Clone/Setup the Project

```bash
cd stockmaster
npm install
```

### 2. Database Setup

PostgreSQL will be automatically initialized when the server first starts. The database schema includes:

- `users` - User accounts and authentication
- `products` - Product catalog
- `categories` - Product categories
- `warehouses` - Warehouse locations
- `stock_levels` - Current inventory levels
- `receipts` & `receipt_items` - Incoming stock
- `deliveries` & `delivery_items` - Outgoing stock
- `transfers` & `transfer_items` - Internal transfers
- `adjustments` & `adjustment_items` - Stock adjustments
- `stock_ledger` - Complete audit trail
- `otp_codes` - OTP for password reset

### 3. Environment Configuration

Update `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/stockmaster
JWT_SECRET=your_jwt_secret_key_change_this_in_production
OTP_EXPIRY_MINUTES=10
API_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
```

## Running the Application

### Development Mode

Terminal 1 - Start the backend server:
```bash
npm run dev:server
```

Terminal 2 - Start the frontend dev server:
```bash
npm run dev
```

Or run both concurrently:
```bash
npm run dev:all
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/request-otp` - Request OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP and reset password
- `GET /api/auth/profile` - Get user profile (requires auth)

### Products
- `GET /api/products` - List all products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product

### Receipts
- `GET /api/receipts` - List receipts with filters
- `GET /api/receipts/:id` - Get receipt details
- `POST /api/receipts` - Create new receipt
- `POST /api/receipts/:id/validate` - Validate and process receipt
- `PUT /api/receipts/:id/items/:itemId` - Update receipt item quantity

### Deliveries
- `GET /api/deliveries` - List deliveries with filters
- `GET /api/deliveries/:id` - Get delivery details
- `POST /api/deliveries` - Create new delivery
- `POST /api/deliveries/:id/validate` - Validate and process delivery
- `PUT /api/deliveries/:id/items/:itemId` - Update delivery item quantity

### Transfers
- `GET /api/transfers` - List internal transfers
- `POST /api/transfers` - Create new transfer
- `POST /api/transfers/:id/validate` - Validate and process transfer

### Adjustments
- `GET /api/adjustments` - List adjustments
- `POST /api/adjustments` - Create new adjustment
- `POST /api/adjustments/:id/validate` - Validate and process adjustment

### Dashboard
- `GET /api/dashboard/kpis` - Get KPI metrics
- `GET /api/dashboard/recent-operations` - Get recent activities
- `GET /api/dashboard/stock-by-warehouse` - Get stock breakdown by warehouse

### Warehouse
- `GET /api/warehouse` - List all warehouses
- `POST /api/warehouse` - Create new warehouse

## Authentication Flow

1. **Sign Up**: User provides email, password, and full name
2. **Login**: User logs in with email and password
3. **JWT Token**: Upon successful login, user receives a JWT token valid for 7 days
4. **Protected Routes**: All API calls require the JWT token in the Authorization header
5. **Password Reset**: User can request OTP via email, verify it, and reset their password

## Inventory Operations Flow

### Receipt (Incoming Stock)
1. Create receipt with supplier info
2. Add products and expected quantities
3. Validate receipt → Stock increases automatically
4. All changes logged in stock ledger

### Delivery (Outgoing Stock)
1. Create delivery with customer info
2. Add products and quantities to deliver
3. Validate delivery → Stock decreases automatically
4. All changes logged in stock ledger

### Internal Transfer
1. Create transfer between warehouses
2. Add products and quantities
3. Validate transfer → Stock moved between warehouses
4. Both source and destination locations updated

### Stock Adjustment
1. Create adjustment for a warehouse
2. Add products with counted vs. expected quantities
3. Validate adjustment → System auto-calculates difference
4. Stock updated to match physical count

## Key Architecture Decisions

### Database Design
- **Modular Schema**: Separate tables for each operation type for scalability
- **Stock Ledger**: Complete audit trail of all inventory movements
- **Normalized Design**: Reduces data redundancy and ensures consistency
- **Indexes**: Optimized for common queries (product, warehouse, status)

### Backend API Design
- **REST Architecture**: Standard CRUD operations with clear endpoints
- **Input Validation**: All inputs validated before processing
- **Transaction Safety**: Critical operations properly handled
- **Error Handling**: Comprehensive error messages for debugging

### Frontend Architecture
- **Component-Based**: Reusable Sidebar and page components
- **State Management**: Local state with API integration
- **Type Safety**: Full TypeScript support
- **Responsive Design**: Works on mobile and desktop

## Security Features

- **Password Hashing**: Bcryptjs with salt rounds for secure storage
- **JWT Authentication**: Stateless, scalable authentication
- **OTP**: Secure password reset mechanism
- **Input Sanitization**: All user inputs validated
- **CORS**: Cross-origin requests configured safely
- **Environment Variables**: Sensitive config kept in .env

## Testing the Application

### Sample Data
To test the system, you can:

1. Create a user account via Sign Up
2. Use OTP feature (OTP will be logged to console in development)
3. Create warehouses in Settings
4. Create products in Products section
5. Create receipts to add stock
6. Create deliveries to remove stock
7. Create transfers between warehouses
8. Create adjustments for inventory counts

### API Testing
Use Postman or curl to test API endpoints:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","fullName":"John Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get KPIs (with token)
curl http://localhost:3000/api/dashboard/kpis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Performance Considerations

- **Database Indexes**: Added on frequently queried columns
- **Connection Pooling**: PostgreSQL connection pool for efficiency
- **Frontend Optimization**: Vite's code splitting and lazy loading
- **Pagination**: Easily implementable in list endpoints

## Future Enhancements

- Real-time notifications for low stock alerts
- Barcode scanning integration
- Advanced reporting and analytics
- Multi-user collaboration features
- Mobile app
- Batch import/export
- Supplier management integration
- Demand forecasting

## License

© 2024 StockMaster. All rights reserved.

## Support

For issues or questions, please refer to the documentation or contact the development team.
