# CrewPlus Pizza Ordering Portal - Project Overview

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Data Models](#3-data-models)
4. [API Endpoints](#4-api-endpoints)
5. [UI Pages](#5-ui-pages)
6. [Business Logic](#6-business-logic)
7. [Real-time Socket.io Events](#7-real-time-socketio-events)
8. [Security Features](#8-security-features)
9. [Environment Variables](#9-environment-variables)
10. [Project Structure](#10-project-structure)

---

## 1. Project Overview

### What is CrewPlus?
CrewPlus is a full-stack pizza ordering web application that allows customers to browse menus, customize orders, manage carts, place orders (individually or as a group), and track order status in real-time. Administrators can manage products, inventory, coupons, customizations, users, and view analytics.

### Key Features
- **Menu Browsing**: Browse pizzas, drinks, and breads with filtering and search
- **Product Customization**: Add crusts, sauces, cheeses, toppings, and extras
- **Size Variants**: Products available in small, medium, large, and extra-large sizes
- **Shopping Cart**: Session-based (guest) or user-based cart with automatic merging
- **Group Orders**: Collaborative ordering with real-time synchronization
- **Order Tracking**: Track order status by order number
- **AI Recommendations**: Personalized product recommendations based on order history
- **Coupon System**: Percentage or fixed-amount discounts with validation rules
- **Admin Dashboard**: Order management, analytics, inventory control
- **Email Notifications**: Order confirmation and status update emails

### Tech Stack

#### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js 4.18 | Web framework |
| MongoDB + Mongoose 8.0 | Database and ODM |
| Socket.io 4.7 | Real-time communication |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| nodemailer | Email service |
| express-validator | Request validation |
| Jest + Supertest | Testing |

#### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.2 | UI framework |
| React Router 6.21 | Client-side routing |
| Axios | HTTP client |
| Socket.io-client | Real-time updates |
| Recharts | Analytics charts |
| react-hot-toast | Notifications |
| react-icons | Icon library |

---

## 2. Architecture Diagram

```
+------------------------------------------------------------------+
|                         CLIENT (React SPA)                        |
|  +------------------+  +------------------+  +------------------+ |
|  |   Public Pages   |  | Customer Pages   |  |   Admin Pages    | |
|  | - Home           |  | - Orders         |  | - Dashboard      | |
|  | - Menu           |  | - Order Details  |  | - Manage Orders  | |
|  | - Cart           |  | - Profile        |  | - Manage Products| |
|  | - Checkout       |  |                  |  | - Manage Users   | |
|  | - Track Order    |  |                  |  | - Manage Coupons | |
|  | - Group Order    |  |                  |  | - Inventory      | |
|  | - Login/Register |  |                  |  | - Customizations | |
|  +------------------+  +------------------+  +------------------+ |
|                              |                                    |
|  +----------------------------------------------------------+    |
|  |                    Context Providers                      |    |
|  |  AuthContext  |  CartContext  |  GroupOrderContext       |    |
|  +----------------------------------------------------------+    |
+------------------------------------------------------------------+
                               |
                    HTTP (REST API) + WebSocket
                               |
+------------------------------------------------------------------+
|                      SERVER (Express.js)                          |
|  +----------------------------------------------------------+    |
|  |                    Middleware Layer                       |    |
|  |  CORS | Auth | Validation | Error Handler | Morgan       |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|  +----------------------------------------------------------+    |
|  |                      Route Layer                          |    |
|  | /auth | /products | /cart | /orders | /coupons |         |    |
|  | /customizations | /recommendations | /group-orders       |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|  +----------------------------------------------------------+    |
|  |                   Controller Layer                        |    |
|  |  Business Logic | Request Processing | Response Building  |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|  +----------------------------------------------------------+    |
|  |                    Service Layer                          |    |
|  |  RecommendationService  |  EmailService                  |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|  +----------------------------------------------------------+    |
|  |                     Model Layer                           |    |
|  |  User | Product | Cart | Order | Coupon | Customization  |    |
|  |  GroupOrder | UserPreference                             |    |
|  +----------------------------------------------------------+    |
|                               |                                   |
|  +------------------+    +------------------+                     |
|  |    Socket.io    |    |    MongoDB       |                     |
|  |   (Real-time)   |    |   (Database)     |                     |
|  +------------------+    +------------------+                     |
+------------------------------------------------------------------+
```

### Request Flow
```
Client Request
      |
      v
+---> Express App
      |
      +---> CORS Middleware
      |
      +---> JSON Body Parser
      |
      +---> Auth Middleware (protect/optionalAuth)
      |
      +---> Validation Middleware
      |
      +---> Route Handler --> Controller --> Service/Model
      |
      +---> Response (ApiResponse)
      |
      +---> Error Handler (if error)
      |
      v
Client Response
```

---

## 3. Data Models

### 3.1 User Model
**Collection**: `users`
**Location**: `/server/src/models/User.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Max 50 chars, trimmed |
| email | String | Yes | Unique, lowercase, validated |
| password | String | Yes | Min 6 chars, hashed, not selected by default |
| phone | String | No | 10-digit validation |
| role | String | No | Enum: guest, customer, admin (default: customer) |
| address.street | String | No | Delivery address |
| address.city | String | No | Delivery address |
| address.state | String | No | Delivery address |
| address.zipCode | String | No | Delivery address |
| avatar | String | No | Profile image URL |
| isActive | Boolean | No | Default: true |
| lastLogin | Date | No | Last login timestamp |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Business Rules**:
- Password is automatically hashed (bcrypt, 10 rounds) before saving
- Email must be unique across all users
- JWT token generated with user ID and role, expires in 7 days
- `toPublicJSON()` method excludes sensitive data

**Methods**:
- `comparePassword(candidatePassword)` - Compare entered password with hashed
- `generateToken()` - Generate JWT token
- `toPublicJSON()` - Return safe public profile data

---

### 3.2 Product Model
**Collection**: `products`
**Location**: `/server/src/models/Product.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Max 100 chars |
| description | String | No | Max 500 chars |
| category | String | Yes | Enum: pizza, drink, bread |
| price | Number | Yes | Base price (min 0) |
| prices.small | Number | No | Size-specific price |
| prices.medium | Number | No | Size-specific price |
| prices.large | Number | No | Size-specific price |
| prices.extra_large | Number | No | Size-specific price |
| inventory | Number | Yes | Stock count (default: 0) |
| imageUrl | String | No | Product image URL |
| ingredients | [String] | No | List of ingredients |
| isVegetarian | Boolean | No | Default: false |
| isSpicy | Boolean | No | Default: false |
| isAvailable | Boolean | No | Default: true |
| rating.average | Number | No | 0-5 scale |
| rating.count | Number | No | Number of ratings |
| tags | [String] | No | Searchable tags |

**Business Rules**:
- Product must have positive inventory and isAvailable=true to be purchasable
- Size prices override base price when specified
- Text search enabled on name and description

**Indexes**:
- `{ category: 1, isAvailable: 1 }` - Category filtering
- `{ name: 'text', description: 'text' }` - Full-text search

**Methods**:
- `inStock` (virtual) - Returns true if inventory > 0 and isAvailable
- `hasStock(quantity)` - Check if sufficient inventory
- `deductInventory(quantity)` - Decrease inventory (throws if insufficient)
- `addInventory(quantity)` - Increase inventory

---

### 3.3 Cart Model
**Collection**: `carts`
**Location**: `/server/src/models/Cart.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user | ObjectId (User) | Conditional | Required if no sessionId |
| sessionId | String | Conditional | Required if no user |
| items | [CartItem] | No | Array of cart items |
| subtotal | Number | No | Auto-calculated |
| tax | Number | No | Auto-calculated (10%) |
| total | Number | No | Auto-calculated |

**CartItem Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product | ObjectId (Product) | Yes | Reference to product |
| quantity | Number | Yes | Min 1, default 1 |
| size | String | No | Enum: small, medium, large, extra_large |
| price | Number | Yes | Price at time of adding |
| customizations | [CustomizationItem] | No | Selected customizations |
| customizationTotal | Number | No | Sum of customization prices |
| notes | String | No | Special instructions (max 200 chars) |

**Business Rules**:
- Cart can be either user-based (authenticated) or session-based (guest)
- Items with same product + size + customizations are merged (quantity added)
- Tax is 10% of subtotal
- Totals auto-recalculate on save

**Methods**:
- `addItem(productId, quantity, size, price, notes, customizations, customizationTotal)` - Add/merge item
- `updateItemQuantity(itemId, quantity)` - Update quantity (removes if 0)
- `removeItem(itemId)` - Remove item from cart
- `clearCart()` - Remove all items

---

### 3.4 Order Model
**Collection**: `orders`
**Location**: `/server/src/models/Order.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderNumber | String | Yes | Unique, auto-generated (ORD-YYYYMMDD-XXXX) |
| user | ObjectId (User) | No | Null for guest orders |
| sessionId | String | No | For guest orders |
| items | [OrderItem] | Yes | Ordered items |
| subtotal | Number | Yes | Sum of item prices |
| tax | Number | Yes | Tax amount |
| deliveryFee | Number | No | Default 0 (50 for delivery) |
| discount | Number | No | Coupon discount amount |
| couponCode | String | No | Applied coupon code |
| total | Number | Yes | Final amount |
| type | String | Yes | Enum: delivery, carryout |
| status | String | No | See Order Status below |
| customerInfo.name | String | Yes | Customer name |
| customerInfo.email | String | Yes | Customer email |
| customerInfo.phone | String | Yes | Customer phone |
| deliveryAddress | Object | No | Required for delivery orders |
| paymentMethod | String | No | Enum: cash, card, online |
| paymentStatus | String | No | Enum: pending, paid, failed, refunded |
| notes | String | No | Order notes |
| estimatedDelivery | Date | No | Estimated completion time |
| completedAt | Date | No | Actual completion timestamp |

**Order Status Flow**:
```
pending --> confirmed --> preparing --> ready --> delivered
    |           |            |
    v           v            v
cancelled  cancelled    cancelled
```

**Business Rules**:
- Order number format: `ORD-YYYYMMDD-XXXX` (daily sequential)
- Delivery fee: 50 for delivery, 0 for carryout
- Estimated delivery: +45 min (delivery) or +20 min (carryout)
- Inventory restored on cancellation
- Payment marked as 'paid' when status becomes 'delivered'

**Static Methods**:
- `getAnalytics(startDate, endDate)` - Revenue, order counts, status breakdown
- `getPopularItems(limit)` - Most ordered products

---

### 3.5 Coupon Model
**Collection**: `coupons`
**Location**: `/server/src/models/Coupon.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | String | Yes | Unique, uppercase, max 20 chars |
| description | String | No | Max 200 chars |
| type | String | Yes | Enum: percentage, fixed |
| value | Number | Yes | Discount value (% or amount) |
| minOrderAmount | Number | No | Minimum order subtotal |
| maxDiscount | Number | No | Cap on discount amount |
| usageLimit | Number | No | Total usage limit |
| usedCount | Number | No | Current usage count |
| userUsageLimit | Number | No | Per-user limit (default: 1) |
| usedBy | [UsageRecord] | No | Usage tracking array |
| validFrom | Date | No | Start validity |
| validUntil | Date | Yes | End validity |
| isActive | Boolean | No | Default: true |
| applicableCategories | [String] | No | Enum: pizza, drink, bread |

**Business Rules**:
- Code is automatically converted to uppercase
- Coupon valid if: isActive AND within date range AND under usage limit
- Discount calculation: percentage of subtotal OR fixed amount
- Max discount caps the calculated discount
- Discount cannot exceed subtotal

**Methods**:
- `isValid` (virtual) - Check all validity conditions
- `canBeUsedBy(userId)` - Check user-specific usage limit
- `calculateDiscount(subtotal)` - Calculate discount amount
- `markAsUsed(userId, orderId)` - Record usage

---

### 3.6 Customization Model
**Collection**: `customizations`
**Location**: `/server/src/models/Customization.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Max 50 chars |
| type | String | Yes | Enum: crust, sauce, cheese, topping, extra |
| price | Number | Yes | Additional cost (default: 0) |
| isVegetarian | Boolean | No | Default: true |
| isAvailable | Boolean | No | Default: true |
| applicableCategories | [String] | No | Enum: pizza, drink, bread |

**Business Rules**:
- Customizations are applied per cart/order item
- Price is added to item total

---

### 3.7 GroupOrder Model
**Collection**: `grouporders`
**Location**: `/server/src/models/GroupOrder.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | String | Yes | Unique 6-character code |
| host | ObjectId (User) | Yes | Group creator |
| name | String | Yes | Group order name |
| participants | [Participant] | No | Array of participants |
| status | String | No | Enum: active, locked, ordered, cancelled |
| splitType | String | No | Enum: equal, by_item, custom |
| subtotal | Number | No | Auto-calculated |
| tax | Number | No | Auto-calculated (10%) |
| total | Number | No | Auto-calculated |
| orderPlaced | ObjectId (Order) | No | Final order reference |
| expiresAt | Date | No | TTL: 24 hours |
| maxParticipants | Number | No | Default: 10 |

**Participant Schema**:
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId (User) | Authenticated user |
| sessionId | String | Guest identifier |
| name | String | Display name |
| isHost | Boolean | Host flag |
| items | [ParticipantItem] | Participant's items |
| subtotal | Number | Participant's subtotal |
| joinedAt | Date | Join timestamp |
| isReady | Boolean | Ready status |

**Business Rules**:
- Code: 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Only host can lock/unlock, set split type, checkout, or cancel
- Participants can only modify their own items
- Group expires after 24 hours (TTL index)
- Host cannot leave the group

**Split Calculation**:
- **equal**: Total / participant count
- **by_item**: Each participant pays (their subtotal + proportional tax)

**Methods**:
- `generateCode()` (static) - Generate unique 6-char code
- `getParticipant(userId, sessionId)` - Find participant
- `addParticipant(data)` - Add new participant
- `removeParticipant(userId, sessionId)` - Remove participant
- `calculateSplit()` - Calculate payment split

---

### 3.8 UserPreference Model
**Collection**: `userpreferences`
**Location**: `/server/src/models/UserPreference.js`

| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId (User) | One-to-one with User |
| favoriteCategories | [CategoryPref] | Category order counts |
| favoriteProducts | [ProductPref] | Product order counts |
| preferredSizes.small | Number | Size preference count |
| preferredSizes.medium | Number | Size preference count |
| preferredSizes.large | Number | Size preference count |
| preferredSizes.extra_large | Number | Size preference count |
| dietaryPreferences.vegetarian | Boolean | User-set preference |
| dietaryPreferences.vegan | Boolean | User-set preference |
| dietaryPreferences.glutenFree | Boolean | User-set preference |
| dietaryPreferences.spicy | Boolean | User-set preference |
| favoriteCustomizations | [CustomPref] | Customization usage counts |
| orderPatterns.weekdayOrders | Number | Weekday order count |
| orderPatterns.weekendOrders | Number | Weekend order count |
| orderPatterns.lunchOrders | Number | 11am-2pm orders |
| orderPatterns.dinnerOrders | Number | 5pm-9pm orders |
| orderPatterns.lateNightOrders | Number | 9pm-12am orders |
| averageOrderValue | Number | Running average |
| totalOrders | Number | Total order count |
| lastRecommendation | Date | Last recommendation timestamp |

**Business Rules**:
- Created automatically when user first gets recommendations
- Updated automatically after each order completion
- Top 20 favorites kept (sorted by count)

**Methods**:
- `updateFromOrder(order)` - Update all preferences from an order
- `getPreferredSize()` - Get most frequently ordered size
- `getTimePreference()` - Get preferred order time (lunch/dinner/lateNight)

---

## 4. API Endpoints

Base URL: `/api`

### 4.1 Authentication Routes (`/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login and get token |
| GET | `/me` | Protected | Get current user profile |
| PUT | `/profile` | Protected | Update profile |
| PUT | `/password` | Protected | Change password |
| GET | `/users` | Admin | List all users |
| POST | `/users` | Admin | Create new user |
| PUT | `/users/:id/role` | Admin | Update user role |
| PUT | `/users/:id/status` | Admin | Toggle user active status |

**Request/Response Examples**:

**POST /auth/register**
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 4.2 Product Routes (`/products`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get available products (filtered) |
| GET | `/menu` | Public | Get menu grouped by category |
| GET | `/:id` | Public | Get single product |
| GET | `/admin/all` | Admin | Get all products (including unavailable) |
| GET | `/admin/low-stock` | Admin | Get low-stock products |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| PUT | `/:id/inventory` | Admin | Update inventory |

**Query Parameters** (GET /):
- `category` - Filter by category
- `search` - Text search
- `vegetarian` - Filter vegetarian only
- `minPrice`, `maxPrice` - Price range

---

### 4.3 Cart Routes (`/cart`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Optional Auth | Get cart |
| POST | `/items` | Optional Auth | Add item to cart |
| PUT | `/items/:itemId` | Optional Auth | Update item quantity |
| DELETE | `/items/:itemId` | Optional Auth | Remove item |
| DELETE | `/` | Optional Auth | Clear cart |
| POST | `/merge` | Protected | Merge guest cart with user cart |

**Headers Required**:
- Authenticated: `Authorization: Bearer <token>`
- Guest: `x-session-id: <uuid>`

**POST /cart/items**
```json
Request:
{
  "productId": "65abc...",
  "quantity": 2,
  "size": "large",
  "notes": "Extra crispy",
  "customizations": ["65def...", "65ghi..."]
}
```

---

### 4.4 Order Routes (`/orders`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/track/:orderNumber` | Public | Track order by number |
| POST | `/` | Optional Auth | Create order from cart |
| GET | `/my-orders` | Protected | Get user's orders |
| GET | `/:id` | Protected | Get order details |
| PUT | `/:id/cancel` | Protected | Cancel order |
| GET | `/` | Admin | Get all orders |
| GET | `/admin/analytics` | Admin | Get order analytics |
| PUT | `/:id/status` | Admin | Update order status |

**POST /orders**
```json
Request:
{
  "type": "delivery",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  },
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "paymentMethod": "card",
  "couponCode": "SAVE10"
}
```

**Query Parameters** (GET /orders, GET /my-orders):
- `status` - Filter by status
- `type` - Filter by order type
- `startDate`, `endDate` - Date range
- `page`, `limit` - Pagination

---

### 4.5 Coupon Routes (`/coupons`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/validate` | Optional Auth | Validate coupon code |
| GET | `/` | Admin | List all coupons |
| POST | `/` | Admin | Create coupon |
| GET | `/:id` | Admin | Get coupon details |
| PUT | `/:id` | Admin | Update coupon |
| DELETE | `/:id` | Admin | Delete coupon |
| PUT | `/:id/toggle` | Admin | Toggle active status |

**POST /coupons/validate**
```json
Request:
{
  "code": "SAVE10",
  "subtotal": 100
}

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "discount": 10,
    "message": "Coupon applied: 10% off"
  }
}
```

---

### 4.6 Customization Routes (`/customizations`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get available customizations |
| GET | `/admin/all` | Admin | Get all customizations |
| POST | `/` | Admin | Create customization |
| PUT | `/:id` | Admin | Update customization |
| DELETE | `/:id` | Admin | Delete customization |
| PUT | `/:id/toggle` | Admin | Toggle availability |

---

### 4.7 Recommendation Routes (`/recommendations`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/popular` | Public | Get popular items |
| GET | `/trending` | Public | Get trending items (last 7 days) |
| POST | `/similar` | Public | Get similar items to given products |
| GET | `/` | Protected | Get personalized recommendations |
| GET | `/preferences` | Protected | Get user preferences |
| PUT | `/preferences/dietary` | Protected | Update dietary preferences |
| GET | `/reorder` | Protected | Get reorder suggestions |

**POST /recommendations/similar**
```json
Request:
{
  "productIds": ["65abc...", "65def..."]
}
```

---

### 4.8 Group Order Routes (`/group-orders`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Protected | Create group order |
| GET | `/` | Protected | Get user's group orders |
| GET | `/:code` | Optional Auth | Get group order by code |
| POST | `/:code/join` | Optional Auth | Join group order |
| POST | `/:code/leave` | Optional Auth | Leave group order |
| POST | `/:code/items` | Optional Auth | Add item |
| PUT | `/:code/items/:itemId` | Optional Auth | Update item |
| DELETE | `/:code/items/:itemId` | Optional Auth | Remove item |
| PUT | `/:code/ready` | Optional Auth | Toggle ready status |
| GET | `/:code/split` | Optional Auth | Get split calculation |
| PUT | `/:code/lock` | Protected (Host) | Lock group order |
| PUT | `/:code/unlock` | Protected (Host) | Unlock group order |
| PUT | `/:code/split` | Protected (Host) | Set split type |
| POST | `/:code/checkout` | Protected (Host) | Place group order |
| DELETE | `/:code` | Protected (Host) | Cancel group order |

---

## 5. UI Pages

### 5.1 Public Pages (No Authentication Required)

| Page | Route | Component | Description |
|------|-------|-----------|-------------|
| Home | `/` | `Home.js` | Landing page with recommendations |
| Menu | `/menu` | `Menu.js` | Browse all products by category |
| Cart | `/cart` | `Cart.js` | View and manage cart |
| Checkout | `/checkout` | `Checkout.js` | Complete order |
| Track Order | `/track` | `TrackOrder.js` | Track order by number |
| Create Group | `/group-order/create` | `CreateGroupOrder.js` | Start new group order |
| Group Order | `/group-order/:code` | `GroupOrder.js` | Join/participate in group order |
| Login | `/login` | `Login.js` | User login |
| Register | `/register` | `Register.js` | New user registration |

### 5.2 Customer Pages (Authentication Required)

| Page | Route | Component | Description |
|------|-------|-----------|-------------|
| My Orders | `/orders` | `Orders.js` | List of user's orders |
| Order Details | `/orders/:id` | `OrderDetails.js` | Single order details |
| Profile | `/profile` | `Profile.js` | User profile management |

### 5.3 Admin Pages (Admin Role Required)

| Page | Route | Component | Description |
|------|-------|-----------|-------------|
| Dashboard | `/admin` | `Dashboard.js` | Analytics and overview |
| Manage Orders | `/admin/orders` | `ManageOrders.js` | Process orders, update status |
| Manage Products | `/admin/products` | `ManageProducts.js` | CRUD products |
| Manage Inventory | `/admin/inventory` | `ManageInventory.js` | Stock management |
| Manage Users | `/admin/users` | `ManageUsers.js` | User management |
| Manage Coupons | `/admin/coupons` | `ManageCoupons.js` | Coupon management |
| Manage Customizations | `/admin/customizations` | `ManageCustomizations.js` | Customization options |

---

## 6. Business Logic

### 6.1 Pricing Calculation

```javascript
// Cart Item Price Calculation
itemTotal = (basePrice + customizationTotal) * quantity

// Cart Totals
subtotal = sum(all itemTotals)
tax = subtotal * 0.10  // 10% tax
total = subtotal + tax

// Order Totals
deliveryFee = (type === 'delivery') ? 50 : 0
discount = coupon.calculateDiscount(subtotal)
orderTotal = subtotal + tax + deliveryFee - discount
```

### 6.2 AI Recommendations Algorithm

The recommendation system scores products based on multiple factors:

```javascript
// Scoring Factors (RecommendationService)
score = 0

// 1. Base popularity (max 10 points)
score += min(product.orderCount, 100) / 10

// 2. Favorite product boost (max 50 points)
if (isFavorite) score += min(orderCount * 5, 50)

// 3. Category preference (max 20 points)
if (categoryOrdered) score += min(categoryOrderCount * 2, 20)

// 4. Time-based boost (15/10 points)
if (isLateNight && product.category === 'sides') score += 15
if (isDinner && product.category === 'pizza') score += 10
if (isLunch && product.category === 'combo') score += 10

// 5. Dietary preferences (25/20 points)
if (userPrefersVegetarian && product.isVegetarian) score += 25
if (userPrefersSpicy && product.isSpicy) score += 20

// 6. Price similarity (10 points)
if (abs(product.price - avgItemValue) < 5) score += 10

// 7. Novelty boost (5 points)
if (!isFavorite && product.isAvailable) score += 5

// 8. Rating boost (max ~10 points)
if (product.rating >= 4.5) reasons.push('Highly rated')
score += product.rating * 2
```

**Diversification Strategy**:
1. Add top 2 favorites first
2. Add items from different categories (max 3 categories)
3. Fill remaining with highest scored items

### 6.3 Group Order Split Calculation

```javascript
// Equal Split
equalShare = total / participantCount

// By Item Split (proportional tax)
taxRate = tax / subtotal
participantTotal = participantSubtotal + (participantSubtotal * taxRate)
```

### 6.4 Order Status Transitions

```
Valid State Transitions:
pending    -> confirmed, cancelled
confirmed  -> preparing, cancelled
preparing  -> ready, cancelled
ready      -> delivered
delivered  -> (terminal)
cancelled  -> (terminal)
```

### 6.5 Coupon Discount Calculation

```javascript
if (subtotal < minOrderAmount) return 0

if (type === 'percentage') {
  discount = subtotal * (value / 100)
} else {
  discount = value
}

if (maxDiscount && discount > maxDiscount) {
  discount = maxDiscount
}

if (discount > subtotal) {
  discount = subtotal
}

return round(discount, 2)
```

---

## 7. Real-time Socket.io Events

### Connection Setup
```javascript
// Server (socket/index.js)
io.use((socket, next) => {
  // Optional JWT verification
  const token = socket.handshake.auth.token;
  if (token) {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
  }
  next(); // Allow guests
});
```

### Events

| Event | Direction | Room | Description |
|-------|-----------|------|-------------|
| `connection` | Client->Server | - | Socket connects |
| `disconnect` | Client->Server | - | Socket disconnects |
| `join-group` | Client->Server | - | Join group:CODE room |
| `leave-group` | Client->Server | - | Leave group:CODE room |
| `participant-joined` | Server->Room | group:CODE | New participant notification |
| `participant-left` | Server->Room | group:CODE | Participant left notification |
| `group-updated` | Server->Room | group:CODE | Any group order change |

### group-updated Event Payload
```javascript
{
  groupOrder: { /* full group order object */ },
  event: 'participant-joined' | 'participant-left' | 'item-added' |
         'item-updated' | 'item-removed' | 'ready-toggled' |
         'order-locked' | 'order-unlocked' | 'split-changed' |
         'order-placed' | 'order-cancelled',
  splits: [ /* only for split-changed */ ],
  order: { /* only for order-placed */ }
}
```

---

## 8. Security Features

### 8.1 Authentication
- **JWT Tokens**: 7-day expiration, contains user ID and role
- **Password Hashing**: bcrypt with 10 salt rounds
- **Password Field**: `select: false` in schema (never returned by default)

### 8.2 Authorization
- **protect**: Requires valid JWT token
- **optionalAuth**: Attaches user if token present, continues if not
- **isAdmin**: Requires admin role
- **validateApiKey**: X-API-Key header validation

### 8.3 Input Validation
- **express-validator**: Request body/params validation
- **Mongoose Validation**: Schema-level constraints
- **Error Messages**: Sanitized error responses

### 8.4 Security Middleware
```javascript
// CORS Configuration
cors({
  origin: process.env.CLIENT_URL,
  credentials: true
})

// Session-based Cart Access
// Guest carts require x-session-id header
```

### 8.5 Data Protection
- Passwords never returned in responses
- User ownership verified for order access
- Host-only operations for group orders

---

## 9. Environment Variables

### Server (`/server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5000 | Server port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_EXPIRE | No | 7d | Token expiration |
| API_KEY | No | - | API key for additional security |
| CLIENT_URL | No | http://localhost:3000 | CORS origin |
| SMTP_HOST | No | - | Email server host |
| SMTP_PORT | No | - | Email server port |
| SMTP_USER | No | - | Email username |
| SMTP_PASS | No | - | Email password |
| SMTP_FROM | No | - | From address |

### Client (`/client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| REACT_APP_API_URL | Yes | Backend API URL |

---

## 10. Project Structure

```
CrewPlus/
├── client/                          # React Frontend
│   ├── public/                      # Static files
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Loading.js       # Loading spinner
│   │   │   │   └── ProtectedRoute.js # Auth wrapper
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.js        # Navigation
│   │   │   │   └── Footer.js        # Footer
│   │   │   ├── menu/
│   │   │   │   └── ProductCard.js   # Product display
│   │   │   └── Recommendations.js   # Recommendation component
│   │   ├── context/
│   │   │   ├── AuthContext.js       # Auth state
│   │   │   ├── CartContext.js       # Cart state
│   │   │   └── GroupOrderContext.js # Group order state
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── ManageCoupons.js
│   │   │   │   ├── ManageCustomizations.js
│   │   │   │   ├── ManageInventory.js
│   │   │   │   ├── ManageOrders.js
│   │   │   │   ├── ManageProducts.js
│   │   │   │   └── ManageUsers.js
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   ├── customer/
│   │   │   │   ├── OrderDetails.js
│   │   │   │   ├── Orders.js
│   │   │   │   └── Profile.js
│   │   │   ├── Cart.js
│   │   │   ├── Checkout.js
│   │   │   ├── CreateGroupOrder.js
│   │   │   ├── GroupOrder.js
│   │   │   ├── Home.js
│   │   │   ├── Menu.js
│   │   │   └── TrackOrder.js
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance
│   │   │   └── socket.js            # Socket.io client
│   │   ├── App.js                   # Root component
│   │   ├── App.css                  # Global styles
│   │   └── index.js                 # Entry point
│   ├── .env                         # Environment variables
│   └── package.json
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js         # Enums and constants
│   │   │   └── db.js                # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── cartController.js
│   │   │   ├── couponController.js
│   │   │   ├── customizationController.js
│   │   │   ├── groupOrderController.js
│   │   │   ├── orderController.js
│   │   │   ├── productController.js
│   │   │   └── recommendationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # Auth middleware
│   │   │   ├── errorHandler.js      # Error handling
│   │   │   └── validate.js          # Validation handler
│   │   ├── models/
│   │   │   ├── Cart.js
│   │   │   ├── Coupon.js
│   │   │   ├── Customization.js
│   │   │   ├── GroupOrder.js
│   │   │   ├── Order.js
│   │   │   ├── Product.js
│   │   │   ├── User.js
│   │   │   └── UserPreference.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   ├── couponRoutes.js
│   │   │   ├── customizationRoutes.js
│   │   │   ├── groupOrderRoutes.js
│   │   │   ├── index.js             # Route aggregator
│   │   │   ├── orderRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   └── recommendationRoutes.js
│   │   ├── seeds/
│   │   │   └── seedData.js          # Database seeding
│   │   ├── services/
│   │   │   ├── emailService.js      # Email notifications
│   │   │   └── recommendationService.js # AI recommendations
│   │   ├── socket/
│   │   │   └── index.js             # Socket.io setup
│   │   ├── utils/
│   │   │   ├── ApiError.js          # Custom error class
│   │   │   ├── ApiResponse.js       # Response formatter
│   │   │   ├── asyncHandler.js      # Async error wrapper
│   │   │   └── generateToken.js     # JWT generation
│   │   ├── validators/
│   │   │   ├── authValidator.js
│   │   │   ├── cartValidator.js
│   │   │   ├── orderValidator.js
│   │   │   └── productValidator.js
│   │   ├── app.js                   # Express app setup
│   │   └── index.js                 # Server entry point
│   ├── __tests__/                   # Jest tests
│   ├── .env                         # Environment variables
│   └── package.json
│
├── docs/                            # Documentation
│   └── PROJECT_OVERVIEW.md          # This file
├── postman/                         # API collection
├── DEPLOYMENT.md                    # Deployment guide
├── README.md                        # Project readme
└── render.yaml                      # Render deployment config
```

---

## Quick Reference

### Running the Project

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start development servers
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm start

# Seed database
cd server && npm run seed

# Run tests
cd server && npm test
```

### Default Ports
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Base: http://localhost:5000/api

### Admin Access
Create admin user via seed script or change role in database.

---

*Last Updated: January 2026*
*Version: 1.0.0*
