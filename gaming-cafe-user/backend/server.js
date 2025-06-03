const express = require('express');
const axios = require('axios');
const cors = require('cors');
const QRCode = require('qrcode');
require('dotenv').config();
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug logging for environment variables
console.log('🔍 Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 Port from env:', process.env.PORT);

// MongoDB connection with better logging - UPDATED for consistency and Cloudflare Tunnel support
const mongoURL = process.env.MONGODB_URI || 'mongodb://e2425-wads-l4bcg4:ciwrot6o@localhost:27018/e2425-wads-l4bcg4?authSource=e2425-wads-l4bcg4';
console.log('🔍 Attempting to connect to MongoDB with URL:', mongoURL.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

// Enhanced MongoDB connection options for production
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  monitorCommands: process.env.NODE_ENV === 'development'
};

mongoose.connect(mongoURL, mongoOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Connection URL:', mongoURL.replace(/:[^:@]*@/, ':***@'));
    console.error('Full error:', err);
    
    // Retry connection after 5 seconds
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection...');
      mongoose.connect(mongoURL, mongoOptions);
    }, 5000);
  });


// 1. Enhanced User Schema with gaming cafe features
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  phoneNumber: { type: String },
  
  // Gaming Cafe Specific Fields
  gamingQuotaMinutes: { type: Number, default: 30 }, // Free 30 minutes for new users
  sessionUsedMinutes: { type: Number, default: 0 }, // Current session usage
  totalSpent: { type: Number, default: 0 }, // Total money spent
  membershipLevel: { 
    type: String, 
    enum: ['bronze', 'silver', 'gold', 'platinum'], 
    default: 'bronze' 
  },
  loyaltyPoints: { type: Number, default: 0 },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  currentStation: { type: String }, // PC station number if currently gaming
  
  // Preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    favoriteGames: [String],
    dietaryRestrictions: [String] // For food orders
  },
  
  // Timestamps
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

// 2. Reports Schema - For user issue reporting
const reportSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true }, // Custom report ID
  
  // User Information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  
  // Report Details
  category: { 
    type: String, 
    required: true,
    enum: ['technical', 'food', 'environment', 'billing', 'other']
  },
  priority: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high']
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  station: { type: String }, // Gaming station number
  
  // Status Management
  status: { 
    type: String, 
    enum: ['pending', 'investigating', 'resolved', 'escalated', 'closed'],
    default: 'pending'
  },
  
  // Admin Response
  response: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  resolvedAt: Date,
  
  // Attachments (file paths/URLs)
  attachments: [String],
  
  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 3. Menu Items Schema - For food and beverages
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['snacks', 'meals', 'drinks', 'desserts', 'specials']
  },
  
  // Inventory Management
  stock: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: true },
  
  // Item Details
  image: { type: String }, // Emoji or image URL
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  // Timing
  preparationTime: { type: Number }, // Minutes
  isSpicy: { type: Boolean, default: false },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  
  // Admin fields
  cost: { type: Number }, // Cost price for admin
  popularityScore: { type: Number, default: 0 },
  
  // Timestamps
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

// 4. Orders Schema - For food orders and gaming time purchases
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  
  // Customer Information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  
  // Order Details
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    minutes: { type: Number }, // For gaming time purchases
    description: String
  }],
  
  totalAmount: { type: Number, required: true },
  checkoutType: { 
    type: String, 
    enum: ['food', 'quota'], 
    required: true 
  },
  
  // Order Status
  orderStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Payment Information
  paymentMethod: { 
    type: String, 
    enum: ['credit-card', 'qris', 'cash'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'awaiting_payment', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Payment Integration IDs
  stripePaymentIntentId: String,
  qrisTransactionId: String,
  qrisPaidAmount: Number,
  qrisPaidAt: Date,
  
  // Station and Delivery
  deliveryStation: String, // Gaming station for delivery
  specialInstructions: String,
  
  // Timestamps
  orderedAt: { type: Date, default: Date.now },
  paidAt: Date,
  completedAt: Date,
  failureReason: String
});

// 5. Gaming Sessions Schema - Track user gaming time
const gamingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationNumber: { type: String, required: true },
  
  // Session Details
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  totalMinutes: { type: Number, default: 0 },
  
  // Session Status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'terminated'],
    default: 'active'
  },
  
  // Cost and Payment
  hourlyRate: { type: Number, default: 20000 }, // Rate at time of session
  totalCost: { type: Number, default: 0 },
  paymentMethod: String,
  
  // Games Played (optional tracking)
  gamesPlayed: [String],
  
  // Notes
  notes: String,
  terminationReason: String,
  
  // Timestamps
  created: { type: Date, default: Date.now }
});

// 6. Gaming Stations Schema - Track station availability
const gamingStationSchema = new mongoose.Schema({
  stationNumber: { type: String, required: true, unique: true },
  stationName: { type: String, required: true },
  
  // Hardware Specs
  specs: {
    cpu: String,
    gpu: String,
    ram: String,
    storage: String,
    monitor: String,
    peripherals: [String]
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance', 'out-of-order'],
    default: 'available'
  },
  
  // Current User
  currentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GamingSession' },
  
  // Pricing
  hourlyRate: { type: Number, default: 20000 },
  isPremium: { type: Boolean, default: false },
  
  // Maintenance
  lastMaintenance: Date,
  maintenanceNotes: String,
  
  // Location in cafe
  zone: { type: String, enum: ['standard', 'vip', 'tournament'], default: 'standard' },
  
  // Timestamps
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

// 7. Admin Users Schema - For admin panel access
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  fullName: { type: String, required: true },
  
  // Admin Role
  role: { 
    type: String, 
    enum: ['super-admin', 'manager', 'staff', 'tech-support'],
    default: 'staff'
  },
  
  // Permissions
  permissions: {
    manageUsers: { type: Boolean, default: false },
    manageStations: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: false },
    manageInventory: { type: Boolean, default: false },
    manageReports: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: false },
    systemSettings: { type: Boolean, default: false }
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
  // Timestamps
  created: { type: Date, default: Date.now }
});

// 8. System Settings Schema - For cafe configuration
const systemSettingsSchema = new mongoose.Schema({
  settingKey: { type: String, required: true, unique: true },
  settingValue: mongoose.Schema.Types.Mixed,
  description: String,
  category: { 
    type: String, 
    enum: ['pricing', 'general', 'payment', 'notifications', 'features'],
    default: 'general'
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updated: { type: Date, default: Date.now }
});

// Existing payment schemas
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  amount: Number,
  currency: String,
  description: String,
  metadata: Object,
  status: String,
  created: { type: Date, default: Date.now }
});

const qrisSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  orderId: String,
  amount: Number,
  customerName: String,
  qrisString: String,
  qrisImageUrl: String,
  status: String,
  expiryTime: Date,
  paidAt: Date,
  paidAmount: Number,
  created: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Report = mongoose.model('Report', reportSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);
const GamingSession = mongoose.model('GamingSession', gamingSessionSchema);
const GamingStation = mongoose.model('GamingStation', gamingStationSchema);
const Admin = mongoose.model('Admin', adminSchema);
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const QrisPayment = mongoose.model('QrisPayment', qrisSchema);

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://yourdomain.com',           
    'https://www.yourdomain.com',       
    'https://admin.yourdomain.com',     
    'https://api.yourdomain.com'        
  ], 
  credentials: true
}));
app.use(express.json());

// In-memory storage for demo purposes (keeping some for compatibility)
const paymentStorage = new Map();
const qrisStorage = new Map();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;
    
    console.log('Registration attempt:', { fullName, email, phoneNumber });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      gamingQuotaMinutes: 30, // Welcome bonus
      loyaltyPoints: 100 // Welcome bonus
    });
    
    await newUser.save();
    console.log('User registered successfully:', email);
    
    res.json({ 
      success: true, 
      message: 'Registration successful! You can now log in. Welcome bonus: 30 minutes free gaming time!',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        gamingQuotaMinutes: newUser.gamingQuotaMinutes
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token (optional for session management)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Login successful:', email);
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gamingQuotaMinutes: user.gamingQuotaMinutes,
        sessionUsedMinutes: user.sessionUsedMinutes,
        totalSpent: user.totalSpent,
        membershipLevel: user.membershipLevel,
        loyaltyPoints: user.loyaltyPoints,
        lastLogin: user.lastLogin,
        created: user.created
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const reportId = `RPT${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    const report = new Report({
      id: reportId,
      ...req.body,
      submittedAt: new Date()
    });
    
    await report.save();
    console.log('Report saved:', reportId);
    
    res.json({ 
      success: true, 
      message: 'Report submitted successfully',
      report: {
        id: reportId,
        submittedAt: report.submittedAt.toLocaleDateString()
      }
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit report' });
  }
});

app.get('/api/reports/user/:email', async (req, res) => {
  try {
    const userEmail = decodeURIComponent(req.params.email);
    const reports = await Report.find({ userEmail }).sort({ submittedAt: -1 });
    
    const formattedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      category: report.category,
      priority: report.priority,
      status: report.status,
      station: report.station,
      response: report.response,
      submittedAt: report.submittedAt.toLocaleDateString()
    }));
    
    res.json({ success: true, reports: formattedReports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

app.get('/api/menu-items', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, menuItems });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
  }
});

app.patch('/api/menu-items/update-stock', authenticateToken, async (req, res) => {
  try {
    const { orderItems } = req.body;
    
    for (const item of orderItems) {
      if (item.itemId) {
        await MenuItem.findByIdAndUpdate(
          item.itemId,
          { $inc: { stock: -item.quantity } }
        );
      }
    }
    
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, error: 'Failed to update stock' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    
    console.log('Order saved:', req.body.orderId);
    res.json({ success: true, order: { id: order.orderId } });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, error: 'Failed to save order' });
  }
});

app.patch('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { $set: req.body },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});


app.get('/api/users/:userId/quota', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      gamingQuotaMinutes: user.gamingQuotaMinutes,
      sessionUsedMinutes: user.sessionUsedMinutes
    });
  } catch (error) {
    console.error('Error fetching user quota:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quota' });
  }
});

app.patch('/api/users/:userId/quota', authenticateToken, async (req, res) => {
  try {
    const { quotaMinutes, action, purchaseAmount } = req.body;
    
    let updateQuery;
    if (action === 'add') {
      // Adding quota - increment the total, keep session usage, ADD TO TOTAL SPENT
      updateQuery = { 
        $inc: { 
          gamingQuotaMinutes: quotaMinutes,
          totalSpent: purchaseAmount || 0
        },
        $set: { updated: new Date() }
      };
    } else if (action === 'reset') {
      // Reset session - keep total quota, reset session usage
      updateQuery = { 
        $set: { 
          sessionUsedMinutes: 0,
          lastTimerUpdate: new Date(),
          updated: new Date()
        }
      };
    } else {
      // Set quota - replace total quota, optionally reset session
      updateQuery = { 
        $set: { 
          gamingQuotaMinutes: quotaMinutes,
          updated: new Date()
        }
      };
      if (req.body.resetSession) {
        updateQuery.$set.sessionUsedMinutes = 0;
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateQuery,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Calculate remaining time
    const remainingMinutes = Math.max(0, user.gamingQuotaMinutes - user.sessionUsedMinutes);
    
    console.log('Quota updated:', {
      total: user.gamingQuotaMinutes,
      used: user.sessionUsedMinutes,
      remaining: remainingMinutes,
      totalSpent: user.totalSpent,
      action: action
    });
    
    res.json({ 
      success: true, 
      gamingQuotaMinutes: user.gamingQuotaMinutes,
      sessionUsedMinutes: user.sessionUsedMinutes,
      remainingMinutes: remainingMinutes,
      totalSpent: user.totalSpent,
      action: action
    });
    
  } catch (error) {
    console.error('Error updating user quota:', error);
    res.status(500).json({ success: false, error: 'Failed to update quota' });
  }
});

app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user data' });
  }
});

app.patch('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 
        fullName, 
        email, 
        phoneNumber,
        updated: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

app.patch('/api/users/:userId/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.updated = new Date();
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Also delete related data
    await Report.deleteMany({ userId: req.params.userId });
    await Order.deleteMany({ userId: req.params.userId });
    await GamingSession.deleteMany({ userId: req.params.userId });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

// Mock player counts (since I don't have proper key)
const getMockPlayerCounts = () => ({
  'Counter Strike 2': (894000 + Math.floor(Math.random() * 10000)).toLocaleString(),
  'Valorant': (247000 + Math.floor(Math.random() * 50000)).toLocaleString(),
  'Fortnite': (354000 + Math.floor(Math.random() * 100000)).toLocaleString(),
  'League of Legends': (365000 + Math.floor(Math.random() * 50000)).toLocaleString(),
  'Apex Legends': (231000 + Math.floor(Math.random() * 30000)).toLocaleString(),
  'Call of Duty': (243000 + Math.floor(Math.random() * 50000)).toLocaleString(),
  'Overwatch': (178000 + Math.floor(Math.random() * 25000)).toLocaleString(),
  'Minecraft': (142000 + Math.floor(Math.random() * 30000)).toLocaleString(),
  'FIFA': (134000 + Math.floor(Math.random() * 20000)).toLocaleString(),
  'Marvel Rivals': (132000 + Math.floor(Math.random() * 25000)).toLocaleString(),
  'Rainbow Six Siege': (125000 + Math.floor(Math.random() * 15000)).toLocaleString(),
  'PUBG': (118000 + Math.floor(Math.random() * 15000)).toLocaleString(),
  'Rocket League': (95000 + Math.floor(Math.random() * 10000)).toLocaleString(),
  'Destiny 2': (85000 + Math.floor(Math.random() * 10000)).toLocaleString(),
  'Battlefield': (76000 + Math.floor(Math.random() * 8000)).toLocaleString(),
});

// Endpoint to get player counts
app.get('/api/player-counts', async (req, res) => {
  try {
    console.log('Fetching player counts...');
    
    // For now, use mock data
    const playerCounts = getMockPlayerCounts();
    
    console.log('Player counts fetched successfully');
    res.json(playerCounts);
    
  } catch (error) {
    console.error('Error in player counts endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch player counts' });
  }
});

// Create a payment intent endpoint (mock version)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'idr', description, metadata } = req.body;
    
    console.log('Creating payment intent:', { amount, currency, description });
    
    // Mock payment intent
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_mock`;
    
    // Store payment intent in MongoDB
    const payment = new Payment({
      paymentId: paymentIntentId,
      amount,
      currency,
      description,
      metadata,
      status: 'requires_payment_method'
    });
    
    await payment.save();
    console.log('Payment intent created and saved to DB:', paymentIntentId);
    
    res.json({
      clientSecret,
      id: paymentIntentId,
      status: 'requires_payment_method'
    });
    
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
});

// Payment verification endpoint (mock version)
app.get('/api/verify-payment/:paymentId', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    console.log('Verifying payment:', paymentId);
    
    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Simulate successful payment
    payment.status = 'succeeded';
    await payment.save();
    
    res.json({
      status: 'succeeded', // Always succeed for demo
      amount: payment.amount,
      currency: payment.currency,
      metadata: payment.metadata
    });
    
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a QRIS payment endpoint (mock version)
app.post('/api/create-qris-payment', async (req, res) => {
  try {
    const { amount, orderId, customerName, expiryMinutes = 15 } = req.body;
    
    console.log('Creating QRIS payment:', { amount, orderId, customerName });
    
    // Generate transaction ID
    const transactionId = `qris_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Create mock QR code
    const mockQrString = `https://mock-qris.example.com/pay?amount=${amount}&tx=${transactionId}&order=${orderId}`;
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(mockQrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const expiryTime = new Date(Date.now() + expiryMinutes * 60000);
      
      // Store QRIS payment data in MongoDB
      const qrisPayment = new QrisPayment({
        transactionId,
        orderId,
        amount,
        customerName,
        qrisString: mockQrString,
        qrisImageUrl: qrCodeDataUrl,
        status: 'PENDING',
        expiryTime
      });
      
      await qrisPayment.save();
      console.log('QRIS payment created and saved to DB:', transactionId);
      
      res.json({
        success: true,
        transactionId,
        qrisString: mockQrString,
        qrisImageUrl: qrCodeDataUrl,
        amount,
        expiryTime,
        status: 'PENDING'
      });
      
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
      res.status(500).json({ success: false, error: 'QR code generation failed' });
    }
    
  } catch (err) {
    console.error('Error creating QRIS payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check QRIS payment status endpoint (mock version)
app.get('/api/check-qris-status/:transactionId', async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    console.log('Checking QRIS status:', transactionId);
    
    const qrisPayment = await QrisPayment.findOne({ transactionId });
    
    if (!qrisPayment) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    // Check if expired
    const now = new Date();
    const expiry = new Date(qrisPayment.expiryTime);
    
    if (now > expiry && qrisPayment.status === 'PENDING') {
      qrisPayment.status = 'EXPIRED';
      await qrisPayment.save();
    }
    
    // Simulate random payment completion for demo (30% chance each check)
    if (qrisPayment.status === 'PENDING' && Math.random() < 0.3) {
      qrisPayment.status = 'COMPLETED';
      qrisPayment.paidAt = new Date();
      qrisPayment.paidAmount = qrisPayment.amount;
      await qrisPayment.save();
      console.log('QRIS payment completed (simulated):', transactionId);
    }
    
    res.json({
      success: true,
      transactionId,
      status: qrisPayment.status,
      paidAmount: qrisPayment.paidAmount || 0,
      paidAt: qrisPayment.paidAt || null
    });
    
  } catch (err) {
    console.error('Error checking QRIS payment status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manually complete QRIS payment 
app.post('/api/complete-qris/:transactionId', async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const qrisPayment = await QrisPayment.findOne({ transactionId });
    
    if (!qrisPayment) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    qrisPayment.status = 'COMPLETED';
    qrisPayment.paidAt = new Date();
    qrisPayment.paidAmount = qrisPayment.amount;
    await qrisPayment.save();
    
    console.log('QRIS payment manually completed:', transactionId);
    
    res.json({ success: true, message: 'Payment completed' });
  } catch (err) {
    console.error('Error completing QRIS payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Launch game executable
app.post('/api/launch-game', async (req, res) => {
  try {
    const { gameName, executablePath } = req.body;
    
    console.log(`🎮 Attempting to launch ${gameName} at: ${executablePath}`);
    
    // Check if executable exists
    if (!fs.existsSync(executablePath)) {
      console.error(`❌ Game executable not found: ${executablePath}`);
      return res.status(404).json({
        success: false,
        error: 'Game executable not found',
        message: `Could not find ${gameName} at ${executablePath}. Please check if the game is installed.`
      });
    }
    
    try {
      const gameProcess = spawn(executablePath, [], {
        detached: true,
        stdio: 'ignore'
      });
      
      // Don't wait for the game to close
      gameProcess.unref();
      
      console.log(`✅ ${gameName} launched successfully with PID: ${gameProcess.pid}`);
      
      return res.json({
        success: true,
        message: `${gameName} launched successfully`,
        pid: gameProcess.pid,
        method: 'spawn'
      });
      
    } catch (spawnError) {
      console.warn(`Spawn failed for ${gameName}, trying alternative method:`, spawnError.message);
      
      exec(`start "" "${executablePath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`System command launch failed for ${gameName}:`, error);
          return res.status(500).json({
            success: false,
            error: 'Failed to launch game',
            message: `Could not launch ${gameName}: ${error.message}`
          });
        }
        
        console.log(`${gameName} launched via system command`);
        res.json({
          success: true,
          message: `${gameName} launched successfully`,
          method: 'system_command'
        });
      });
    }
    
  } catch (error) {
    console.error(`Game launch error for ${req.body.gameName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to launch game',
      message: error.message
    });
  }
});

// Get list of running game processes 
app.get('/api/running-games', (req, res) => {
  try {
    exec('tasklist /fo csv | findstr /i "game\\|steam\\|epic\\|origin\\|battle"', (error, stdout, stderr) => {
      if (error) {
        return res.json({ runningGames: [] });
      }
      
      const processes = stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, pid] = line.split(',').map(item => item.replace(/"/g, ''));
          return { name, pid };
        });
      
      res.json({ runningGames: processes });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get running games' });
  }
});

// Function to seed default menu items
async function seedDefaultMenuItems() {
  try {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default menu items...');
      
      const defaultMenuItems = [
        { name: "Chicken Wings", price: 45000, category: "snacks", description: "6 pieces of spicy or BBQ wings", image: "🍗", stock: 50, isAvailable: true, preparationTime: 15 },
        { name: "French Fries", price: 25000, category: "snacks", description: "Crispy fries with dipping sauce", image: "🍟", stock: 30, isAvailable: true, preparationTime: 8 },
        { name: "Nachos", price: 35000, category: "snacks", description: "Tortilla chips with cheese and salsa", image: "🧀", stock: 25, isAvailable: true, preparationTime: 10 },
        { name: "Cheeseburger", price: 55000, category: "meals", description: "Beef patty with cheese and veggies", image: "🍔", stock: 20, isAvailable: true, preparationTime: 20 },
        { name: "Pizza Slice", price: 40000, category: "meals", description: "Large pepperoni pizza slice", image: "🍕", stock: 15, isAvailable: true, preparationTime: 12 },
        { name: "Chicken Sandwich", price: 50000, category: "meals", description: "Grilled chicken with lettuce and mayo", image: "🥪", stock: 18, isAvailable: true, preparationTime: 15 },
        { name: "Fried Rice", price: 45000, category: "meals", description: "Indonesian style fried rice", image: "🍚", stock: 22, isAvailable: true, preparationTime: 18 },
        { name: "Soda", price: 15000, category: "drinks", description: "Various flavors available", image: "🥤", stock: 100, isAvailable: true, preparationTime: 2 },
        { name: "Coffee", price: 25000, category: "drinks", description: "Hot or iced coffee", image: "☕", stock: 40, isAvailable: true, preparationTime: 5 },
        { name: "Energy Drink", price: 30000, category: "drinks", description: "Stay energized while gaming", image: "⚡", stock: 35, isAvailable: true, preparationTime: 2 },
        { name: "Ice Cream", price: 20000, category: "desserts", description: "Chocolate or vanilla", image: "🍦", stock: 25, isAvailable: true, preparationTime: 5 },
        { name: "Brownie", price: 25000, category: "desserts", description: "Rich chocolate brownie", image: "🍫", stock: 20, isAvailable: true, preparationTime: 8 }
      ];
      
      await MenuItem.insertMany(defaultMenuItems);
      console.log('Default menu items seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding menu items:', error);
  }
}

// Function to seed default gaming stations
async function seedDefaultGamingStations() {
  try {
    const count = await GamingStation.countDocuments();
    if (count === 0) {
      console.log('Seeding default gaming stations...');
      
      const defaultStations = [];
      for (let i = 1; i <= 20; i++) {
        defaultStations.push({
          stationNumber: `PC-${i.toString().padStart(2, '0')}`,
          stationName: `Gaming Station ${i}`,
          specs: {
            cpu: i <= 10 ? 'Intel i5-12400F' : 'Intel i7-12700K',
            gpu: i <= 10 ? 'RTX 3060' : 'RTX 3070',
            ram: i <= 10 ? '16GB DDR4' : '32GB DDR4',
            storage: '1TB NVMe SSD',
            monitor: i <= 10 ? '24" 144Hz' : '27" 165Hz',
            peripherals: ['Gaming Keyboard', 'Gaming Mouse', 'Gaming Headset']
          },
          hourlyRate: i <= 10 ? 20000 : 25000,
          isPremium: i > 10,
          zone: i <= 10 ? 'standard' : i <= 15 ? 'vip' : 'tournament',
          status: 'available'
        });
      }
      
      await GamingStation.insertMany(defaultStations);
      console.log('Default gaming stations seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding gaming stations:', error);
  }
}

// Function to create default admin user
async function createDefaultAdmin() {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      console.log('Creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const defaultAdmin = new Admin({
        username: 'admin',
        email: 'admin@ichi.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'super-admin',
        permissions: {
          manageUsers: true,
          manageStations: true,
          manageOrders: true,
          manageInventory: true,
          manageReports: true,
          viewAnalytics: true,
          systemSettings: true
        }
      });
      
      await defaultAdmin.save();
      console.log('Default admin created - Username: admin, Password: admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

// Initialize database with default data
async function initializeDatabase() {
  await seedDefaultMenuItems();
  await seedDefaultGamingStations();
  await createDefaultAdmin();
}

// Run initialization after MongoDB connection
mongoose.connection.once('open', async () => {
  console.log('Database connected, initializing default data...');
  await initializeDatabase();
});


// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: 'ok',
    server: 'user-server', 
    timestamp: new Date().toISOString(),
    database: {
      state: stateMap[dbState] || 'unknown',
      name: mongoose.connection.db?.databaseName || 'unknown',
      host: mongoose.connection.host || 'unknown',
      port: mongoose.connection.port || 'unknown'
    },
    tunnel: {
      enabled: process.env.MONGODB_URI?.includes('db.') ? true : false,
      url: process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':***@') || 'not set'
    },
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    endpoints: {
      auth: {
        register: '/api/auth/register (POST)',
        login: '/api/auth/login (POST)'
      },
      reports: {
        submit: '/api/reports (POST)',
        getUserReports: '/api/reports/user/:email (GET)'
      },
      menu: {
        getItems: '/api/menu-items (GET)',
        updateStock: '/api/menu-items/update-stock (PATCH)'
      },
      orders: {
        create: '/api/orders (POST)',
        update: '/api/orders/:orderId (PATCH)'
      },
      users: {
        getProfile: '/api/users/:userId (GET)',
        updateProfile: '/api/users/:userId (PATCH)',
        updatePassword: '/api/users/:userId/password (PATCH)',
        deleteAccount: '/api/users/:userId (DELETE)',
        getQuota: '/api/users/:userId/quota (GET)',
        updateQuota: '/api/users/:userId/quota (PATCH)'
      },
      games: {
        playerCounts: '/api/player-counts (GET)',
        launchGame: '/api/launch-game (POST)',
        runningGames: '/api/running-games (GET)'
      },
      payments: {
        createPayment: '/api/create-payment-intent (POST)',
        verifyPayment: '/api/verify-payment/:paymentId (GET)',
        createQris: '/api/create-qris-payment (POST)',
        checkQris: '/api/check-qris-status/:transactionId (GET)',
        completeQris: '/api/complete-qris/:transactionId (POST)'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 User backend server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: ${mongoose.connection.db?.databaseName}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

module.exports = app;