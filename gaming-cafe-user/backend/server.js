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

console.log('🔍 Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 Port from env:', process.env.PORT);
console.log('🔍 Environment:', process.env.NODE_ENV || 'development');

const mongoURL = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/gaming-cafe';
console.log('🔍 Attempting to connect to MongoDB Atlas...');

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  monitorCommands: process.env.NODE_ENV === 'development'
};

mongoose.connect(mongoURL, mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🔗 Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('🔗 Connection URL:', mongoURL.replace(/:[^:@]*@/, ':***@'));
    
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection...');
      mongoose.connect(mongoURL, mongoOptions);
    }, 5000);
  });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  
  gamingQuotaMinutes: { type: Number, default: 30 },
  sessionUsedMinutes: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  membershipLevel: { 
    type: String, 
    enum: ['bronze', 'silver', 'gold', 'platinum'], 
    default: 'bronze' 
  },
  loyaltyPoints: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  currentStation: { type: String },
  
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    favoriteGames: [String],
    dietaryRestrictions: [String]
  },
  
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  
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
  station: { type: String },
  
  status: { 
    type: String, 
    enum: ['pending', 'investigating', 'resolved', 'escalated', 'closed'],
    default: 'pending'
  },
  
  response: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  resolvedAt: Date,
  
  attachments: [String],
  
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['snacks', 'meals', 'drinks', 'desserts', 'specials']
  },
  
  stock: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: true },
  
  image: { type: String },
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  preparationTime: { type: Number },
  isSpicy: { type: Boolean, default: false },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  
  cost: { type: Number },
  popularityScore: { type: Number, default: 0 },
  
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    minutes: { type: Number },
    description: String
  }],
  
  totalAmount: { type: Number, required: true },
  checkoutType: { 
    type: String, 
    enum: ['food', 'quota'], 
    required: true 
  },
  
  orderStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
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
  
  stripePaymentIntentId: String,
  qrisTransactionId: String,
  qrisPaidAmount: Number,
  qrisPaidAt: Date,
  
  deliveryStation: String,
  specialInstructions: String,
  
  orderedAt: { type: Date, default: Date.now },
  paidAt: Date,
  completedAt: Date,
  failureReason: String
});

const gamingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationNumber: { type: String, required: true },
  
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  totalMinutes: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'terminated'],
    default: 'active'
  },
  
  hourlyRate: { type: Number, default: 20000 },
  totalCost: { type: Number, default: 0 },
  paymentMethod: String,
  
  gamesPlayed: [String],
  
  notes: String,
  terminationReason: String,
  
  created: { type: Date, default: Date.now }
});

const gamingStationSchema = new mongoose.Schema({
  stationNumber: { type: String, required: true, unique: true },
  stationName: { type: String, required: true },
  
  specs: {
    cpu: String,
    gpu: String,
    ram: String,
    storage: String,
    monitor: String,
    peripherals: [String]
  },
  
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance', 'out-of-order'],
    default: 'available'
  },
  
  currentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GamingSession' },
  
  hourlyRate: { type: Number, default: 20000 },
  isPremium: { type: Boolean, default: false },
  
  lastMaintenance: Date,
  maintenanceNotes: String,
  
  zone: { type: String, enum: ['standard', 'vip', 'tournament'], default: 'standard' },
  
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  
  role: { 
    type: String, 
    enum: ['super-admin', 'manager', 'staff', 'tech-support'],
    default: 'staff'
  },
  
  permissions: {
    manageUsers: { type: Boolean, default: false },
    manageStations: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: false },
    manageInventory: { type: Boolean, default: false },
    manageReports: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: false },
    systemSettings: { type: Boolean, default: false }
  },
  
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
  created: { type: Date, default: Date.now }
});

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
    'https://user-frontend.up.railway.app',
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization']  
}));

app.use(express.json());

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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;
    
    console.log('Registration attempt:', { fullName, email, phoneNumber });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      gamingQuotaMinutes: 30,
      loyaltyPoints: 100
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
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
      updateQuery = { 
        $inc: { 
          gamingQuotaMinutes: quotaMinutes,
          totalSpent: purchaseAmount || 0
        },
        $set: { updated: new Date() }
      };
    } else if (action === 'reset') {
      updateQuery = { 
        $set: { 
          sessionUsedMinutes: 0,
          lastTimerUpdate: new Date(),
          updated: new Date()
        }
      };
    } else {
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
    
    const remainingMinutes = Math.max(0, user.gamingQuotaMinutes - user.sessionUsedMinutes);
    
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
    
    await Report.deleteMany({ userId: req.params.userId });
    await Order.deleteMany({ userId: req.params.userId });
    await GamingSession.deleteMany({ userId: req.params.userId });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

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

app.get('/api/player-counts', async (req, res) => {
  try {
    console.log('Fetching player counts...');
    const playerCounts = getMockPlayerCounts();
    console.log('Player counts fetched successfully');
    res.json(playerCounts);
  } catch (error) {
    console.error('Error in player counts endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch player counts' });
  }
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'idr', description, metadata } = req.body;
    
    console.log('Creating payment intent:', { amount, currency, description });
    
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_mock`;
    
    const payment = new Payment({
      paymentId: paymentIntentId,
      amount,
      currency,
      description,
      metadata,
      status: 'requires_payment_method'
    });
    
    await payment.save();
    console.log('Payment intent created and saved:', paymentIntentId);
    
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

app.get('/api/verify-payment/:paymentId', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    console.log('Verifying payment:', paymentId);
    
    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    payment.status = 'succeeded';
    await payment.save();
    
    res.json({
      status: 'succeeded',
      amount: payment.amount,
      currency: payment.currency,
      metadata: payment.metadata
    });
    
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/create-qris-payment', async (req, res) => {
  try {
    const { amount, orderId, customerName, expiryMinutes = 15 } = req.body;
    
    console.log('Creating QRIS payment:', { amount, orderId, customerName });
    
    const transactionId = `qris_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
      console.log('QRIS payment created:', transactionId);
      
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

app.get('/api/check-qris-status/:transactionId', async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    console.log('Checking QRIS status:', transactionId);
    
    const qrisPayment = await QrisPayment.findOne({ transactionId });
    
    if (!qrisPayment) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    const now = new Date();
    const expiry = new Date(qrisPayment.expiryTime);
    
    if (now > expiry && qrisPayment.status === 'PENDING') {
      qrisPayment.status = 'EXPIRED';
      await qrisPayment.save();
    }
    
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

app.post('/api/launch-game', async (req, res) => {
  try {
    const { gameName, executablePath } = req.body;
    
    console.log(`Game launch requested: ${gameName} at ${executablePath}`);
    
    res.json({
      success: false,
      message: 'Game launching is not available on cloud deployment',
      note: 'This feature only works on local gaming stations'
    });
    
  } catch (error) {
    console.error('Game launch error:', error);
    res.status(500).json({
      success: false,
      error: 'Game launch not supported in cloud environment'
    });
  }
});

app.get('/api/running-games', (req, res) => {
  res.json({ 
    runningGames: [],
    message: 'Running games detection not available on cloud deployment'
  });
});


app.post('/api/ai/gemini', authenticateToken, async (req, res) => {
  try {
    const { message, userContext } = req.body;
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAk96MP_EEVdCniXHQNM65rQ5Y1eBKQ2pk';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are ICHI Gaming Cafe's AI assistant. The user is ${userContext.name} at ${userContext.station} with ${userContext.remainingTime} gaming time left and ${userContext.balance} balance. User asked: "${message}" Respond helpfully about gaming, cafe services, food recommendations, or technical support. Keep responses concise and friendly with gaming cafe context.`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      res.json({ success: true, response: aiResponse });
    } else {
      throw new Error('No response from Gemini');
    }
    
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI service temporarily unavailable' 
    });
  }
});

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
      console.log('✅ Default menu items seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error seeding menu items:', error);
  }
}

async function seedDefaultGamingStations() {
  try {
    const count = await GamingStation.countDocuments();
    if (count === 0) {
      console.log('🎮 Seeding default gaming stations...');
      
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
      console.log('✅ Default gaming stations seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error seeding gaming stations:', error);
  }
}

async function createDefaultAdmin() {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      console.log('👤 Creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const defaultAdmin = new Admin({
        username: 'admin',
        email: 'admin@gamingcafe.com',
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
      console.log('✅ Default admin created - Username: admin, Password: admin123');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
}

async function initializeDatabase() {
  await seedDefaultMenuItems();
  await seedDefaultGamingStations();
  await createDefaultAdmin();
}

mongoose.connection.once('open', async () => {
  console.log('📊 Database connected, initializing default data...');
  await initializeDatabase();
});

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
    server: 'gaming-cafe-user-server', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: {
      state: stateMap[dbState] || 'unknown',
      name: mongoose.connection.db?.databaseName || 'unknown'
    },
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gaming Cafe User Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});

module.exports = app;