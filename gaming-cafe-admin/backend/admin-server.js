const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.ADMIN_PORT || 5001;

// Debug logging for environment variables
console.log('🔍 Admin Server Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 Admin Port:', PORT);

// MongoDB connection - UPDATED for consistency and Cloudflare Tunnel support
const mongoURL = process.env.MONGODB_URI || 'mongodb://e2425-wads-l4bcg4:ciwrot6o@localhost:27018/e2425-wads-l4bcg4?authSource=e2425-wads-l4bcg4';
console.log('🔍 Admin server connecting to MongoDB:', mongoURL.replace(/:[^:@]*@/, ':***@'));

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
    console.log('🍃 Admin Server connected to MongoDB');
    console.log('📍 Database:', mongoose.connection.db.databaseName);
    console.log('🔌 Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
  })
  .catch(err => {
    console.error('❌ Admin MongoDB connection error:', err.message);
    console.error('🔍 Connection URL:', mongoURL.replace(/:[^:@]*@/, ':***@'));
    console.error('Full error:', err);
    
    // Retry connection after 5 seconds
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection...');
      mongoose.connect(mongoURL, mongoOptions);
    }, 5000);
  });


// User Schema (for admin to view users)
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

// Reports Schema (for admin to manage reports)
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
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  resolvedAt: Date,
  attachments: [String],
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Menu Items Schema (for admin to manage inventory)
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

// Orders Schema (for admin to manage orders)
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

// Gaming Sessions Schema (for admin to view gaming activity)
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

// Admin User Schema (for admin authentication)
const adminUserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: { 
    type: String, 
    enum: ['admin', 'super_admin', 'manager'],
    default: 'admin'
  },
  permissions: {
    canManageUsers: { type: Boolean, default: true },
    canManageInventory: { type: Boolean, default: true },
    canManageReports: { type: Boolean, default: true },
    canManageOrders: { type: Boolean, default: true },
    canViewAnalytics: { type: Boolean, default: true },
    canManageAdmins: { type: Boolean, default: false }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: Date,
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    lockUntil: Date
  },
  created: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
});

// Hash admin password before saving
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Admin password comparison method
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Admin account locking methods
adminUserSchema.methods.isLocked = function() {
  return !!(this.loginAttempts.lockUntil && this.loginAttempts.lockUntil > Date.now());
};

adminUserSchema.methods.incLoginAttempts = function() {
  if (this.loginAttempts.lockUntil && this.loginAttempts.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'loginAttempts.lockUntil': 1 },
      $set: {
        'loginAttempts.count': 1,
        'loginAttempts.lastAttempt': Date.now()
      }
    });
  }
  
  const updates = {
    $inc: { 'loginAttempts.count': 1 },
    $set: { 'loginAttempts.lastAttempt': Date.now() }
  };
  
  if (this.loginAttempts.count + 1 >= 5 && !this.isLocked()) {
    updates.$set['loginAttempts.lockUntil'] = Date.now() + 2 * 60 * 60 * 1000;
  }
  
  return this.updateOne(updates);
};

const User = mongoose.model('User', userSchema);
const Report = mongoose.model('Report', reportSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);
const GamingSession = mongoose.model('GamingSession', gamingSessionSchema);
const AdminUser = mongoose.model('AdminUser', adminUserSchema);


app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3001',
    'https://yourdomain.com',          
    'https://www.yourdomain.com',       
    'https://admin.yourdomain.com',     
    'https://api.yourdomain.com'        
  ], 
  credentials: true
}));
app.use(express.json());


const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Admin access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production');
    const admin = await AdminUser.findById(decoded.adminId);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid admin token or account deactivated' 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ 
      success: false, 
      error: 'Invalid admin token' 
    });
  }
};

// Admin Login
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Admin login attempt:', username);
    
    // Find admin by username or email
    const admin = await AdminUser.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(423).json({
        success: false,
        error: 'Admin account temporarily locked due to failed login attempts'
      });
    }
    
    // Check password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      await admin.incLoginAttempts();
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin account is deactivated' 
      });
    }
    
    // Reset login attempts on successful login
    if (admin.loginAttempts.count > 0) {
      await admin.updateOne({
        $unset: {
          'loginAttempts.count': 1,
          'loginAttempts.lastAttempt': 1,
          'loginAttempts.lockUntil': 1
        }
      });
    }
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    // Create JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        username: admin.username, 
        role: admin.role,
        permissions: admin.permissions
      },
      process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production',
      { expiresIn: '8h' }
    );
    
    console.log('Admin login successful:', username);
    
    res.json({ 
      success: true, 
      message: 'Admin login successful!',
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      },
      token
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Admin login failed. Please try again.' 
    });
  }
});

// Create initial admin (run once)
app.post('/api/admin/setup', async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await AdminUser.findOne({});
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Admin account already exists' 
      });
    }
    
    const { username, email, password, fullName } = req.body;
    
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: username, email, password, fullName'
      });
    }
    
    // Create initial super admin
    const admin = new AdminUser({
      username,
      email,
      password, // Will be hashed by pre-save middleware
      fullName,
      role: 'super_admin',
      permissions: {
        canManageUsers: true,
        canManageInventory: true,
        canManageReports: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageAdmins: true
      }
    });
    
    await admin.save();
    console.log('Initial admin created:', username);
    
    res.json({ 
      success: true, 
      message: 'Initial admin created successfully!' 
    });
    
  } catch (error) {
    console.error('Admin setup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Admin setup failed' 
    });
  }
});


// Get all reports for admin
app.get('/api/admin/reports', adminAuth, async (req, res) => {
  try {
    const { status, priority, category, limit = 100 } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    const reports = await Report.find(filter)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Calculate stats
    const stats = {
      pending: await Report.countDocuments({ status: 'pending' }),
      investigating: await Report.countDocuments({ status: 'investigating' }),
      resolved: await Report.countDocuments({ status: 'resolved' }),
      escalated: await Report.countDocuments({ status: 'escalated' }),
      total: await Report.countDocuments()
    };
    
    // Format reports for admin UI
    const formattedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      status: report.status,
      user: report.userName,
      userEmail: report.userEmail,
      station: report.station,
      submittedAt: report.submittedAt.toLocaleDateString(),
      updatedAt: report.updatedAt.toLocaleDateString(),
      response: report.response,
      assignedTo: report.assignedTo ? 'Admin' : null,
      respondedAt: report.response ? report.updatedAt.toLocaleDateString() : null
    }));
    
    console.log(`Admin fetched ${formattedReports.length} reports`);
    
    res.json({
      success: true,
      reports: formattedReports,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// Update report status (admin only)
app.patch('/api/admin/reports/:reportId/status', adminAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'investigating', 'resolved', 'escalated', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const report = await Report.findOneAndUpdate(
      { id: reportId }, // Use the custom 'id' field, not MongoDB's '_id'
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    console.log(`Admin updated report ${reportId} status to ${status}`);
    
    res.json({
      success: true,
      message: 'Report status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report status'
    });
  }
});

// Add admin response to report
app.patch('/api/admin/reports/:reportId/response', adminAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { response, assignedTo } = req.body;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Response message is required'
      });
    }
    
    const report = await Report.findOneAndUpdate(
      { id: reportId }, // Use the custom 'id' field, not MongoDB's '_id'
      {
        response: response.trim(),
        assignedTo: req.admin._id,
        status: 'investigating', // Auto-set to investigating when responded
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    console.log(`Admin ${req.admin.username} responded to report ${reportId}`);
    
    res.json({
      success: true,
      message: 'Response added successfully'
    });
    
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add response'
    });
  }
});


// Get all users for admin
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ created: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Calculate user analytics
    const analytics = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      recentUsers: await User.countDocuments({
        created: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    };
    
    console.log(`👥 Admin fetched ${users.length} users`);
    
    res.json({
      success: true,
      users,
      analytics
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Update user status (activate/deactivate)
app.patch('/api/admin/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isActive,
        updated: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // If deactivating user, end any active gaming sessions
    if (!isActive) {
      await GamingSession.updateMany(
        { userId, status: 'active' },
        { status: 'terminated', endTime: new Date() }
      );
    }
    
    console.log(`👤 Admin ${isActive ? 'activated' : 'deactivated'} user ${userId}`);
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

// Get user details with gaming history
app.get('/api/admin/users/:userId/details', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get user's gaming sessions
    const gamingSessions = await GamingSession.find({ userId })
      .sort({ created: -1 })
      .limit(10)
      .lean();
    
    // Get user's recent orders
    const recentOrders = await Order.find({ userId })
      .sort({ orderedAt: -1 })
      .limit(10)
      .lean();
    
    // Get user's reports
    const userReports = await Report.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      user,
      gamingSessions,
      recentOrders,
      userReports
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details'
    });
  }
});

// ============================================================
// 📦 ADMIN INVENTORY MANAGEMENT ENDPOINTS
// ============================================================

// Get all menu items for admin (with detailed analytics)
app.get('/api/admin/menu-items', adminAuth, async (req, res) => {
  try {
    const { category, availability } = req.query;
    
    // Build filter
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (availability && availability !== 'all') {
      filter.isAvailable = availability === 'available';
    }
    
    const menuItems = await MenuItem.find(filter)
      .sort({ created: -1 })
      .lean();
    
    // Calculate analytics
    const analytics = {
      totalItems: await MenuItem.countDocuments(),
      availableItems: await MenuItem.countDocuments({ isAvailable: true }),
      lowStockItems: await MenuItem.countDocuments({ 
        stock: { $lte: 5, $gt: 0 } 
      }),
      outOfStockItems: await MenuItem.countDocuments({ stock: 0 })
    };
    
    console.log(`Admin fetched ${menuItems.length} menu items`);
    
    res.json({
      success: true,
      menuItems,
      analytics
    });
    
  } catch (error) {
    console.error('Error fetching admin menu items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items'
    });
  }
});

// Update stock only (for quick stock updates)
app.patch('/api/admin/menu-items/:itemId/stock', adminAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid stock quantity is required'
      });
    }
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      itemId,
      { 
        stock: parseInt(stock),
        updated: new Date(),
        updatedBy: req.admin._id,
        // Auto-update availability based on stock
        isAvailable: parseInt(stock) > 0
      },
      { new: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    console.log(`Admin updated stock for ${menuItem.name}: ${stock}`);
    
    res.json({
      success: true,
      message: 'Stock updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
});

// Create new menu item (admin only)
app.post('/api/admin/menu-items', adminAuth, async (req, res) => {
  try {
    const { name, price, category, description, image, stock, isAvailable } = req.body;
    
    // Validation
    if (!name || !price || !category || !description || stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, category, description, stock'
      });
    }
    
    const newMenuItem = new MenuItem({
      name: name.trim(),
      price: parseFloat(price),
      category: category.toLowerCase(),
      description: description.trim(),
      image: image || '🍽️',
      stock: parseInt(stock),
      isAvailable: isAvailable !== false,
      createdBy: req.admin._id
    });
    
    await newMenuItem.save();
    
    console.log(`Admin created menu item: ${name}`);
    
    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      menuItem: newMenuItem
    });
    
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item'
    });
  }
});

// Update menu item (admin only)
app.put('/api/admin/menu-items/:itemId', adminAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, price, category, description, image, stock, isAvailable } = req.body;
    
    const updateData = {
      name: name?.trim(),
      price: price ? parseFloat(price) : undefined,
      category: category?.toLowerCase(),
      description: description?.trim(),
      image,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      isAvailable,
      updated: new Date(),
      updatedBy: req.admin._id
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    console.log(`Admin updated menu item: ${menuItem.name}`);
    
    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem
    });
    
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item'
    });
  }
});

// Delete menu item (admin only)
app.delete('/api/admin/menu-items/:itemId', adminAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const menuItem = await MenuItem.findByIdAndDelete(itemId);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    console.log(`Admin deleted menu item: ${menuItem.name}`);
    
    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item'
    });
  }
});

// Get comprehensive dashboard analytics
app.get('/api/admin/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // User analytics
    const userAnalytics = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      newUsers: await User.countDocuments({ created: { $gte: startDate } }),
      currentlyGaming: await GamingSession.countDocuments({ status: 'active' })
    };
    
    // Order analytics
    const orderAnalytics = {
      totalOrders: await Order.countDocuments(),
      recentOrders: await Order.countDocuments({ orderedAt: { $gte: startDate } }),
      completedOrders: await Order.countDocuments({ 
        paymentStatus: 'completed',
        orderedAt: { $gte: startDate }
      }),
      pendingOrders: await Order.countDocuments({ paymentStatus: 'pending' })
    };
    
    // Revenue analytics
    const revenueResult = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'completed',
          orderedAt: { $gte: startDate }
        }
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        } 
      }
    ]);
    
    const revenue = revenueResult.length > 0 ? revenueResult[0] : { totalRevenue: 0, averageOrderValue: 0 };
    
    // Inventory analytics
    const inventoryAnalytics = {
      totalItems: await MenuItem.countDocuments(),
      availableItems: await MenuItem.countDocuments({ isAvailable: true }),
      lowStockItems: await MenuItem.countDocuments({ 
        stock: { $lte: 5, $gt: 0 } 
      }),
      outOfStockItems: await MenuItem.countDocuments({ stock: 0 })
    };
    
    // Reports analytics
    const reportsAnalytics = {
      totalReports: await Report.countDocuments(),
      pendingReports: await Report.countDocuments({ status: 'pending' }),
      resolvedReports: await Report.countDocuments({ 
        status: 'resolved',
        submittedAt: { $gte: startDate }
      }),
      escalatedReports: await Report.countDocuments({ status: 'escalated' })
    };
    
    console.log(`Admin fetched analytics for period: ${period}`);
    
    res.json({
      success: true,
      analytics: {
        users: userAnalytics,
        orders: orderAnalytics,
        revenue: {
          totalRevenue: revenue.totalRevenue || 0,
          averageOrderValue: Math.round(revenue.averageOrderValue || 0)
        },
        inventory: inventoryAnalytics,
        reports: reportsAnalytics,
        period
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Get all orders for admin
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const { status, orderType, limit = 50 } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (orderType && orderType !== 'all') {
      filter.checkoutType = orderType;
    }
    
    const orders = await Order.find(filter)
      .populate('userId', 'fullName email')
      .sort({ orderedAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Calculate order analytics
    const analytics = {
      totalOrders: await Order.countDocuments(),
      pendingOrders: await Order.countDocuments({ orderStatus: 'pending' }),
      completedOrders: await Order.countDocuments({ orderStatus: 'delivered' }),
      todayOrders: await Order.countDocuments({
        orderedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    };
    
    console.log(`Admin fetched ${orders.length} orders`);
    
    res.json({
      success: true,
      orders,
      analytics
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Update order status (admin)
app.patch('/api/admin/orders/:orderId/status', adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, notes } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order status'
      });
    }
    
    const updateData = {
      orderStatus,
      processedBy: req.admin._id
    };
    
    if (notes) {
      updateData.adminNotes = notes;
    }
    
    if (orderStatus === 'delivered') {
      updateData.completedAt = new Date();
    }
    
    const order = await Order.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    console.log(`Admin updated order ${orderId} status to ${orderStatus}`);
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

// Initialize default data for admin
app.post('/api/admin/initialize-data', adminAuth, async (req, res) => {
  try {
    // Check if menu items exist
    const menuCount = await MenuItem.countDocuments();
    let createdItems = 0;
    
    if (menuCount === 0) {
      const defaultMenuItems = [
        { name: "Chicken Wings", price: 45000, category: "snacks", description: "6 pieces of spicy or BBQ wings", image: "🍗", stock: 50, isAvailable: true },
        { name: "French Fries", price: 25000, category: "snacks", description: "Crispy fries with dipping sauce", image: "🍟", stock: 30, isAvailable: true },
        { name: "Nachos", price: 35000, category: "snacks", description: "Tortilla chips with cheese and salsa", image: "🧀", stock: 25, isAvailable: true },
        { name: "Cheeseburger", price: 55000, category: "meals", description: "Beef patty with cheese and veggies", image: "🍔", stock: 20, isAvailable: true },
        { name: "Pizza Slice", price: 40000, category: "meals", description: "Large pepperoni pizza slice", image: "🍕", stock: 15, isAvailable: true },
        { name: "Chicken Sandwich", price: 50000, category: "meals", description: "Grilled chicken with lettuce and mayo", image: "🥪", stock: 18, isAvailable: true },
        { name: "Fried Rice", price: 45000, category: "meals", description: "Indonesian style fried rice", image: "🍚", stock: 22, isAvailable: true },
        { name: "Soda", price: 15000, category: "drinks", description: "Various flavors available", image: "🥤", stock: 100, isAvailable: true },
        { name: "Coffee", price: 25000, category: "drinks", description: "Hot or iced coffee", image: "☕", stock: 40, isAvailable: true },
        { name: "Energy Drink", price: 30000, category: "drinks", description: "Stay energized while gaming", image: "⚡", stock: 35, isAvailable: true },
        { name: "Ice Cream", price: 20000, category: "desserts", description: "Chocolate or vanilla", image: "🍦", stock: 25, isAvailable: true },
        { name: "Brownie", price: 25000, category: "desserts", description: "Rich chocolate brownie", image: "🍫", stock: 20, isAvailable: true }
      ];
      
      for (const item of defaultMenuItems) {
        const menuItem = new MenuItem({
          ...item,
          createdBy: req.admin._id
        });
        await menuItem.save();
        createdItems++;
      }
    }
    
    console.log(`Admin initialized ${createdItems} default menu items`);
    
    res.json({
      success: true,
      message: `Initialization complete. Created ${createdItems} menu items.`,
      data: {
        menuItemsCreated: createdItems,
        existingMenuItems: menuCount
      }
    });
    
  } catch (error) {
    console.error('Error initializing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize data'
    });
  }
});

// Get system statistics
app.get('/api/admin/system-stats', adminAuth, async (req, res) => {
  try {
    const stats = {
      database: {
        users: await User.countDocuments(),
        menuItems: await MenuItem.countDocuments(),
        orders: await Order.countDocuments(),
        reports: await Report.countDocuments(),
        gamingSessions: await GamingSession.countDocuments(),
        adminUsers: await AdminUser.countDocuments()
      },
      system: {
        serverUptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error fetching system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics'
    });
  }
});

// Function to create default admin user
async function createDefaultAdmin() {
  try {
    const count = await AdminUser.countDocuments();
    if (count === 0) {
      console.log('🌱 Creating default admin user...');
      
      const defaultAdmin = new AdminUser({
        username: 'admin',
        email: 'admin@ichi.com',
        password: 'admin123', // Will be hashed by pre-save middleware
        fullName: 'System Administrator',
        role: 'super_admin',
        permissions: {
          canManageUsers: true,
          canManageInventory: true,
          canManageReports: true,
          canManageOrders: true,
          canViewAnalytics: true,
          canManageAdmins: true
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
  await createDefaultAdmin();
}

// Run initialization after MongoDB connection
mongoose.connection.once('open', async () => {
  console.log('🚀 Admin database connected, initializing default data...');
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
    server: 'admin-server',
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
      admin: {
        login: '/api/admin/auth/login (POST)',
        setup: '/api/admin/setup (POST)',
        reports: '/api/admin/reports (GET)',
        updateReportStatus: '/api/admin/reports/:reportId/status (PATCH)',
        addReportResponse: '/api/admin/reports/:reportId/response (PATCH)',
        users: '/api/admin/users (GET)',
        userDetails: '/api/admin/users/:userId/details (GET)',
        updateUserStatus: '/api/admin/users/:userId/status (PATCH)',
        menuItems: '/api/admin/menu-items (GET, POST, PUT, DELETE)',
        updateStock: '/api/admin/menu-items/:itemId/stock (PATCH)',
        orders: '/api/admin/orders (GET)',
        updateOrderStatus: '/api/admin/orders/:orderId/status (PATCH)',
        analytics: '/api/admin/analytics (GET)',
        systemStats: '/api/admin/system-stats (GET)',
        initializeData: '/api/admin/initialize-data (POST)'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Admin server error:', err);
  res.status(500).json({ error: 'Internal admin server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Admin endpoint not found' });
});

module.exports = app;