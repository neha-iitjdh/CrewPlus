/**
 * User Model
 *
 * Mongoose Schema defines:
 * - Fields and their types
 * - Validation rules
 * - Default values
 * - Methods (functions on documents)
 * - Hooks (code that runs before/after events)
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true, // Removes whitespace from both ends
      minlength: [2, 'Name must be at least 2 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // No duplicate emails
      lowercase: true, // Convert to lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't include password in queries by default
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits']
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER
    },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

/**
 * Pre-save Hook
 *
 * Runs BEFORE the document is saved to database.
 * We use it to hash the password.
 *
 * Why hash passwords?
 * - If database is breached, hackers can't see real passwords
 * - bcrypt adds "salt" (random data) making each hash unique
 * - Even same password = different hash
 */
userSchema.pre('save', async function () {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return; // In Mongoose v9+, just return (no next callback needed for async hooks)
  }

  // Generate salt (random string added to password)
  const salt = await bcrypt.genSalt(10);

  // Hash password with salt
  this.password = await bcrypt.hash(this.password, salt);
  // Mongoose v9+ automatically handles async hooks - no next() needed
});

/**
 * Instance Method: comparePassword
 *
 * Compares entered password with hashed password in database.
 * Used during login.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance Method: toPublicJSON
 *
 * Returns user data without sensitive fields.
 * Used when sending user data to frontend.
 */
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    address: this.address,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
