// MongoDB initialization script
// Creates the crewplus database and sets up initial user

db = db.getSiblingDB('crewplus');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('carts');
db.createCollection('orders');
db.createCollection('coupons');

print('CrewPlus database initialized successfully');
