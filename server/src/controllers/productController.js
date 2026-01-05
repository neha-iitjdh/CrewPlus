/**
 * Product Controller
 *
 * CRUD Operations:
 * - Create: Add new product (Admin)
 * - Read: Get products, single product, menu
 * - Update: Modify product, inventory (Admin)
 * - Delete: Soft delete - mark unavailable (Admin)
 */
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all products with filtering
 * @route   GET /api/products
 * @access  Public
 *
 * Query params:
 * - category: filter by category
 * - vegetarian: true/false
 * - spicy: true/false
 * - inStock: true/false
 * - search: text search
 * - sort: field to sort by
 * - page, limit: pagination
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    vegetarian,
    spicy,
    inStock,
    search,
    sort = '-createdAt',
    page = 1,
    limit = 20
  } = req.query;

  // Build query object
  const query = { isAvailable: true };

  if (category) {
    query.category = category;
  }

  if (vegetarian === 'true') {
    query.isVegetarian = true;
  }

  if (spicy === 'true') {
    query.isSpicy = true;
  }

  if (inStock === 'true') {
    query.inventory = { $gt: 0 };
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Product.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  );
});

/**
 * @desc    Get menu grouped by category
 * @route   GET /api/products/menu
 * @access  Public
 *
 * Returns products organized by category:
 * {
 *   pizza: [...],
 *   drink: [...],
 *   bread: [...]
 * }
 */
const getMenu = asyncHandler(async (req, res) => {
  // Aggregation pipeline - powerful MongoDB feature
  const menu = await Product.aggregate([
    // Stage 1: Filter available products with stock
    {
      $match: {
        isAvailable: true,
        inventory: { $gt: 0 }
      }
    },
    // Stage 2: Sort by name within each category
    {
      $sort: { name: 1 }
    },
    // Stage 3: Group by category
    {
      $group: {
        _id: '$category',
        products: { $push: '$$ROOT' } // $$ROOT = entire document
      }
    }
  ]);

  // Transform array to object
  const menuObject = {};
  menu.forEach(item => {
    menuObject[item._id] = item.products;
  });

  res.json(new ApiResponse(200, { menu: menuObject }));
});

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json(new ApiResponse(200, { product }));
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json(
    new ApiResponse(201, { product }, 'Product created successfully')
  );
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Update with new data
  product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true, // Return updated document
      runValidators: true // Run schema validators
    }
  );

  res.json(new ApiResponse(200, { product }, 'Product updated'));
});

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 *
 * We don't actually delete - just mark unavailable.
 * This preserves order history references.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Soft delete
  product.isAvailable = false;
  await product.save();

  res.json(new ApiResponse(200, null, 'Product removed from menu'));
});

/**
 * @desc    Update inventory
 * @route   PUT /api/products/:id/inventory
 * @access  Private/Admin
 *
 * Body: { action: 'add' | 'subtract' | 'set', quantity: number }
 */
const updateInventory = asyncHandler(async (req, res) => {
  const { action, quantity } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (!quantity || quantity < 0) {
    throw new ApiError(400, 'Valid quantity is required');
  }

  switch (action) {
    case 'add':
      product.inventory += quantity;
      break;
    case 'subtract':
      if (product.inventory < quantity) {
        throw new ApiError(400, 'Cannot subtract more than available');
      }
      product.inventory -= quantity;
      break;
    case 'set':
      product.inventory = quantity;
      break;
    default:
      throw new ApiError(400, 'Action must be add, subtract, or set');
  }

  await product.save();

  res.json(
    new ApiResponse(200, {
      product: {
        _id: product._id,
        name: product.name,
        inventory: product.inventory
      }
    }, 'Inventory updated')
  );
});

/**
 * @desc    Get all products including unavailable (Admin)
 * @route   GET /api/products/admin/all
 * @access  Private/Admin
 */
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const products = await Product.find().sort('-createdAt');

  res.json(new ApiResponse(200, { products, count: products.length }));
});

/**
 * @desc    Get low stock products
 * @route   GET /api/products/admin/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;

  const products = await Product.find({
    isAvailable: true,
    inventory: { $lte: threshold }
  }).sort('inventory');

  res.json(
    new ApiResponse(200, {
      products,
      count: products.length,
      threshold
    })
  );
});

module.exports = {
  getProducts,
  getMenu,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  getAllProductsAdmin,
  getLowStockProducts
};
