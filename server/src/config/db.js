/**
 * MongoDB Connection
 *
 * Mongoose is an ODM (Object Document Mapper)
 * - Defines schemas (structure) for documents
 * - Provides validation
 * - Makes queries easier
 *
 * MongoDB stores data as "documents" (like JSON objects)
 * Documents are grouped into "collections" (like tables)
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
