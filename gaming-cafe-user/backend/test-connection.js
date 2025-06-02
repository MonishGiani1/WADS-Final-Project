// test-connection.js
// Quick script to test your MongoDB connection

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':***@')); // Hide password
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    console.log('🔗 Host:', mongoose.connection.host);
    console.log('🚪 Port:', mongoose.connection.port);
    
    // Test basic operations
    console.log('\n🧪 Testing basic database operations...');
    
    // Try to list collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Existing collections:', collections.map(c => c.name));
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    const testDoc = new TestModel({ test: 'Connection successful!' });
    await testDoc.save();
    console.log('✅ Test document saved successfully');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 All tests passed! Your database connection is working perfectly.');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    // Common error diagnostics
    if (error.message.includes('ENOTFOUND')) {
      console.error('🔍 DNS/Network issue: Cannot resolve hostname');
      console.error('💡 Check if the server address is correct and accessible');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔍 Connection refused: Server is not accepting connections');
      console.error('💡 Check if MongoDB server is running on the specified port');
    } else if (error.message.includes('Authentication failed')) {
      console.error('🔍 Authentication issue: Username/password incorrect');
      console.error('💡 Verify your credentials with your lecturer');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('🔍 Timeout: Connection took too long');
      console.error('💡 Network might be slow or firewall blocking connection');
    }
    
    console.error('\n🔧 Debugging steps:');
    console.error('1. Verify your .env file is in the project root');
    console.error('2. Check if your network allows external database connections');
    console.error('3. Confirm credentials with your lecturer');
    console.error('4. Try connecting from a different network (mobile hotspot)');
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit();
  }
}

testConnection();