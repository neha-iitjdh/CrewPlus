# CrewPlus Full-Stack Development Curriculum

A comprehensive 12-module curriculum for learning full-stack development by rebuilding the CrewPlus Pizza Ordering Platform from scratch.

## Project Overview

**CrewPlus** is a full-featured pizza ordering platform with:
- User authentication and authorization
- Product catalog with categories
- Shopping cart (guest + authenticated)
- Order management with status tracking
- Coupon/discount system
- Product customizations
- Admin dashboard with analytics
- AI-powered recommendations
- Real-time group ordering with Socket.io

**Tech Stack:**
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.io
- **Frontend:** React, React Router, Axios, Recharts
- **Authentication:** JWT, bcryptjs
- **Testing:** Jest, Supertest

---

## Module 1: Project Setup & Tooling

### Learning Objectives
- Understand monorepo project structure
- Set up a Node.js/Express backend
- Set up a React frontend with Create React App
- Configure development tools (ESLint, Prettier)
- Manage environment variables securely

### Concepts Covered
- Monorepo vs polyrepo architecture
- npm/yarn workspace basics
- Environment variable management
- Express.js application structure
- Create React App configuration

### Files to Create

```
CrewPlus/
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   └── config/
│   │       └── constants.js
│   └── .env
├── client/
│   ├── package.json
│   └── src/
│       └── services/
│           └── api.js
└── .gitignore
```

### Key Code Snippets

**server/package.json:**
```json
{
  "name": "crewplus-server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^8.0.3",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

**server/src/app.js:**
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CrewPlus Pizza Ordering API',
    version: '1.0.0'
  });
});

module.exports = app;
```

**server/src/config/constants.js:**
```javascript
module.exports = {
  ROLES: {
    GUEST: 'guest',
    CUSTOMER: 'customer',
    ADMIN: 'admin'
  },
  CATEGORIES: {
    PIZZA: 'pizza',
    DRINK: 'drink',
    BREAD: 'bread'
  },
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  ORDER_TYPES: {
    DELIVERY: 'delivery',
    CARRYOUT: 'carryout'
  },
  SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    EXTRA_LARGE: 'extra_large'
  }
};
```

### Exercises

1. **Initialize the project:** Create both `server` and `client` folders with their respective `package.json` files.

2. **Configure ESLint:** Add ESLint configuration to both projects with appropriate rules for Node.js and React.

3. **Set up environment variables:** Create `.env` files for both server and client. Add them to `.gitignore`.

4. **Create a basic Express server:** Set up an Express app that responds to a health check endpoint.

5. **Create React App:** Initialize the client with Create React App and configure the proxy in `package.json`.

---

## Module 2: Database & Models

### Learning Objectives
- Connect to MongoDB using Mongoose
- Design and implement data models
- Use Mongoose schemas, validations, methods, and virtuals
- Understand indexing for query optimization

### Concepts Covered
- MongoDB document databases
- Mongoose ODM (Object Document Mapper)
- Schema design patterns
- Validation rules
- Instance methods vs static methods
- Virtual properties
- Pre/post middleware hooks
- Indexing strategies

### Files to Create

```
server/src/
├── config/
│   └── db.js
└── models/
    ├── User.js
    └── Product.js
```

### Key Code Snippets

**server/src/config/db.js:**
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**server/src/models/User.js:**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.CUSTOMER
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// Pre-save middleware: Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Instance method: Return public profile
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
```

**server/src/models/Product.js:**
```javascript
const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: Object.values(CATEGORIES),
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  inventory: {
    type: Number,
    required: [true, 'Inventory is required'],
    min: [0, 'Inventory cannot be negative'],
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual: Check if in stock
productSchema.virtual('inStock').get(function() {
  return this.inventory > 0 && this.isAvailable;
});

// Method: Check if enough inventory
productSchema.methods.hasStock = function(quantity) {
  return this.inventory >= quantity;
};

// Method: Deduct inventory
productSchema.methods.deductInventory = async function(quantity) {
  if (!this.hasStock(quantity)) {
    throw new Error(`Insufficient inventory for ${this.name}`);
  }
  this.inventory -= quantity;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
```

### Exercises

1. **Connect to MongoDB:** Set up MongoDB locally or use MongoDB Atlas. Test the connection.

2. **Create the User model:** Implement all validations and methods shown above.

3. **Create the Product model:** Add the virtual property `inStock` and test it.

4. **Test password hashing:** Create a user and verify the password is hashed in the database.

5. **Explore indexes:** Use MongoDB Compass to view created indexes and understand their purpose.

---

## Module 3: Authentication

### Learning Objectives
- Understand JWT-based authentication
- Implement secure user registration and login
- Create authentication middleware
- Build frontend authentication context

### Concepts Covered
- JSON Web Tokens (JWT) structure and flow
- Password hashing with bcrypt
- Bearer token authentication
- Middleware patterns in Express
- React Context API for global state
- Protected routes in React

### Files to Create

```
server/src/
├── middleware/
│   └── auth.js
├── controllers/
│   └── authController.js
├── routes/
│   └── authRoutes.js
└── utils/
    ├── ApiError.js
    ├── ApiResponse.js
    └── asyncHandler.js

client/src/
├── context/
│   └── AuthContext.js
└── pages/
    ├── Login.js
    └── Register.js
```

### Key Code Snippets

**server/src/utils/ApiError.js:**
```javascript
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
}

module.exports = ApiError;
```

**server/src/utils/asyncHandler.js:**
```javascript
// Wraps async functions to handle errors automatically
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

**server/src/middleware/auth.js:**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      throw ApiError.unauthorized('User not found');
    }

    next();
  } catch (error) {
    throw ApiError.unauthorized('Not authorized, token failed');
  }
});

// Optional auth - attach user if token exists
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      req.user = null;
    }
  }

  next();
});

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized`
      );
    }

    next();
  };
};

const isAdmin = authorize(ROLES.ADMIN);

module.exports = { protect, optionalAuth, authorize, isAdmin };
```

**server/src/controllers/authController.js:**
```javascript
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Register a new user
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest('User with this email already exists');
  }

  const user = await User.create({ name, email, password });
  const token = user.generateToken();

  ApiResponse.created({
    user: user.toPublicJSON(),
    token
  }, 'Registration successful').send(res);
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = user.generateToken();

  ApiResponse.success({
    user: user.toPublicJSON(),
    token
  }, 'Login successful').send(res);
});

// Get current user
const getMe = asyncHandler(async (req, res) => {
  ApiResponse.success({
    user: req.user.toPublicJSON()
  }).send(res);
});

module.exports = { register, login, getMe };
```

**server/src/routes/authRoutes.js:**
```javascript
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
```

### Exercises

1. **Implement JWT authentication:** Create the complete auth flow from registration to protected routes.

2. **Test with Postman:** Create requests for register, login, and getMe endpoints.

3. **Build AuthContext:** Create a React context that manages user state and token storage.

4. **Create Login/Register pages:** Build forms that communicate with the auth API.

5. **Implement route protection:** Create a PrivateRoute component that redirects unauthenticated users.

---

## Module 4: Product Management

### Learning Objectives
- Build RESTful CRUD APIs
- Implement filtering, searching, and pagination
- Create reusable React components
- Display data with proper loading states

### Concepts Covered
- REST API design principles
- Query string parameters for filtering
- MongoDB text search
- Pagination patterns
- React component composition
- Conditional rendering

### Files to Create

```
server/src/
├── controllers/
│   └── productController.js
└── routes/
    └── productRoutes.js

client/src/
├── pages/
│   └── Menu.js
└── components/
    └── ProductCard.js
```

### Key Code Snippets

**server/src/controllers/productController.js:**
```javascript
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Get all products with filtering
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, isVegetarian, page = 1, limit = 20 } = req.query;

  const query = { isAvailable: true };

  if (category) query.category = category;
  if (isVegetarian === 'true') query.isVegetarian = true;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(query)
  ]);

  ApiResponse.success({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }).send(res);
});

// Get menu grouped by category
const getMenu = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isAvailable: true,
    inventory: { $gt: 0 }
  }).sort({ name: 1 });

  const menu = {
    pizzas: products.filter(p => p.category === 'pizza'),
    drinks: products.filter(p => p.category === 'drink'),
    breads: products.filter(p => p.category === 'bread')
  };

  ApiResponse.success({ menu }).send(res);
});

// Create product (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  ApiResponse.created({ product }, 'Product created').send(res);
});

// Update product (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  ApiResponse.success({ product }, 'Product updated').send(res);
});

// Delete product (Admin) - soft delete
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  product.isAvailable = false;
  await product.save();

  ApiResponse.success(null, 'Product deleted').send(res);
});

module.exports = {
  getProducts,
  getMenu,
  createProduct,
  updateProduct,
  deleteProduct
};
```

**server/src/routes/productRoutes.js:**
```javascript
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getMenu,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/menu', getMenu);

// Admin routes
router.post('/', protect, isAdmin, createProduct);
router.put('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);

module.exports = router;
```

### Exercises

1. **Build the Products API:** Implement all CRUD operations with proper validation.

2. **Add filtering and search:** Test filtering by category and text search.

3. **Implement pagination:** Add page and limit parameters with proper response format.

4. **Create ProductCard component:** Build a reusable card component displaying product info.

5. **Build Menu page:** Fetch and display products grouped by category with loading states.

---

## Module 5: Shopping Cart

### Learning Objectives
- Implement session-based carts for guests
- Build user-associated carts for authenticated users
- Create cart merging logic on login
- Manage complex state in React

### Concepts Covered
- Session management strategies
- Subdocument arrays in MongoDB
- Cart calculation middleware
- React Context for cart state
- Optimistic UI updates

### Files to Create

```
server/src/
├── models/
│   └── Cart.js
├── controllers/
│   └── cartController.js
└── routes/
    └── cartRoutes.js

client/src/
├── context/
│   └── CartContext.js
└── pages/
    └── Cart.js
```

### Key Code Snippets

**server/src/models/Cart.js:**
```javascript
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large'],
    default: 'medium'
  },
  price: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: function() {
      return !this.user;  // Required if no user
    }
  },
  items: [cartItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

// Pre-save: Calculate totals
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  this.tax = Math.round(this.subtotal * 0.10 * 100) / 100;
  this.total = Math.round((this.subtotal + this.tax) * 100) / 100;

  next();
});

// Method: Add item
cartSchema.methods.addItem = async function(productId, quantity, size, price, notes) {
  const existingItem = this.items.find(item =>
    item.product.toString() === productId.toString() &&
    item.size === size
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, size, price, notes });
  }

  return this.save();
};

// Method: Update item quantity
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) throw new Error('Item not found in cart');

  if (quantity <= 0) {
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  return this.save();
};

// Method: Remove item
cartSchema.methods.removeItem = async function(itemId) {
  this.items.pull(itemId);
  return this.save();
};

// Method: Clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
```

**server/src/controllers/cartController.js:**
```javascript
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper: Get or create cart
const getOrCreateCart = async (userId, sessionId) => {
  let cart;

  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate('items.product');
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId }).populate('items.product');
  }

  if (!cart) {
    cart = new Cart({
      user: userId || undefined,
      sessionId: userId ? undefined : sessionId,
      items: []
    });
    await cart.save();
  }

  return cart;
};

// Get cart
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw ApiError.badRequest('Session ID required for guest cart');
  }

  const cart = await getOrCreateCart(userId, sessionId);
  ApiResponse.success({ cart }).send(res);
});

// Add to cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, size = 'medium', notes } = req.body;
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw ApiError.badRequest('Session ID required for guest cart');
  }

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (!product.isAvailable) throw ApiError.badRequest('Product not available');
  if (!product.hasStock(quantity)) {
    throw ApiError.badRequest(`Only ${product.inventory} items in stock`);
  }

  let cart = await getOrCreateCart(userId, sessionId);

  // Get price based on size
  let price = product.price;
  if (product.prices && product.prices[size]) {
    price = product.prices[size];
  }

  await cart.addItem(productId, quantity, size, price, notes);
  cart = await Cart.findById(cart._id).populate('items.product');

  ApiResponse.success({ cart }, 'Item added to cart').send(res);
});

// Merge guest cart with user cart
const mergeCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user._id;

  const guestCart = await Cart.findOne({ sessionId }).populate('items.product');

  if (!guestCart || guestCart.items.length === 0) {
    let userCart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!userCart) {
      userCart = await Cart.create({ user: userId, items: [] });
    }
    return ApiResponse.success({ cart: userCart }).send(res);
  }

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    userCart = await Cart.create({ user: userId, items: [] });
  }

  // Merge items
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      item => item.product.toString() === guestItem.product._id.toString() &&
              item.size === guestItem.size
    );

    if (existingItem) {
      existingItem.quantity += guestItem.quantity;
    } else {
      userCart.items.push({
        product: guestItem.product._id,
        quantity: guestItem.quantity,
        size: guestItem.size,
        price: guestItem.price,
        notes: guestItem.notes
      });
    }
  }

  await userCart.save();
  await Cart.findByIdAndDelete(guestCart._id);

  userCart = await Cart.findById(userCart._id).populate('items.product');
  ApiResponse.success({ cart: userCart }, 'Cart merged').send(res);
});

module.exports = { getCart, addToCart, mergeCart };
```

### Exercises

1. **Create the Cart model:** Implement subdocument arrays and calculation middleware.

2. **Build cart API endpoints:** Add, update, remove items and clear cart.

3. **Implement session-based carts:** Generate session IDs on the frontend and send with requests.

4. **Create CartContext:** Manage cart state globally with Context API.

5. **Build cart merge flow:** Test merging guest cart to user cart on login.

---

## Module 6: Checkout & Orders

### Learning Objectives
- Design order lifecycle and status flow
- Implement inventory deduction
- Build a multi-step checkout process
- Add email notifications

### Concepts Covered
- Order state machine patterns
- Database transactions (conceptual)
- Inventory management
- Email service integration
- Order tracking

### Files to Create

```
server/src/
├── models/
│   └── Order.js
├── controllers/
│   └── orderController.js
├── routes/
│   └── orderRoutes.js
└── services/
    └── emailService.js

client/src/
└── pages/
    ├── Checkout.js
    └── OrderTracking.js
```

### Key Code Snippets

**server/src/models/Order.js:**
```javascript
const mongoose = require('mongoose');
const { ORDER_STATUS, ORDER_TYPES } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: 'medium' },
  price: { type: Number, required: true },
  notes: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: String,
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  type: {
    type: String,
    enum: Object.values(ORDER_TYPES),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
    default: 'cash'
  },
  estimatedDelivery: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static: Get analytics
orderSchema.statics.getAnalytics = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
```

**server/src/controllers/orderController.js (partial):**
```javascript
const createOrder = asyncHandler(async (req, res) => {
  const { type, customerInfo, deliveryAddress, paymentMethod } = req.body;
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'];

  // Find cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate('items.product');
  } else {
    cart = await Cart.findOne({ sessionId }).populate('items.product');
  }

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  // Validate inventory
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);
    if (!product.hasStock(item.quantity)) {
      throw ApiError.badRequest(
        `Insufficient stock for ${item.product.name}`
      );
    }
  }

  const deliveryFee = type === 'delivery' ? 50 : 0;

  // Create order items
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    size: item.size,
    price: item.price,
    notes: item.notes
  }));

  // Create order
  const order = await Order.create({
    user: userId,
    sessionId: userId ? undefined : sessionId,
    items: orderItems,
    subtotal: cart.subtotal,
    tax: cart.tax,
    deliveryFee,
    total: cart.total + deliveryFee,
    type,
    customerInfo,
    deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
    paymentMethod,
    estimatedDelivery: new Date(Date.now() + (type === 'delivery' ? 45 : 20) * 60000)
  });

  // Deduct inventory
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { inventory: -item.quantity }
    });
  }

  // Clear cart
  await cart.clearCart();

  // Send email notification (async)
  sendOrderConfirmationEmail(order).catch(console.error);

  ApiResponse.created({ order }, 'Order placed').send(res);
});
```

### Exercises

1. **Create the Order model:** Implement order number generation and status tracking.

2. **Build createOrder:** Handle cart validation, inventory deduction, and order creation.

3. **Implement status updates:** Create updateOrderStatus with valid state transitions.

4. **Add email notifications:** Set up nodemailer and send confirmation emails.

5. **Build Checkout page:** Create a multi-step form for checkout.

---

## Module 7: Coupons & Discounts

### Learning Objectives
- Design a flexible coupon system
- Implement coupon validation logic
- Apply discounts during checkout

### Concepts Covered
- Coupon types (percentage vs fixed)
- Usage limits and tracking
- Validation rules
- Date-based validity

### Files to Create

```
server/src/
├── models/
│   └── Coupon.js
├── controllers/
│   └── couponController.js
└── routes/
    └── couponRoutes.js
```

### Key Code Snippets

**server/src/models/Coupon.js:**
```javascript
const mongoose = require('mongoose');
const { COUPON_TYPES } = require('../config/constants');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(COUPON_TYPES),
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Value cannot be negative']
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
  }],
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual: Check if valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive &&
         now >= this.validFrom &&
         now <= this.validUntil &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Method: Check if user can use
couponSchema.methods.canBeUsedBy = function(userId) {
  if (!this.isValid) return false;

  if (userId) {
    const userUsages = this.usedBy.filter(
      u => u.user.toString() === userId.toString()
    );
    if (userUsages.length >= this.userUsageLimit) {
      return false;
    }
  }

  return true;
};

// Method: Calculate discount
couponSchema.methods.calculateDiscount = function(subtotal) {
  if (subtotal < this.minOrderAmount) return 0;

  let discount = 0;

  if (this.type === COUPON_TYPES.PERCENTAGE) {
    discount = (subtotal * this.value) / 100;
  } else {
    discount = this.value;
  }

  // Apply max discount cap
  if (this.maxDiscount !== null && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  // Ensure discount doesn't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return Math.round(discount * 100) / 100;
};

// Method: Mark as used
couponSchema.methods.markAsUsed = async function(userId, orderId) {
  this.usedCount += 1;
  this.usedBy.push({
    user: userId,
    orderId: orderId,
    usedAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('Coupon', couponSchema);
```

### Exercises

1. **Create the Coupon model:** Implement percentage and fixed discount types.

2. **Build coupon validation:** Check all rules (dates, limits, minimum order).

3. **Create validate endpoint:** Return discount amount for a given coupon and subtotal.

4. **Integrate with checkout:** Apply coupon discount during order creation.

5. **Build admin coupon management:** CRUD operations for coupons.

---

## Module 8: Customizations

### Learning Objectives
- Add product customizations (toppings, crusts, etc.)
- Calculate customization totals
- Display customization options in UI

### Concepts Covered
- Many-to-many relationships
- Subdocument references
- Dynamic pricing
- Modal components

### Files to Create

```
server/src/
├── models/
│   └── Customization.js
├── controllers/
│   └── customizationController.js
└── routes/
    └── customizationRoutes.js

client/src/
└── components/
    └── CustomizationModal.js
```

### Key Code Snippets

**server/src/models/Customization.js:**
```javascript
const mongoose = require('mongoose');
const { CUSTOMIZATION_TYPES } = require('../config/constants');

const customizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customization name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(CUSTOMIZATION_TYPES),
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  isVegetarian: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: String,
    enum: ['pizza', 'drink', 'bread']
  }]
}, {
  timestamps: true
});

customizationSchema.index({ type: 1, isAvailable: 1 });

module.exports = mongoose.model('Customization', customizationSchema);
```

**Adding customizations to Cart model:**
```javascript
const customizationItemSchema = new mongoose.Schema({
  customization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customization',
    required: true
  },
  name: String,
  price: Number
});

const cartItemSchema = new mongoose.Schema({
  // ... existing fields
  customizations: [customizationItemSchema],
  customizationTotal: {
    type: Number,
    default: 0
  }
});

// Update pre-save to include customization totals
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => {
    const itemTotal = (item.price + (item.customizationTotal || 0)) * item.quantity;
    return sum + itemTotal;
  }, 0);
  // ... rest of calculation
});
```

### Exercises

1. **Create Customization model:** Define types (crust, sauce, cheese, topping).

2. **Update Cart model:** Add customizations array to cart items.

3. **Build customization API:** CRUD endpoints with filtering by type.

4. **Create CustomizationModal:** Display options grouped by type with checkboxes.

5. **Update addToCart:** Include selected customizations and calculate total.

---

## Module 9: Admin Dashboard

### Learning Objectives
- Implement role-based access control
- Build admin-only pages
- Create data visualizations with Recharts

### Concepts Covered
- Authorization middleware
- Protected admin routes
- Analytics aggregation
- Chart components (BarChart, LineChart, PieChart)

### Files to Create

```
server/src/
└── routes/
    └── adminRoutes.js (integrated into existing routes)

client/src/
└── pages/
    └── admin/
        ├── Dashboard.js
        ├── ManageProducts.js
        ├── ManageOrders.js
        └── ManageCoupons.js
```

### Key Code Snippets

**Order Analytics (server/src/models/Order.js):**
```javascript
orderSchema.statics.getAnalytics = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const analytics = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        deliveryOrders: {
          $sum: { $cond: [{ $eq: ['$type', 'delivery'] }, 1, 0] }
        },
        carryoutOrders: {
          $sum: { $cond: [{ $eq: ['$type', 'carryout'] }, 1, 0] }
        }
      }
    }
  ]);

  const dailyRevenue = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return { summary: analytics[0], dailyRevenue };
};

orderSchema.statics.getPopularItems = async function(limit = 10) {
  return this.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ]);
};
```

**Dashboard Component (client):**
```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const response = await ordersAPI.getAnalytics();
      setAnalytics(response.data);
    };
    fetchAnalytics();
  }, []);

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{analytics?.summary?.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${analytics?.summary?.totalRevenue?.toFixed(2)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={analytics?.dailyRevenue}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="_id" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Exercises

1. **Create admin middleware:** Verify user role is 'admin' before allowing access.

2. **Build analytics endpoint:** Aggregate order data for dashboard stats.

3. **Create Dashboard page:** Display summary cards and revenue chart.

4. **Build ManageProducts:** CRUD interface for products with inventory management.

5. **Build ManageOrders:** List orders with status update functionality.

---

## Module 10: AI Recommendations

### Learning Objectives
- Track user preferences based on behavior
- Build a recommendation algorithm
- Display personalized suggestions

### Concepts Covered
- User preference modeling
- Scoring algorithms
- Time-based recommendations
- Collaborative filtering (basic)

### Files to Create

```
server/src/
├── models/
│   └── UserPreference.js
├── services/
│   └── recommendationService.js
├── controllers/
│   └── recommendationController.js
└── routes/
    └── recommendationRoutes.js

client/src/
└── components/
    └── Recommendations.js
```

### Key Code Snippets

**server/src/models/UserPreference.js:**
```javascript
const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  favoriteProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    orderCount: { type: Number, default: 0 },
    lastOrdered: Date
  }],
  preferredSizes: {
    small: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    large: { type: Number, default: 0 },
    extra_large: { type: Number, default: 0 }
  },
  dietaryPreferences: {
    vegetarian: { type: Boolean, default: false },
    spicy: { type: Boolean, default: false }
  },
  orderPatterns: {
    weekdayOrders: { type: Number, default: 0 },
    weekendOrders: { type: Number, default: 0 },
    lunchOrders: { type: Number, default: 0 },
    dinnerOrders: { type: Number, default: 0 }
  },
  averageOrderValue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Update preferences from order
userPreferenceSchema.methods.updateFromOrder = async function(order) {
  const orderDate = new Date(order.createdAt || Date.now());
  const hour = orderDate.getHours();
  const dayOfWeek = orderDate.getDay();

  // Update timing patterns
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    this.orderPatterns.weekendOrders++;
  } else {
    this.orderPatterns.weekdayOrders++;
  }

  if (hour >= 11 && hour < 14) {
    this.orderPatterns.lunchOrders++;
  } else if (hour >= 17 && hour < 21) {
    this.orderPatterns.dinnerOrders++;
  }

  // Update average order value
  this.totalOrders++;
  const currentTotal = this.averageOrderValue * (this.totalOrders - 1);
  this.averageOrderValue = (currentTotal + order.total) / this.totalOrders;

  // Update favorite products
  for (const item of order.items) {
    const productIndex = this.favoriteProducts.findIndex(
      fp => fp.product?.toString() === item.product.toString()
    );

    if (productIndex >= 0) {
      this.favoriteProducts[productIndex].orderCount += item.quantity;
      this.favoriteProducts[productIndex].lastOrdered = orderDate;
    } else {
      this.favoriteProducts.push({
        product: item.product,
        orderCount: item.quantity,
        lastOrdered: orderDate
      });
    }

    // Update size preferences
    if (item.size && this.preferredSizes[item.size] !== undefined) {
      this.preferredSizes[item.size] += item.quantity;
    }
  }

  // Sort and limit favorites
  this.favoriteProducts.sort((a, b) => b.orderCount - a.orderCount);
  if (this.favoriteProducts.length > 20) {
    this.favoriteProducts = this.favoriteProducts.slice(0, 20);
  }

  return this.save();
};

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
```

**server/src/services/recommendationService.js:**
```javascript
class RecommendationService {
  async getRecommendations(userId, limit = 6) {
    let preferences = await UserPreference.findOne({ user: userId })
      .populate('favoriteProducts.product');

    if (!preferences) {
      preferences = await UserPreference.create({ user: userId });
    }

    const allProducts = await Product.find({ isAvailable: true });
    const scoredProducts = await this.scoreProducts(allProducts, preferences);

    scoredProducts.sort((a, b) => b.score - a.score);
    return scoredProducts.slice(0, limit);
  }

  async scoreProducts(products, preferences) {
    const now = new Date();
    const hour = now.getHours();
    const isDinner = hour >= 17 && hour < 21;

    const favoriteProductIds = new Set(
      preferences.favoriteProducts
        .filter(fp => fp.product)
        .map(fp => fp.product._id.toString())
    );

    return products.map(product => {
      let score = 0;
      const reasons = [];

      // Boost favorites
      if (favoriteProductIds.has(product._id.toString())) {
        score += 30;
        reasons.push('Based on your previous orders');
      }

      // Time-based recommendations
      if (isDinner && product.category === 'pizza') {
        score += 10;
        reasons.push('Dinner favorite');
      }

      // Dietary preferences
      if (preferences.dietaryPreferences?.vegetarian && product.isVegetarian) {
        score += 25;
        reasons.push('Vegetarian friendly');
      }

      // Novelty boost
      if (!favoriteProductIds.has(product._id.toString())) {
        score += 5;
        if (reasons.length === 0) {
          reasons.push('Try something new!');
        }
      }

      return {
        product,
        score,
        reason: reasons[0] || 'Recommended for you'
      };
    });
  }

  async updatePreferencesFromOrder(userId, order) {
    let preferences = await UserPreference.findOne({ user: userId });
    if (!preferences) {
      preferences = await UserPreference.create({ user: userId });
    }
    await preferences.updateFromOrder(order);
    return preferences;
  }
}

module.exports = new RecommendationService();
```

### Exercises

1. **Create UserPreference model:** Track user behavior and preferences.

2. **Build scoring algorithm:** Score products based on user history.

3. **Update preferences on order:** Call updatePreferencesFromOrder in createOrder.

4. **Create recommendations API:** Return personalized product suggestions.

5. **Build Recommendations component:** Display suggestions on home page.

---

## Module 11: Group Orders with Real-time

### Learning Objectives
- Implement real-time features with Socket.io
- Build collaborative group ordering
- Handle concurrent updates

### Concepts Covered
- WebSocket fundamentals
- Socket.io rooms and events
- Real-time state synchronization
- Optimistic updates

### Files to Create

```
server/src/
├── socket/
│   └── index.js
├── models/
│   └── GroupOrder.js
├── controllers/
│   └── groupOrderController.js
└── routes/
    └── groupOrderRoutes.js

client/src/
├── services/
│   └── socket.js
└── pages/
    ├── CreateGroupOrder.js
    └── JoinGroupOrder.js
```

### Key Code Snippets

**server/src/socket/index.js:**
```javascript
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      } catch (err) {
        // Continue as guest
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join group room
    socket.on('join-group', (groupCode) => {
      const room = `group:${groupCode.toUpperCase()}`;
      socket.join(room);

      socket.to(room).emit('participant-joined', {
        socketId: socket.id,
        userId: socket.userId
      });
    });

    // Leave group room
    socket.on('leave-group', (groupCode) => {
      const room = `group:${groupCode.toUpperCase()}`;
      socket.leave(room);

      socket.to(room).emit('participant-left', {
        socketId: socket.id
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit to group
const emitToGroup = (groupCode, event, data) => {
  if (io) {
    const room = `group:${groupCode.toUpperCase()}`;
    io.to(room).emit(event, data);
  }
};

module.exports = { initializeSocket, emitToGroup };
```

**server/src/models/GroupOrder.js:**
```javascript
const mongoose = require('mongoose');

const participantItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  quantity: { type: Number, default: 1 },
  size: { type: String, default: 'medium' },
  price: { type: Number, required: true },
  notes: String
});

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,
  name: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  items: [participantItemSchema],
  subtotal: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false }
});

const groupOrderSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'Group Order' },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['active', 'locked', 'ordered', 'cancelled'],
    default: 'active'
  },
  splitType: {
    type: String,
    enum: ['equal', 'by_item', 'custom'],
    default: 'by_item'
  },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

// Generate unique code
groupOrderSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Calculate totals
groupOrderSchema.pre('save', function(next) {
  this.participants.forEach(participant => {
    participant.subtotal = participant.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  });

  this.subtotal = this.participants.reduce((sum, p) => sum + p.subtotal, 0);
  this.tax = Math.round(this.subtotal * 0.10 * 100) / 100;
  this.total = Math.round((this.subtotal + this.tax) * 100) / 100;

  next();
});

// Calculate split
groupOrderSchema.methods.calculateSplit = function() {
  const splits = [];

  if (this.splitType === 'equal') {
    const equalShare = this.total / this.participants.length;
    this.participants.forEach(p => {
      splits.push({ name: p.name, amount: equalShare });
    });
  } else {
    const taxRate = this.subtotal > 0 ? this.tax / this.subtotal : 0;
    this.participants.forEach(p => {
      const itemTax = p.subtotal * taxRate;
      splits.push({ name: p.name, amount: p.subtotal + itemTax });
    });
  }

  return splits;
};

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
```

**client/src/services/socket.js:**
```javascript
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token = null) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const joinGroupRoom = (groupCode) => {
  if (socket?.connected) {
    socket.emit('join-group', groupCode);
  }
};

export const leaveGroupRoom = (groupCode) => {
  if (socket?.connected) {
    socket.emit('leave-group', groupCode);
  }
};

export const onGroupUpdate = (callback) => {
  if (socket) socket.on('group-updated', callback);
};

export const offGroupUpdate = (callback) => {
  if (socket) socket.off('group-updated', callback);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### Exercises

1. **Set up Socket.io:** Initialize on server and connect from client.

2. **Create GroupOrder model:** Implement participants, items, and split calculation.

3. **Build group order endpoints:** Create, join, add items, lock, and checkout.

4. **Emit real-time updates:** Send updates to all participants when state changes.

5. **Build group order UI:** Create/join pages with real-time participant updates.

---

## Module 12: Testing & CI/CD

### Learning Objectives
- Write unit and integration tests
- Set up continuous integration
- Deploy to cloud platforms

### Concepts Covered
- Jest test framework
- Supertest for API testing
- GitHub Actions workflows
- Environment-based configuration
- Deployment to Render

### Files to Create

```
server/
├── __tests__/
│   ├── setup.js
│   ├── auth.test.js
│   └── products.test.js
└── jest.config.js

.github/
└── workflows/
    └── ci.yml
```

### Key Code Snippets

**server/__tests__/setup.js:**
```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**server/__tests__/auth.test.js:**
```javascript
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
    });

    it('should not register with existing email', async () => {
      await User.create({
        name: 'Existing',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-server:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run tests
        working-directory: ./server
        run: npm test
        env:
          JWT_SECRET: test-secret-key
          NODE_ENV: test

  test-client:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json

      - name: Install dependencies
        working-directory: ./client
        run: npm ci

      - name: Run tests
        working-directory: ./client
        run: npm test -- --coverage --watchAll=false

  build:
    needs: [test-server, test-client]
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build client
        working-directory: ./client
        run: |
          npm ci
          npm run build
```

**Render Deployment (render.yaml):**
```yaml
services:
  # Backend API
  - type: web
    name: crewplus-api
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: CLIENT_URL
        fromService:
          name: crewplus-client
          type: web
          property: host

  # Frontend
  - type: web
    name: crewplus-client
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    envVars:
      - key: REACT_APP_API_URL
        fromService:
          name: crewplus-api
          type: web
          envVarKey: RENDER_EXTERNAL_URL
```

### Exercises

1. **Set up Jest:** Configure Jest with mongodb-memory-server for isolated tests.

2. **Write auth tests:** Test registration, login, and protected routes.

3. **Write product tests:** Test CRUD operations and filtering.

4. **Create GitHub Actions workflow:** Run tests on every push/PR.

5. **Deploy to Render:** Set up automatic deployments from the main branch.

---

## Conclusion

Congratulations! You have completed the CrewPlus Full-Stack Development Curriculum. You have learned:

1. **Project Setup:** Monorepo structure, environment configuration
2. **Database:** MongoDB with Mongoose, schema design, indexes
3. **Authentication:** JWT, bcrypt, middleware patterns
4. **CRUD Operations:** RESTful API design, filtering, pagination
5. **State Management:** Cart with sessions and user association
6. **Order Flow:** Status machines, inventory management
7. **Discounts:** Coupon validation and application
8. **Customizations:** Many-to-many relationships
9. **Admin Features:** Role-based access, analytics
10. **AI/ML:** Recommendation algorithms, user preferences
11. **Real-time:** Socket.io, collaborative features
12. **DevOps:** Testing, CI/CD, deployment

### Next Steps

- Add payment gateway integration (Stripe/Razorpay)
- Implement push notifications
- Add OAuth social login
- Build a mobile app with React Native
- Add rate limiting and security hardening
- Implement image upload with cloud storage

### Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [React Documentation](https://react.dev/)
- [Socket.io Documentation](https://socket.io/)
- [Jest Documentation](https://jestjs.io/)

---

*This curriculum was created based on the CrewPlus Pizza Ordering Platform codebase.*
