/**
 * API Documentation
 *
 * Simple, no-dependency API docs that renders as HTML.
 * Access at: GET /api/docs
 */

const apiDocs = {
  info: {
    title: 'CrewPlus Pizza API',
    version: '1.0.0',
    description: 'RESTful API for pizza ordering system',
    baseUrl: '/api'
  },

  authentication: {
    type: 'Bearer Token',
    description: 'Include JWT token in Authorization header',
    example: 'Authorization: Bearer <your-token>',
    guestSession: {
      header: 'x-session-id',
      description: 'For guest carts/orders, send session ID in this header',
      example: 'x-session-id: session_abc123'
    }
  },

  endpoints: [
    // ==================== AUTH ====================
    {
      category: 'Authentication',
      routes: [
        {
          method: 'POST',
          path: '/auth/register',
          summary: 'Register new user',
          auth: false,
          body: {
            name: { type: 'string', required: true, example: 'John Doe' },
            email: { type: 'string', required: true, example: 'john@example.com' },
            password: { type: 'string', required: true, example: 'password123', minLength: 6 },
            phone: { type: 'string', required: true, example: '9876543210', pattern: '10 digits' }
          },
          response: {
            success: true,
            data: { user: {}, token: 'jwt-token' }
          }
        },
        {
          method: 'POST',
          path: '/auth/login',
          summary: 'Login user',
          auth: false,
          body: {
            email: { type: 'string', required: true },
            password: { type: 'string', required: true }
          },
          response: {
            success: true,
            data: { user: {}, token: 'jwt-token' }
          }
        },
        {
          method: 'GET',
          path: '/auth/me',
          summary: 'Get current user profile',
          auth: true
        },
        {
          method: 'PUT',
          path: '/auth/profile',
          summary: 'Update profile',
          auth: true,
          body: {
            name: { type: 'string', required: false },
            phone: { type: 'string', required: false },
            address: { type: 'object', required: false }
          }
        },
        {
          method: 'PUT',
          path: '/auth/password',
          summary: 'Change password',
          auth: true,
          body: {
            currentPassword: { type: 'string', required: true },
            newPassword: { type: 'string', required: true }
          }
        },
        {
          method: 'GET',
          path: '/auth/users',
          summary: 'Get all users',
          auth: 'Admin'
        }
      ]
    },

    // ==================== PRODUCTS ====================
    {
      category: 'Products',
      routes: [
        {
          method: 'GET',
          path: '/products',
          summary: 'Get all products with filters',
          auth: false,
          query: {
            category: { type: 'string', enum: ['pizza', 'drink', 'bread'] },
            vegetarian: { type: 'boolean' },
            spicy: { type: 'boolean' },
            inStock: { type: 'boolean' },
            search: { type: 'string', description: 'Text search' },
            sort: { type: 'string', default: '-createdAt' },
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 }
          }
        },
        {
          method: 'GET',
          path: '/products/menu',
          summary: 'Get menu grouped by category',
          auth: false,
          response: {
            success: true,
            data: {
              menu: {
                pizza: [],
                drink: [],
                bread: []
              }
            }
          }
        },
        {
          method: 'GET',
          path: '/products/:id',
          summary: 'Get single product',
          auth: false
        },
        {
          method: 'POST',
          path: '/products',
          summary: 'Create product',
          auth: 'Admin',
          body: {
            name: { type: 'string', required: true },
            description: { type: 'string' },
            category: { type: 'string', required: true, enum: ['pizza', 'drink', 'bread'] },
            price: { type: 'number', required: true },
            sizes: {
              type: 'object',
              example: {
                small: { price: 199, available: true },
                medium: { price: 299, available: true },
                large: { price: 399, available: true }
              }
            },
            image: { type: 'string' },
            ingredients: { type: 'array' },
            isVegetarian: { type: 'boolean', default: false },
            isSpicy: { type: 'boolean', default: false },
            inventory: { type: 'number', default: 100 }
          }
        },
        {
          method: 'PUT',
          path: '/products/:id',
          summary: 'Update product',
          auth: 'Admin'
        },
        {
          method: 'DELETE',
          path: '/products/:id',
          summary: 'Delete product (soft delete)',
          auth: 'Admin'
        },
        {
          method: 'PUT',
          path: '/products/:id/inventory',
          summary: 'Update inventory',
          auth: 'Admin',
          body: {
            action: { type: 'string', required: true, enum: ['add', 'subtract', 'set'] },
            quantity: { type: 'number', required: true }
          }
        },
        {
          method: 'GET',
          path: '/products/admin/all',
          summary: 'Get all products including unavailable',
          auth: 'Admin'
        },
        {
          method: 'GET',
          path: '/products/admin/low-stock',
          summary: 'Get low stock products',
          auth: 'Admin',
          query: {
            threshold: { type: 'number', default: 10 }
          }
        }
      ]
    },

    // ==================== CART ====================
    {
      category: 'Cart',
      routes: [
        {
          method: 'GET',
          path: '/cart',
          summary: 'Get current cart',
          auth: 'Optional (use x-session-id for guests)',
          response: {
            success: true,
            data: {
              cart: {
                items: [],
                subtotal: 0,
                tax: 0,
                total: 0
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/cart/items',
          summary: 'Add item to cart',
          auth: 'Optional',
          body: {
            productId: { type: 'string', required: true },
            quantity: { type: 'number', default: 1 },
            size: { type: 'string', default: 'medium', enum: ['small', 'medium', 'large', 'extra_large'] },
            customizations: { type: 'array', example: [{ name: 'Extra Cheese', price: 30 }] },
            notes: { type: 'string' }
          }
        },
        {
          method: 'PUT',
          path: '/cart/items/:itemId',
          summary: 'Update item quantity',
          auth: 'Optional',
          body: {
            quantity: { type: 'number', required: true }
          }
        },
        {
          method: 'DELETE',
          path: '/cart/items/:itemId',
          summary: 'Remove item from cart',
          auth: 'Optional'
        },
        {
          method: 'DELETE',
          path: '/cart',
          summary: 'Clear entire cart',
          auth: 'Optional'
        },
        {
          method: 'POST',
          path: '/cart/merge',
          summary: 'Merge guest cart into user cart (after login)',
          auth: true,
          body: {
            sessionId: { type: 'string', required: true }
          }
        }
      ]
    },

    // ==================== ORDERS ====================
    {
      category: 'Orders',
      routes: [
        {
          method: 'POST',
          path: '/orders',
          summary: 'Create order (checkout)',
          auth: 'Optional',
          body: {
            type: { type: 'string', required: true, enum: ['delivery', 'carryout'] },
            paymentMethod: { type: 'string', required: true, enum: ['cash', 'card', 'online'] },
            customerInfo: {
              type: 'object',
              required: true,
              example: { name: 'John', email: 'john@x.com', phone: '9876543210' }
            },
            deliveryAddress: {
              type: 'object',
              required: 'if type is delivery',
              example: { street: '123 Main St', city: 'Mumbai', state: 'MH', zipCode: '400001' }
            },
            couponCode: { type: 'string', required: false }
          },
          response: {
            success: true,
            data: {
              order: {
                orderNumber: 'ORD-20250114-0001',
                status: 'pending',
                total: 500
              }
            }
          }
        },
        {
          method: 'GET',
          path: '/orders/track/:orderNumber',
          summary: 'Track order by order number (public)',
          auth: false
        },
        {
          method: 'GET',
          path: '/orders/my-orders',
          summary: 'Get current user orders',
          auth: true,
          query: {
            status: { type: 'string' },
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        },
        {
          method: 'GET',
          path: '/orders/:id',
          summary: 'Get order by ID',
          auth: true
        },
        {
          method: 'PUT',
          path: '/orders/:id/cancel',
          summary: 'Cancel order',
          auth: true
        },
        {
          method: 'GET',
          path: '/orders',
          summary: 'Get all orders',
          auth: 'Admin',
          query: {
            status: { type: 'string' },
            type: { type: 'string' },
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        },
        {
          method: 'PUT',
          path: '/orders/:id/status',
          summary: 'Update order status',
          auth: 'Admin',
          body: {
            status: {
              type: 'string',
              required: true,
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
            }
          }
        },
        {
          method: 'GET',
          path: '/orders/admin/analytics',
          summary: 'Get order analytics',
          auth: 'Admin',
          query: {
            startDate: { type: 'date' },
            endDate: { type: 'date' }
          }
        }
      ]
    },

    // ==================== COUPONS ====================
    {
      category: 'Coupons',
      routes: [
        {
          method: 'POST',
          path: '/coupons/validate',
          summary: 'Validate coupon code',
          auth: 'Optional',
          body: {
            code: { type: 'string', required: true },
            subtotal: { type: 'number', required: true }
          },
          response: {
            success: true,
            data: {
              code: 'SAVE20',
              type: 'percentage',
              discount: 100
            }
          }
        },
        {
          method: 'GET',
          path: '/coupons',
          summary: 'Get all coupons',
          auth: 'Admin'
        },
        {
          method: 'GET',
          path: '/coupons/:id',
          summary: 'Get coupon details',
          auth: 'Admin'
        },
        {
          method: 'POST',
          path: '/coupons',
          summary: 'Create coupon',
          auth: 'Admin',
          body: {
            code: { type: 'string', required: true, example: 'SAVE20' },
            type: { type: 'string', required: true, enum: ['percentage', 'fixed'] },
            value: { type: 'number', required: true },
            minOrderAmount: { type: 'number', default: 0 },
            maxDiscount: { type: 'number', description: 'Cap for percentage coupons' },
            usageLimit: { type: 'number', description: 'Global limit, null = unlimited' },
            userUsageLimit: { type: 'number', default: 1 },
            validFrom: { type: 'date' },
            validUntil: { type: 'date', required: true },
            description: { type: 'string' }
          }
        },
        {
          method: 'PUT',
          path: '/coupons/:id',
          summary: 'Update coupon',
          auth: 'Admin'
        },
        {
          method: 'DELETE',
          path: '/coupons/:id',
          summary: 'Delete coupon',
          auth: 'Admin'
        },
        {
          method: 'PUT',
          path: '/coupons/:id/toggle',
          summary: 'Toggle coupon active status',
          auth: 'Admin'
        }
      ]
    }
  ],

  errorCodes: {
    400: 'Bad Request - Invalid input',
    401: 'Unauthorized - Invalid or missing token',
    403: 'Forbidden - Not authorized for this action',
    404: 'Not Found - Resource not found',
    500: 'Server Error'
  },

  responseFormat: {
    success: {
      success: true,
      statusCode: 200,
      message: 'Success message',
      data: {}
    },
    error: {
      success: false,
      message: 'Error message',
      errors: []
    }
  }
};

/**
 * Generate HTML documentation page
 */
const generateDocsHTML = (baseUrl) => {
  const methodColors = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    DELETE: '#f93e3e'
  };

  let endpointsHTML = '';

  apiDocs.endpoints.forEach(category => {
    endpointsHTML += `
      <div class="category">
        <h2>${category.category}</h2>
        ${category.routes.map(route => `
          <div class="endpoint">
            <div class="endpoint-header" onclick="this.parentElement.classList.toggle('expanded')">
              <span class="method" style="background: ${methodColors[route.method]}">${route.method}</span>
              <span class="path">${route.path}</span>
              <span class="summary">${route.summary}</span>
              <span class="auth-badge ${route.auth === false ? 'public' : route.auth === 'Admin' ? 'admin' : 'auth'}">
                ${route.auth === false ? 'Public' : route.auth === 'Admin' ? 'Admin' : route.auth === true ? 'Auth' : route.auth}
              </span>
            </div>
            <div class="endpoint-body">
              ${route.query ? `
                <div class="section">
                  <h4>Query Parameters</h4>
                  <table>
                    <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
                    ${Object.entries(route.query).map(([key, val]) => `
                      <tr>
                        <td><code>${key}</code></td>
                        <td>${val.type}${val.enum ? ` (${val.enum.join(', ')})` : ''}</td>
                        <td>${val.default || '-'}</td>
                        <td>${val.description || ''}</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
              ` : ''}
              ${route.body ? `
                <div class="section">
                  <h4>Request Body</h4>
                  <table>
                    <tr><th>Field</th><th>Type</th><th>Required</th><th>Details</th></tr>
                    ${Object.entries(route.body).map(([key, val]) => `
                      <tr>
                        <td><code>${key}</code></td>
                        <td>${val.type}${val.enum ? ` (${val.enum.join(', ')})` : ''}</td>
                        <td>${val.required ? '✓' : ''}</td>
                        <td>${val.example ? `Example: <code>${JSON.stringify(val.example)}</code>` : ''}${val.description || ''}</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
              ` : ''}
              ${route.response ? `
                <div class="section">
                  <h4>Response Example</h4>
                  <pre>${JSON.stringify(route.response, null, 2)}</pre>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrewPlus API Documentation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      color: #3b4151;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }

    header {
      background: linear-gradient(135deg, #e63946 0%, #1d3557 100%);
      color: white;
      padding: 40px 20px;
      margin-bottom: 30px;
    }
    header h1 { font-size: 2.5em; margin-bottom: 10px; }
    header p { opacity: 0.9; }

    .info-box {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .info-box h3 { color: #1d3557; margin-bottom: 10px; }
    .info-box code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .category { margin-bottom: 30px; }
    .category h2 {
      background: #1d3557;
      color: white;
      padding: 15px 20px;
      border-radius: 8px 8px 0 0;
      font-size: 1.3em;
    }

    .endpoint {
      background: white;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .endpoint:last-child { border-radius: 0 0 8px 8px; }

    .endpoint-header {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      cursor: pointer;
      gap: 15px;
    }
    .endpoint-header:hover { background: #f8f8f8; }

    .method {
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.8em;
      min-width: 70px;
      text-align: center;
    }

    .path {
      font-family: monospace;
      font-weight: 600;
      color: #3b4151;
    }

    .summary {
      color: #666;
      flex: 1;
    }

    .auth-badge {
      font-size: 0.75em;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .auth-badge.public { background: #e8f5e9; color: #2e7d32; }
    .auth-badge.auth { background: #fff3e0; color: #ef6c00; }
    .auth-badge.admin { background: #ffebee; color: #c62828; }

    .endpoint-body {
      display: none;
      padding: 20px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
    }
    .endpoint.expanded .endpoint-body { display: block; }

    .section { margin-bottom: 20px; }
    .section h4 {
      color: #1d3557;
      margin-bottom: 10px;
      font-size: 0.95em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
    }
    th, td {
      text-align: left;
      padding: 10px;
      border: 1px solid #e0e0e0;
    }
    th { background: #f5f5f5; }

    pre {
      background: #263238;
      color: #aed581;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.85em;
    }

    .test-section {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .test-section h3 { margin-bottom: 15px; color: #1d3557; }
    .test-section code { display: block; margin: 5px 0; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>🍕 CrewPlus API</h1>
      <p>Version ${apiDocs.info.version} | Pizza Ordering System REST API</p>
    </div>
  </header>

  <div class="container">
    <div class="info-box">
      <h3>🔐 Authentication</h3>
      <p><strong>Type:</strong> ${apiDocs.authentication.type}</p>
      <p><strong>Header:</strong> <code>${apiDocs.authentication.example}</code></p>
      <p style="margin-top: 10px;"><strong>Guest Sessions:</strong> For cart/orders without login</p>
      <p><strong>Header:</strong> <code>${apiDocs.authentication.guestSession.example}</code></p>
    </div>

    <div class="info-box">
      <h3>📋 Response Format</h3>
      <pre>${JSON.stringify(apiDocs.responseFormat.success, null, 2)}</pre>
    </div>

    ${endpointsHTML}

    <div class="test-section">
      <h3>🧪 Quick Test</h3>
      <p>Test accounts (after running <code>npm run seed</code>):</p>
      <code>Admin: admin@crewplus.com / admin123</code>
      <code>User: john@example.com / john123</code>
      <p style="margin-top: 15px;">Sample cURL:</p>
      <pre>curl ${baseUrl}/products/menu</pre>
    </div>
  </div>

  <script>
    // Allow clicking anywhere on header to expand
    document.querySelectorAll('.endpoint-header').forEach(el => {
      el.addEventListener('click', () => {
        el.parentElement.classList.toggle('expanded');
      });
    });
  </script>
</body>
</html>
  `;
};

module.exports = { apiDocs, generateDocsHTML };
