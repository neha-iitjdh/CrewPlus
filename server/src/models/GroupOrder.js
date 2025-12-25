const mongoose = require('mongoose');

const participantItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
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
  customizations: [{
    customization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customization'
    },
    name: String,
    price: Number
  }],
  customizationTotal: {
    type: Number,
    default: 0
  },
  notes: String
});

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: String,
  name: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  items: [participantItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isReady: {
    type: Boolean,
    default: false
  }
});

const groupOrderSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Group Order'
  },
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
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  orderPlaced: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  maxParticipants: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

// Indexes
groupOrderSchema.index({ code: 1 });
groupOrderSchema.index({ host: 1 });
groupOrderSchema.index({ status: 1 });
groupOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate unique code
groupOrderSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Calculate totals before saving
groupOrderSchema.pre('save', function(next) {
  // Calculate each participant's subtotal
  this.participants.forEach(participant => {
    participant.subtotal = participant.items.reduce((sum, item) => {
      return sum + (item.price + (item.customizationTotal || 0)) * item.quantity;
    }, 0);
  });

  // Calculate group totals
  this.subtotal = this.participants.reduce((sum, p) => sum + p.subtotal, 0);
  this.tax = Math.round(this.subtotal * 0.10 * 100) / 100;
  this.total = Math.round((this.subtotal + this.tax) * 100) / 100;

  next();
});

// Get participant by user or session
groupOrderSchema.methods.getParticipant = function(userId, sessionId) {
  return this.participants.find(p =>
    (userId && p.user && p.user.toString() === userId.toString()) ||
    (sessionId && p.sessionId === sessionId)
  );
};

// Add participant
groupOrderSchema.methods.addParticipant = function(participantData) {
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Group is full');
  }

  const existing = this.getParticipant(participantData.user, participantData.sessionId);
  if (existing) {
    throw new Error('Already in this group');
  }

  this.participants.push(participantData);
  return this.save();
};

// Remove participant
groupOrderSchema.methods.removeParticipant = function(userId, sessionId) {
  const index = this.participants.findIndex(p =>
    (userId && p.user && p.user.toString() === userId.toString()) ||
    (sessionId && p.sessionId === sessionId)
  );

  if (index === -1) {
    throw new Error('Participant not found');
  }

  if (this.participants[index].isHost) {
    throw new Error('Host cannot leave the group');
  }

  this.participants.splice(index, 1);
  return this.save();
};

// Calculate split amounts
groupOrderSchema.methods.calculateSplit = function() {
  const splits = [];
  const participantCount = this.participants.length;

  if (this.splitType === 'equal') {
    const equalShare = Math.round((this.total / participantCount) * 100) / 100;
    this.participants.forEach(p => {
      splits.push({
        participantId: p._id,
        name: p.name,
        amount: equalShare,
        items: p.items
      });
    });
  } else if (this.splitType === 'by_item') {
    const taxRate = this.subtotal > 0 ? this.tax / this.subtotal : 0;
    this.participants.forEach(p => {
      const itemTotal = p.subtotal;
      const itemTax = Math.round(itemTotal * taxRate * 100) / 100;
      splits.push({
        participantId: p._id,
        name: p.name,
        amount: Math.round((itemTotal + itemTax) * 100) / 100,
        items: p.items
      });
    });
  }

  return splits;
};

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
