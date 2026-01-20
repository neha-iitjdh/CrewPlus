# Module 1: Project Setup & Tooling

## Learning Objectives
By the end of this module, you will:
- Set up a full-stack project structure (monorepo style)
- Initialize Node.js backend with Express
- Initialize React frontend
- Configure environment variables
- Understand the project folder organization

---

## 1.1 Understanding the Architecture

Before we write any code, let's understand what we're building:

```
CrewPlus/
├── client/          # React Frontend (Port 3000)
├── server/          # Express Backend (Port 5000)
├── docs/            # Documentation
└── package.json     # Root scripts (optional)
```

**Why this structure?**
- **Separation of concerns**: Frontend and backend are independent
- **Easy deployment**: Can deploy to different services
- **Team scalability**: Different teams can work independently
- **Clear boundaries**: API contract between frontend and backend

---

## 1.2 Initialize the Project

### Step 1: Create Project Folder

```bash
mkdir CrewPlus
cd CrewPlus
git init
```

### Step 2: Create .gitignore

Create a `.gitignore` file in the root:

```gitignore
# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.*.local

# Build outputs
build/
dist/

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Coverage
coverage/
```

**Why .gitignore matters:**
- Prevents sensitive data (`.env`) from being committed
- Keeps repo clean by excluding generated files
- Reduces repo size by excluding `node_modules/`

---

## 1.3 Setup Backend (Express.js)

### Step 1: Initialize Node.js Project

```bash
mkdir server
cd server
npm init -y
```

This creates `package.json` - the manifest for your Node.js project.

### Step 2: Install Core Dependencies

```bash
npm install express cors dotenv mongoose morgan
npm install --save-dev nodemon
```

| Package | Purpose |
|---------|---------|
| `express` | Web framework for Node.js |
| `cors` | Enable Cross-Origin Resource Sharing |
| `dotenv` | Load environment variables from .env |
| `mongoose` | MongoDB object modeling |
| `morgan` | HTTP request logger |
| `nodemon` | Auto-restart server on changes (dev) |

### Step 3: Create Folder Structure

```bash
mkdir -p src/{config,controllers,middleware,models,routes,services,utils,validators}
```

```
server/
├── src/
│   ├── config/         # Database, constants
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   ├── validators/     # Input validation
│   ├── app.js          # Express app setup
│   └── index.js        # Server entry point
├── .env.example
└── package.json
```

### Step 4: Create Environment File

Create `server/.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/crewplus

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

Copy to `.env` and fill in your values:
```bash
cp .env.example .env
```

### Step 5: Create Utility Functions

**server/src/utils/ApiResponse.js** - Standardized API responses:

```javascript
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
```

**Why standardize responses?**
- Consistent structure for frontend to parse
- Easy to add metadata (pagination, etc.)
- Clear success/error indication

**server/src/utils/ApiError.js** - Custom error class:

```javascript
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}

module.exports = ApiError;
```

**server/src/utils/asyncHandler.js** - Async error wrapper:

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

**Why asyncHandler?**
- Eliminates try-catch in every async route
- Automatically passes errors to error middleware
- Cleaner controller code

### Step 6: Create Express App

**server/src/app.js**:

```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ===================
// MIDDLEWARE
// ===================

// Enable CORS for frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===================
// ROUTES
// ===================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CrewPlus API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ===================
// ERROR HANDLER
// ===================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || []
  });
});

module.exports = app;
```

**Key Concepts Explained:**

1. **Middleware Order Matters**: Middleware executes in order. CORS → JSON parser → Logger → Routes → Error handler

2. **CORS Configuration**:
   - `origin`: Which domains can access your API
   - `credentials: true`: Allow cookies/auth headers

3. **Error Handler**: Must have 4 parameters (err, req, res, next) to be recognized as error middleware

### Step 7: Create Server Entry Point

**server/src/index.js**:

```javascript
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`
  =============================================
   CrewPlus Server running in ${process.env.NODE_ENV} mode
   Port: ${PORT}
   Health: http://localhost:${PORT}/api/health
  =============================================
  `);
});
```

### Step 8: Update package.json Scripts

Update `server/package.json`:

```json
{
  "name": "crewplus-server",
  "version": "1.0.0",
  "description": "CrewPlus Pizza Ordering API",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "echo \"Tests will be added later\""
  },
  "keywords": ["pizza", "ordering", "express", "api"],
  "license": "ISC"
}
```

### Step 9: Test the Server

```bash
npm run dev
```

Visit: http://localhost:5000/api/health

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

---

## 1.4 Setup Frontend (React)

### Step 1: Create React App

From the project root:

```bash
npx create-react-app client
cd client
```

### Step 2: Install Additional Dependencies

```bash
npm install axios react-router-dom react-icons react-hot-toast
```

| Package | Purpose |
|---------|---------|
| `axios` | HTTP client for API calls |
| `react-router-dom` | Client-side routing |
| `react-icons` | Icon library |
| `react-hot-toast` | Toast notifications |

### Step 3: Create Folder Structure

```bash
cd src
mkdir -p components/{common,layout,menu} context pages/{admin,auth,customer} services utils
```

```
client/src/
├── components/
│   ├── common/      # Reusable components
│   ├── layout/      # Navbar, Footer
│   └── menu/        # Product-related
├── context/         # React Context providers
├── pages/
│   ├── admin/       # Admin pages
│   ├── auth/        # Login, Register
│   └── customer/    # User pages
├── services/        # API service
├── utils/           # Helper functions
├── App.js
├── App.css
├── index.js
└── index.css
```

### Step 4: Create Environment File

Create `client/.env.example`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 5: Create API Service

**client/src/services/api.js**:

```javascript
import axios from 'axios';

// API base URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - runs before every request
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - runs after every response
api.interceptors.response.use(
  (response) => response.data, // Return only data
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';

    // Handle 401 (Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ message });
  }
);

export default api;
```

**Key Concepts:**

1. **Axios Interceptors**: Middleware for HTTP requests/responses
2. **Request Interceptor**: Adds auth token to every request
3. **Response Interceptor**: Handles errors globally, extracts data

### Step 6: Create Basic App Structure

**client/src/App.js**:

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder pages (we'll create these later)
const Home = () => <h1>Home Page</h1>;
const Menu = () => <h1>Menu Page</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation will go here */}

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Footer will go here */}
      </div>
    </Router>
  );
}

export default App;
```

### Step 7: Add Basic Styles

**client/src/index.css**:

```css
/* CSS Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Root variables */
:root {
  --primary-color: #e63946;
  --secondary-color: #1d3557;
  --accent-color: #f4a261;
  --background-color: #f8f9fa;
  --text-color: #212529;
  --text-light: #6c757d;
  --white: #ffffff;
  --border-radius: 8px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

/* Utility classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--white);
}

.btn-primary:hover {
  background-color: #c1121f;
}
```

### Step 8: Configure Proxy (Development)

Add to `client/package.json`:

```json
{
  "proxy": "http://localhost:5000"
}
```

**Why proxy?**
- Avoids CORS issues during development
- Requests to `/api/*` are forwarded to backend
- Simulates production setup

### Step 9: Test the Frontend

```bash
npm start
```

Visit: http://localhost:3000

---

## 1.5 Running Both Servers

### Option 1: Two Terminals

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

### Option 2: Concurrent (Optional)

Install `concurrently` in root:
```bash
npm init -y
npm install concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd server && npm run dev\" \"cd client && npm start\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm start"
  }
}
```

Now run both with:
```bash
npm run dev
```

---

## 1.6 Exercises

### Exercise 1: Add a New Endpoint
Add a `GET /api/info` endpoint that returns:
```json
{
  "name": "CrewPlus",
  "version": "1.0.0",
  "author": "Your Name"
}
```

### Exercise 2: Environment Variable
Add a new environment variable `APP_NAME` and use it in the health check response.

### Exercise 3: New Route
Add a new React route `/about` that displays an "About Us" page.

### Exercise 4: API Call
Make the frontend call `/api/health` and display the server status on the home page.

---

## 1.7 Key Takeaways

1. **Separation of Concerns**: Backend and frontend are independent projects
2. **Environment Variables**: Never commit sensitive data, use `.env` files
3. **Middleware Pattern**: Express processes requests through middleware chain
4. **API Design**: Use consistent response format (`success`, `message`, `data`)
5. **Error Handling**: Centralized error handler catches all errors
6. **Proxy Setup**: Development proxy simplifies API calls

---

## Next Module

In **Module 2: Database & Models**, we will:
- Connect to MongoDB
- Create User and Product models
- Learn about Mongoose schemas, methods, and virtuals
- Set up database connection handling

---

## Checkpoint

Before moving on, ensure:
- [ ] Backend runs on port 5000
- [ ] `/api/health` returns success response
- [ ] Frontend runs on port 3000
- [ ] Folder structure matches the expected layout
- [ ] Environment files are created (but not committed!)
