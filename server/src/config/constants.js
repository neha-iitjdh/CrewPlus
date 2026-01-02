/**
 * Application Constants
 *
 * Why constants?
 * - Single source of truth
 * - Easy to change values
 * - Prevents typos (use ROLES.ADMIN instead of 'admin')
 */

const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN'
};

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const CATEGORIES = {
  PIZZA: 'pizza',
  DRINK: 'drink',
  BREAD: 'bread'
};

const SIZES = ['small', 'medium', 'large', 'extra_large'];

const TAX_RATE = 0.10; // 10%
const DELIVERY_FEE = 50; // ₹50

module.exports = {
  ROLES,
  ORDER_STATUS,
  CATEGORIES,
  SIZES,
  TAX_RATE,
  DELIVERY_FEE
};
