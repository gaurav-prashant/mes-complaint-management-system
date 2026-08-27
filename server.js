import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Mock Admin Credentials (fallback if not in .env)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mes.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let client;
let db;
let complaintsCollection;

async function connectDB() {
  if (complaintsCollection) return complaintsCollection;
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing in .env');
    return null;
  }
  try {
    let finalUri = MONGO_URI;
    
    // Bypass Node.js SRV resolution bug by using direct replica set nodes
    // Since we know the nodes for cluster0.y85m2k4.mongodb.net:
    if (MONGO_URI.includes('cluster0.y85m2k4.mongodb.net')) {
      const authPart = MONGO_URI.split('@')[0].replace('mongodb+srv://', '');
      finalUri = `mongodb://${authPart}@ac-bqi0hjs-shard-00-00.y85m2k4.mongodb.net:27017,ac-bqi0hjs-shard-00-01.y85m2k4.mongodb.net:27017,ac-bqi0hjs-shard-00-02.y85m2k4.mongodb.net:27017/?ssl=true&replicaSet=atlas-28odxw-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;
    }

    if (!client) {
      client = new MongoClient(finalUri);
      await client.connect();
    }
    db = client.db('mes_complaint_db');
    complaintsCollection = db.collection('complaints');
    console.log('MongoDB connected successfully');
    return complaintsCollection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return null;
  }
}

// Request logging middleware for debugging serverless invocations
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// URL Path Normalization Middleware for Netlify Functions & local dev compatibility
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  }
  next();
});

// Connect eagerly for local dev and attach middleware for serverless invocations
connectDB();
app.use(async (req, res, next) => {
  // Do not block admin login if DB is connecting or unavailable
  if (!complaintsCollection && !req.url.includes('/admin/login')) {
    try {
      await connectDB();
    } catch (dbErr) {
      console.error('Middleware DB connection error:', dbErr);
    }
  }
  next();
});

// Admin Login (supports both /api/admin/login and /admin/login)
app.post(['/api/admin/login', '/admin/login'], (req, res) => {
  const { email, password } = req.body || {};
  console.log(`[Admin Login Attempt] Email: ${email || 'N/A'}`);

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    console.log(`[Admin Login Success] Auth successful for: ${email}`);
    res.json({ success: true, token: 'fake-jwt-token-12345' });
  } else {
    console.log(`[Admin Login Failed] Invalid credentials for: ${email}`);
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

// Get all complaints
app.get(['/api/complaints', '/complaints'], async (req, res) => {
  try {
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Unable to connect to MongoDB' });
    }
    // Fetch and sort by newest first (assuming _id timestamp or created_at)
    const complaints = await complaintsCollection.find({}).sort({ _id: -1 }).toArray();
    res.json({ success: true, complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// Get a specific complaint by ID (for Track Status)
app.get(['/api/complaints/:id', '/complaints/:id'], async (req, res) => {
  const { id } = req.params;
  try {
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Unable to connect to MongoDB' });
    }
    
    // First try by complaintId field
    let complaint = await complaintsCollection.findOne({ complaintId: id });
    
    // If not found, try by _id if it's a valid ObjectId
    if (!complaint && ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      complaint = await complaintsCollection.findOne({ _id: new ObjectId(id) });
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaint' });
  }
});

// Update complaint status
app.put(['/api/complaints/:id/status', '/complaints/:id/status'], async (req, res) => {
  const { id } = req.params;
  const { status, admin_remarks } = req.body;

  try {
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Unable to connect to MongoDB' });
    }

    const updated_at = new Date().toISOString(); 
    
    let filter = {};
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { _id: id }; 
    }

    const result = await complaintsCollection.findOneAndUpdate(
      filter,
      { $set: { status, admin_remarks, updated_at } },
      { returnDocument: 'after' }
    );

    if (!result) {
      const fallbackResult = await complaintsCollection.findOneAndUpdate(
        { complaintId: id },
        { $set: { status, admin_remarks, updated_at } },
        { returnDocument: 'after' }
      );
      if (!fallbackResult) {
        return res.status(404).json({ success: false, message: 'Complaint not found' });
      }
      return res.json({ success: true, complaint: fallbackResult });
    }

    res.json({ success: true, complaint: result });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to update complaint' });
  }
});

// Add a new complaint (for Submit Complaint page)
app.post(['/api/complaints', '/complaints'], async (req, res) => {
  try {
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Unable to connect to MongoDB' });
    }
    const newComplaint = {
      ...req.body,
      created_at: new Date().toISOString().split('T')[0], 
    };
    
    const result = await complaintsCollection.insertOne(newComplaint);
    res.status(201).json({ success: true, complaint: { ...newComplaint, _id: result.insertedId } });
  } catch (error) {
    console.error('Error adding complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to submit complaint' });
  }
});

if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT) {
  app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
}

export default app;
