import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import os from 'os';
import dns from 'dns';

dotenv.config();

// Ensure public DNS fallback for SRV lookup on Windows environments only
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {
    console.warn('[DB] Custom DNS setup warning:', dnsErr.message);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ─── Network LAN Helper ───────────────────────────────────────────────────────

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function getAppUrl() {
  const rawEnvUrl = (process.env.APP_URL || process.env.FRONTEND_URL || '').trim();

  // Production domain check (not localhost, 127.0.0.1, or local LAN IP subnets)
  const isLocalHostOrLan = !rawEnvUrl || 
    rawEnvUrl.includes('localhost') || 
    rawEnvUrl.includes('127.0.0.1') || 
    rawEnvUrl.includes('192.168.') || 
    rawEnvUrl.includes('10.') || 
    rawEnvUrl.includes('172.');

  if (!isLocalHostOrLan) {
    return rawEnvUrl.replace(/\/+$/, '');
  }

  // Local development: use detected machine LAN IPv4 address and Vite dev port 3000
  const lanIp = getLanIp();
  return `http://${lanIp}:3000`;
}

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ─── Sanity-check critical server-side env vars (never log their values) ─────
const ADMIN_EMAIL_SET   = Boolean(process.env.ADMIN_EMAIL);
const ADMIN_PASS_SET    = Boolean(process.env.ADMIN_PASSWORD);
const JWT_SECRET_SET    = Boolean(process.env.JWT_SECRET);

let client;
let db;
let complaintsCollection;
let adminsCollection;
let adminPasswordResetsCollection;
let superAdminsCollection;
let superAdminPasswordResetsCollection;
let connectingPromise = null;

// ─── DB Connection Health & Reset Helpers ─────────────────────────────────────

async function resetDBHandles() {
  if (client) {
    try { await client.close(true); } catch (e) {}
  }
  client = null;
  db = null;
  complaintsCollection = null;
  adminsCollection = null;
  adminPasswordResetsCollection = null;
  superAdminsCollection = null;
  superAdminPasswordResetsCollection = null;
  connectingPromise = null;
}

async function isConnectionAlive() {
  if (!client || !db) return false;
  try {
    await db.command({ ping: 1 });
    return true;
  } catch (err) {
    console.warn('[DB] Connection health check failed (stale socket detected):', err.message);
    return false;
  }
}

// ─── DB Connect ───────────────────────────────────────────────────────────────

async function connectDB() {
  if (!MONGO_URI) {
    console.error('[DB] MONGO_URI is missing in .env');
    return null;
  }

  // Fast path: if cached collection handles exist, verify connection health
  if (complaintsCollection && client && db) {
    const alive = await isConnectionAlive();
    if (alive) {
      return complaintsCollection;
    }
    console.warn('[DB] Re-establishing stale MongoDB connection...');
    await resetDBHandles();
  }

  // Prevent concurrent request connection races in serverless cold/warm starts
  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      if (!client) {
        client = new MongoClient(MONGO_URI, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
        });
        await client.connect();
      }

      db = client.db('mes_complaint_db');
      await db.command({ ping: 1 });

      complaintsCollection                = db.collection('complaints');
      adminsCollection                    = db.collection('admins');
      adminPasswordResetsCollection       = db.collection('adminPasswordResets');
      superAdminsCollection               = db.collection('superadmins');
      superAdminPasswordResetsCollection  = db.collection('superAdminPasswordResets');

      await ensureAdminExists();
      await ensureSuperAdminExists();

      console.log('[DB] MongoDB connected & verified successfully');
      return complaintsCollection;
    } catch (err) {
      console.error('[DB] MongoDB connection error:', err.message || err);
      await resetDBHandles();
      return null;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

// ─── Ensure Default Admin Exists (hashed & synchronized) ─────────────────────

async function ensureAdminExists() {
  if (!adminsCollection) return;

  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return;

  try {
    const count = await adminsCollection.countDocuments({});
    if (count === 0) {
      const targetEmail  = adminEmail.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      await adminsCollection.insertOne({
        email: targetEmail,
        passwordHash,
        role: 'admin',
        authVersion: 1,
        createdAt: new Date(),
      });
      console.log('[Auth] Default Admin account seeded successfully.');
    } else {
      const existing = await adminsCollection.findOne({});
      if (existing && typeof existing.authVersion !== 'number') {
        await adminsCollection.updateOne({ _id: existing._id }, { $set: { authVersion: 1 } });
      }
    }
  } catch (err) {
    console.error('[Auth] Failed to seed Admin account:', err.message);
  }
}

// ─── Ensure Default SuperAdmin Exists (hashed) ───────────────────────────────

async function ensureSuperAdminExists() {
  if (!superAdminsCollection) return;

  const saEmail    = (process.env.SUPERADMIN_EMAIL || 'superadmin@example.com').trim().toLowerCase();
  const saPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123';

  try {
    const count = await superAdminsCollection.countDocuments({});
    if (count === 0) {
      const passwordHash = await bcrypt.hash(saPassword, 12);

      await superAdminsCollection.insertOne({
        email: saEmail,
        passwordHash,
        role: 'superadmin',
        authVersion: 1,
        createdAt: new Date(),
      });
      console.log('[Auth] Default SuperAdmin account seeded successfully.');
    } else {
      const existing = await superAdminsCollection.findOne({});
      if (existing && typeof existing.authVersion !== 'number') {
        await superAdminsCollection.updateOne({ _id: existing._id }, { $set: { authVersion: 1 } });
      }
    }
  } catch (err) {
    console.error('[Auth] Failed to seed SuperAdmin account:', err.message);
  }
}

// ─── Server Init Logging ──────────────────────────────────────────────────────

console.log(`[Server Init] NODE_ENV: ${process.env.NODE_ENV || 'development'} | NETLIFY: ${Boolean(process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT)}`);
console.log(`[Server Init] Config Check — ADMIN_EMAIL: ${ADMIN_EMAIL_SET}, ADMIN_PASSWORD: ${ADMIN_PASS_SET}, JWT_SECRET: ${JWT_SECRET_SET}, MONGO_URI: ${Boolean(MONGO_URI)}`);

// ─── Request Logging Middleware ───────────────────────────────────────────────

app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// ─── URL Path Normalization (Netlify Functions compat) ────────────────────────

app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  }
  next();
});

// ─── DB Connection Middleware ─────────────────────────────────────────────────

connectDB().then(async () => {
  await ensureAdminExists();
  await ensureSuperAdminExists();
});

app.use(async (req, res, next) => {
  if (!complaintsCollection || !adminsCollection) {
    try {
      await connectDB();
      if (adminsCollection) await ensureAdminExists();
      if (superAdminsCollection) await ensureSuperAdminExists();
    } catch (dbErr) {
      console.error('[Middleware] DB connection error:', dbErr);
    }
  }
  next();
});

// ─── JWT Authentication Middleware (Admin) ───────────────────────────────────

async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (!process.env.JWT_SECRET) {
    console.error('[Auth] JWT_SECRET is not set — cannot verify token');
    return res.status(500).json({ success: false, message: 'Server authentication configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id || !ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (!adminsCollection) {
      return res.status(500).json({ success: false, message: 'Database unavailable' });
    }

    const admin = await adminsCollection.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { passwordHash: 0 } }
    );

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid token: Admin account not found' });
    }

    const tokenAuthVersion = decoded.authVersion || 1;
    const dbAuthVersion    = admin.authVersion || 1;

    if (tokenAuthVersion !== dbAuthVersion) {
      return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
    }

    req.admin = {
      id: String(admin._id),
      email: admin.email,
      role: admin.role,
      authVersion: dbAuthVersion,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── JWT Authentication Middleware (SuperAdmin) ──────────────────────────────

async function authenticateSuperAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  if (!process.env.JWT_SECRET) {
    console.error('[Auth] JWT_SECRET is not set — cannot verify token');
    return res.status(500).json({ success: false, message: 'Server authentication configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id || !ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (decoded.role !== 'superadmin') {
      return res.status(401).json({ success: false, message: 'Access denied: SuperAdmin role required' });
    }

    if (!superAdminsCollection && !adminsCollection) {
      return res.status(500).json({ success: false, message: 'Database unavailable' });
    }

    let superadmin = await superAdminsCollection.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { passwordHash: 0 } }
    );

    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne(
        { _id: new ObjectId(decoded.id), role: 'superadmin' },
        { projection: { passwordHash: 0 } }
      );
    }

    if (!superadmin) {
      return res.status(401).json({ success: false, message: 'Invalid token: SuperAdmin account not found' });
    }

    const tokenAuthVersion = decoded.authVersion || 1;
    const dbAuthVersion    = superadmin.authVersion || 1;

    if (tokenAuthVersion !== dbAuthVersion) {
      return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
    }

    req.superadmin = {
      id: String(superadmin._id),
      email: superadmin.email,
      role: 'superadmin',
      authVersion: dbAuthVersion,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── JWT Authentication Middleware (Admin or SuperAdmin) ─────────────────────

async function authenticateAnyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server authentication configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id || !ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (decoded.role === 'superadmin') {
      let superadmin = await superAdminsCollection.findOne(
        { _id: new ObjectId(decoded.id) },
        { projection: { passwordHash: 0 } }
      );
      if (!superadmin && adminsCollection) {
        superadmin = await adminsCollection.findOne({ _id: new ObjectId(decoded.id), role: 'superadmin' });
      }
      if (!superadmin) return res.status(401).json({ success: false, message: 'SuperAdmin account not found' });
      if ((decoded.authVersion || 1) !== (superadmin.authVersion || 1)) {
        return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
      }
      req.admin = { id: String(superadmin._id), email: superadmin.email, role: 'superadmin' };
      req.superadmin = req.admin;
      return next();
    } else {
      const admin = await adminsCollection.findOne(
        { _id: new ObjectId(decoded.id) },
        { projection: { passwordHash: 0 } }
      );
      if (!admin) return res.status(401).json({ success: false, message: 'Admin account not found' });
      if ((decoded.authVersion || 1) !== (admin.authVersion || 1)) {
        return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
      }
      req.admin = { id: String(admin._id), email: admin.email, role: admin.role || 'admin' };
      return next();
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── Helper: sign a new JWT for the admin ────────────────────────────────────

function signAdminToken(admin) {
  return jwt.sign(
    {
      id: String(admin._id),
      email: admin.email,
      role: admin.role || 'admin',
      authVersion: admin.authVersion || 1,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ─── Helper: sign a new JWT for the superadmin ───────────────────────────────

function signSuperAdminToken(superadmin) {
  return jwt.sign(
    {
      id: String(superadmin._id),
      email: superadmin.email,
      role: 'superadmin',
      authVersion: superadmin.authVersion || 1,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
// Public endpoint — no authenticateAdmin middleware here

app.post(['/api/admin/login', '/admin/login'], async (req, res) => {
  const { email, password } = req.body || {};
  console.log(`[Admin Login Attempt] Method: ${req.method} | Path: ${req.url}`);

  // Generic failure message — never reveal which field was wrong
  const FAIL_MSG = 'Invalid email or password';

  if (!email || !password) {
    return res.status(401).json({ success: false, message: FAIL_MSG });
  }

  if (!adminsCollection) {
    console.error('[Admin Login] adminsCollection not available');
    return res.status(500).json({ success: false, message: 'Database unavailable. Please try again later.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('[Admin Login] JWT_SECRET is not set');
    return res.status(500).json({ success: false, message: 'Server authentication configuration error' });
  }

  try {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const admin = await adminsCollection.findOne({ email: normalizedEmail });

    if (!admin) {
      console.log('[Admin Login Failed] No admin account matching submitted email');
      return res.status(401).json({ success: false, message: FAIL_MSG });
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordMatch) {
      console.log('[Admin Login Failed] Password mismatch for submitted credentials');
      return res.status(401).json({ success: false, message: FAIL_MSG });
    }

    // Sign JWT — never include passwordHash in payload
    const token = signAdminToken(admin);

    console.log('[Admin Login Success] Admin authentication successful');
    // Return token only — never return passwordHash or password
    return res.json({ success: true, token });
  } catch (err) {
    console.error('[Admin Login Error]', err.message);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error' });
  }
});

// ─── Protected: Get Admin Profile ────────────────────────────────────────────

app.get(['/api/admin/profile', '/admin/profile'], authenticateAdmin, async (req, res) => {
  try {
    if (!adminsCollection) {
      return res.status(500).json({ success: false, message: 'Database unavailable' });
    }

    const admin = await adminsCollection.findOne(
      { _id: new ObjectId(req.admin.id) },
      { projection: { passwordHash: 0 } } // never return passwordHash
    );

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    return res.json({
      success: true,
      admin: { email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error('[Admin Profile Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// ─── Protected: Change Email ──────────────────────────────────────────────────

app.put(['/api/admin/change-email', '/admin/change-email'], authenticateAdmin, async (req, res) => {
  const { newEmail, currentPassword } = req.body || {};

  if (!newEmail || !currentPassword) {
    return res.status(400).json({ success: false, message: 'New email and current password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }

  try {
    if (!adminsCollection) {
      return res.status(500).json({ success: false, message: 'Database unavailable' });
    }

    // Fetch the current admin document
    const admin = await adminsCollection.findOne({ _id: new ObjectId(req.admin.id) });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Check if new email is already taken by another admin
    if (newEmail.toLowerCase() !== admin.email.toLowerCase()) {
      const emailExists = await adminsCollection.findOne({ email: newEmail.toLowerCase() });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'Email is already in use' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'New email must be different from current email' });
    }

    // Update email and increment authVersion to immediately invalidate existing JWT sessions
    const newAuthVersion = (admin.authVersion || 1) + 1;
    await adminsCollection.updateOne(
      { _id: admin._id },
      { $set: { email: newEmail.toLowerCase(), authVersion: newAuthVersion, updatedAt: new Date() } }
    );

    console.log(`[Admin Change Email] Email updated for admin ID: ${req.admin.id}`);
    return res.json({ success: true, message: 'Email updated successfully. Please log in again.' });
  } catch (err) {
    console.error('[Admin Change Email Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update email' });
  }
});

// ─── Protected: Change Password ──────────────────────────────────────────────

app.put(['/api/admin/change-password', '/admin/change-password'], authenticateAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  }

  try {
    if (!adminsCollection) {
      return res.status(500).json({ success: false, message: 'Database unavailable' });
    }

    const admin = await adminsCollection.findOne({ _id: new ObjectId(req.admin.id) });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // New password must differ from the current one
    const samePassword = await bcrypt.compare(newPassword, admin.passwordHash);
    if (samePassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    // Hash new password and increment authVersion to immediately invalidate existing JWT sessions
    const newHash = await bcrypt.hash(newPassword, 12);
    const newAuthVersion = (admin.authVersion || 1) + 1;

    await adminsCollection.updateOne(
      { _id: admin._id },
      { $set: { passwordHash: newHash, authVersion: newAuthVersion, passwordChangedAt: new Date() } }
    );

    console.log(`[Admin Change Password] Password updated for admin ID: ${req.admin.id}`);
    // Frontend must clear the token and force re-login after password change
    return res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    console.error('[Admin Change Password Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ─── Public: Forgot Password ─────────────────────────────────────────────────
// Always returns the same message regardless of whether the email exists

app.post(['/api/admin/forgot-password', '/admin/forgot-password'], async (req, res) => {
  const { email } = req.body || {};

  // Always return the same response — never reveal whether the email exists
  const GENERIC_MSG = 'If an account exists with that email, password reset instructions have been sent.';

  if (!email) {
    return res.json({ success: true, message: GENERIC_MSG });
  }

  try {
    if (!adminsCollection || !adminPasswordResetsCollection) {
      // Still return generic message — do not expose DB state
      return res.json({ success: true, message: GENERIC_MSG });
    }

    const admin = await adminsCollection.findOne({ email: email.toLowerCase() });

    if (admin) {
      // Delete any existing unused reset tokens for this admin
      await adminPasswordResetsCollection.deleteMany({ adminId: admin._id });

      // Generate a cryptographically secure random token (NOT derived from JWT_SECRET)
      const rawToken = crypto.randomBytes(32).toString('hex');

      // Store only the HASH of the token in the database
      const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      await adminPasswordResetsCollection.insertOne({
        adminId: admin._id,
        resetTokenHash,
        resetTokenExpiresAt: expiresAt,
        used: false,
        createdAt: new Date(),
      });

      // ── Email delivery via Resend ──────────────────────────────────────────
      const appUrl = getAppUrl();
      const resetUrl = `${appUrl}/admin/reset-password?token=${rawToken}`;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      if (resend) {
        try {
          const { data, error: sendError } = await resend.emails.send({
            from: `MES Complaint Corner <${fromEmail}>`,
            to: [admin.email],
            subject: 'MES Complaint Corner — Reset Your Admin Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
                  <h2 style="color: #1e3a5f; margin: 0; font-size: 24px;">MES Complaint Corner</h2>
                  <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Management by Efficiency &amp; Synergy</p>
                </div>
                <div style="padding: 24px 0;">
                  <h3 style="color: #1e293b; margin-top: 0;">Admin Password Reset Request</h3>
                  <p style="color: #334155; line-height: 1.6;">Hello,</p>
                  <p style="color: #334155; line-height: 1.6;">A password reset was requested for your administrator account on the MES Complaint Corner platform.</p>
                  <p style="color: #334155; line-height: 1.6;">Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                  </div>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
                  &copy; 2026 MES Complaint Corner. All rights reserved.
                </div>
              </div>
            `,
            text: `MES Complaint Corner — Admin Password Reset Request\n\nHello,\n\nA password reset was requested for your administrator account on the MES Complaint Corner platform.\n\nTo reset your password, visit the following link (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.\n\n© 2026 MES Complaint Corner. All rights reserved.`,
          });

          if (sendError) {
            console.error('[Forgot Password] Resend API Error:', {
              statusCode: sendError.statusCode || sendError.status || 400,
              name: sendError.name || 'Error',
              message: sendError.message,
            });
          } else {
            console.log(`[Forgot Password] Email accepted by Resend (ID: ${data?.id || 'ok'})`);
          }
        } catch (emailErr) {
          console.error('[Forgot Password] Resend Exception:', emailErr.message || 'Unknown error');
        }
      } else {
        console.warn('[Forgot Password] Resend API key is not configured in environment variables.');
      }
    }

    return res.json({ success: true, message: GENERIC_MSG });
  } catch (err) {
    console.error('[Forgot Password Error]', err.message);
    // Still return generic message — do not leak error details
    return res.json({ success: true, message: GENERIC_MSG });
  }
});

// ─── Public: Reset Password ───────────────────────────────────────────────────

app.post(['/api/admin/reset-password', '/admin/reset-password'], async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    if (!adminsCollection || !adminPasswordResetsCollection) {
      return res.status(500).json({ success: false, message: 'Database unavailable' });
    }

    // Hash the incoming raw token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find a valid, unused, unexpired reset record
    const resetRecord = await adminPasswordResetsCollection.findOne({
      resetTokenHash,
      used: false,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid, expired, or already used reset token' });
    }

    const admin = await adminsCollection.findOne({ _id: resetRecord.adminId });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Hash new password with bcrypt (12 rounds)
    const newHash = await bcrypt.hash(newPassword, 12);
    const newAuthVersion = (admin.authVersion || 1) + 1;

    // Update password and increment authVersion to invalidate existing sessions
    await adminsCollection.updateOne(
      { _id: admin._id },
      { $set: { passwordHash: newHash, authVersion: newAuthVersion, passwordChangedAt: new Date() } }
    );

    // Immediately invalidate the used token
    await adminPasswordResetsCollection.deleteOne({ _id: resetRecord._id });

    console.log(`[Reset Password] Password reset successfully for admin ID: ${admin._id}`);
    return res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[Reset Password Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// ─── Public: Submit a new complaint ──────────────────────────────────────────
// No auth required — public users submit complaints

app.post(['/api/complaints', '/complaints'], async (req, res) => {
  console.log('[POST /api/complaints] Request received for complaint submission');
  try {
    if (!complaintsCollection || !db) {
      console.log('[POST /api/complaints] Database handle missing, attempting connectDB()...');
      await connectDB();
    }
    if (!complaintsCollection || !db) {
      console.error('[POST /api/complaints] Connection Failed: Database handle unavailable');
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    console.log(`[POST /api/complaints] Database Name: ${db.databaseName}`);
    console.log(`[POST /api/complaints] Collection Name: ${complaintsCollection.collectionName}`);

    const newComplaint = {
      ...req.body,
      created_at: new Date().toISOString().split('T')[0],
    };

    const result = await complaintsCollection.insertOne(newComplaint);

    if (result.acknowledged && result.insertedId) {
      console.log(`[POST /api/complaints] insertOne SUCCESS — Inserted Document ID: ${result.insertedId}`);
      return res.status(201).json({ success: true, complaint: { ...newComplaint, _id: result.insertedId } });
    } else {
      console.error('[POST /api/complaints] insertOne FAILURE — Write not acknowledged by MongoDB');
      return res.status(500).json({ success: false, message: 'Failed to insert complaint into database' });
    }
  } catch (error) {
    console.error('[POST /api/complaints] insertOne EXCEPTION:', error.message || error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit complaint' });
  }
});

// ─── Public: Track complaints by mobile number or complaint ID ────────────────
app.get(['/api/complaints/track/:query', '/complaints/track/:query'], async (req, res) => {
  const { query } = req.params;
  try {
    if (!complaintsCollection) {
      await connectDB();
    }
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    const cleanQuery = decodeURIComponent(query || '').trim();
    let records = [];

    // Search by ObjectId if 24 hex characters
    if (ObjectId.isValid(cleanQuery) && String(new ObjectId(cleanQuery)) === cleanQuery) {
      const doc = await complaintsCollection.findOne({ _id: new ObjectId(cleanQuery) });
      if (doc) records.push(doc);
    }

    // Search by complaintId field if not found by _id
    if (records.length === 0) {
      records = await complaintsCollection.find({ complaintId: cleanQuery }).toArray();
    }

    // Search by mobile number if not found by complaintId
    if (records.length === 0) {
      records = await complaintsCollection.find({ mobile: cleanQuery }).sort({ _id: -1 }).toArray();
    }

    res.json({ success: true, complaints: records });
  } catch (error) {
    console.error('[Track] Error searching complaints:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to fetch tracking data' });
  }
});

// ─── Public: Track a single complaint by ID ──────────────────────────────────
// No auth required — public users track their complaint status

app.get(['/api/complaints/:id', '/complaints/:id'], async (req, res) => {
  const { id } = req.params;
  try {
    if (!complaintsCollection) {
      await connectDB();
    }
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Database connection unavailable' });
    }

    // First try by complaintId field
    let complaint = await complaintsCollection.findOne({ complaintId: id });

    // Fallback: try by MongoDB _id if valid ObjectId
    if (!complaint && ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      complaint = await complaintsCollection.findOne({ _id: new ObjectId(id) });
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    console.error('Error fetching complaint:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaint' });
  }
});

// ─── SuperAdmin Login ─────────────────────────────────────────────────────────

app.post(['/api/super-admin/login', '/super-admin/login'], async (req, res) => {
  const { email, password } = req.body || {};
  console.log(`[SuperAdmin Login Attempt] Method: ${req.method} | Path: ${req.url}`);

  const FAIL_MSG = 'Invalid email or password';

  if (!email || !password) {
    return res.status(401).json({ success: false, message: FAIL_MSG });
  }

  if (!superAdminsCollection && !adminsCollection) {
    return res.status(500).json({ success: false, message: 'Database unavailable. Please try again later.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server authentication configuration error' });
  }

  try {
    const targetEmail = (email || '').trim().toLowerCase();
    let superadmin = await superAdminsCollection.findOne({ email: targetEmail });
    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne({ email: targetEmail, role: 'superadmin' });
    }

    if (!superadmin || superadmin.role !== 'superadmin') {
      console.log('[SuperAdmin Login Failed] No superadmin account matching submitted email');
      return res.status(401).json({ success: false, message: FAIL_MSG });
    }

    const passwordMatch = await bcrypt.compare(password, superadmin.passwordHash);
    if (!passwordMatch) {
      console.log('[SuperAdmin Login Failed] Password mismatch for submitted credentials');
      return res.status(401).json({ success: false, message: FAIL_MSG });
    }

    const token = signSuperAdminToken(superadmin);
    console.log('[SuperAdmin Login Success] SuperAdmin authentication successful');
    return res.json({ success: true, token });
  } catch (err) {
    console.error('[SuperAdmin Login Error]', err.message);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error' });
  }
});

// ─── Protected: Get SuperAdmin Profile ────────────────────────────────────────

app.get(['/api/super-admin/profile', '/super-admin/profile'], authenticateSuperAdmin, async (req, res) => {
  try {
    let superadmin = await superAdminsCollection.findOne(
      { _id: new ObjectId(req.superadmin.id) },
      { projection: { passwordHash: 0 } }
    );
    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne(
        { _id: new ObjectId(req.superadmin.id), role: 'superadmin' },
        { projection: { passwordHash: 0 } }
      );
    }

    if (!superadmin) {
      return res.status(404).json({ success: false, message: 'SuperAdmin account not found' });
    }

    return res.json({
      success: true,
      superadmin: { email: superadmin.email, role: 'superadmin', createdAt: superadmin.createdAt },
    });
  } catch (err) {
    console.error('[SuperAdmin Profile Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// ─── Protected: SuperAdmin Change Email ───────────────────────────────────────

app.put(['/api/super-admin/change-email', '/super-admin/change-email'], authenticateSuperAdmin, async (req, res) => {
  const { newEmail, currentPassword } = req.body || {};

  if (!newEmail || !currentPassword) {
    return res.status(400).json({ success: false, message: 'New email and current password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }

  try {
    let col = superAdminsCollection;
    let superadmin = await superAdminsCollection.findOne({ _id: new ObjectId(req.superadmin.id) });
    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne({ _id: new ObjectId(req.superadmin.id), role: 'superadmin' });
      col = adminsCollection;
    }

    if (!superadmin) {
      return res.status(404).json({ success: false, message: 'SuperAdmin account not found' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, superadmin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const targetEmail = newEmail.trim().toLowerCase();
    if (targetEmail === superadmin.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'New email must be different from current email' });
    }

    const inSuper = await superAdminsCollection.findOne({ email: targetEmail });
    const inAdmin = await adminsCollection.findOne({ email: targetEmail });
    if (inSuper || inAdmin) {
      return res.status(409).json({ success: false, message: 'Email is already in use' });
    }

    const newAuthVersion = (superadmin.authVersion || 1) + 1;
    await col.updateOne(
      { _id: superadmin._id },
      { $set: { email: targetEmail, authVersion: newAuthVersion, updatedAt: new Date() } }
    );

    console.log(`[SuperAdmin Change Email] Updated for ID: ${req.superadmin.id}`);
    return res.json({ success: true, message: 'Email updated successfully. Please log in again.' });
  } catch (err) {
    console.error('[SuperAdmin Change Email Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update email' });
  }
});

// ─── Protected: SuperAdmin Change Password ────────────────────────────────────

app.put(['/api/super-admin/change-password', '/super-admin/change-password'], authenticateSuperAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  }

  try {
    let col = superAdminsCollection;
    let superadmin = await superAdminsCollection.findOne({ _id: new ObjectId(req.superadmin.id) });
    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne({ _id: new ObjectId(req.superadmin.id), role: 'superadmin' });
      col = adminsCollection;
    }

    if (!superadmin) {
      return res.status(404).json({ success: false, message: 'SuperAdmin account not found' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, superadmin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const samePassword = await bcrypt.compare(newPassword, superadmin.passwordHash);
    if (samePassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const newAuthVersion = (superadmin.authVersion || 1) + 1;

    await col.updateOne(
      { _id: superadmin._id },
      { $set: { passwordHash: newHash, authVersion: newAuthVersion, passwordChangedAt: new Date() } }
    );

    console.log(`[SuperAdmin Change Password] Updated for ID: ${req.superadmin.id}`);
    return res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    console.error('[SuperAdmin Change Password Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ─── Public: SuperAdmin Forgot Password ──────────────────────────────────────

app.post(['/api/super-admin/forgot-password', '/super-admin/forgot-password'], async (req, res) => {
  const { email } = req.body || {};
  const GENERIC_MSG = 'If an account exists with that email, password reset instructions have been sent.';

  if (!email) {
    return res.json({ success: true, message: GENERIC_MSG });
  }

  try {
    const targetEmail = email.trim().toLowerCase();
    let superadmin = await superAdminsCollection.findOne({ email: targetEmail });
    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne({ email: targetEmail, role: 'superadmin' });
    }

    if (superadmin) {
      await superAdminPasswordResetsCollection.deleteMany({ superAdminId: superadmin._id });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await superAdminPasswordResetsCollection.insertOne({
        superAdminId: superadmin._id,
        resetTokenHash,
        resetTokenExpiresAt: expiresAt,
        used: false,
        createdAt: new Date(),
      });

      const appUrl = getAppUrl();
      const resetUrl = `${appUrl}/super-admin/reset-password?token=${rawToken}`;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      if (resend) {
        try {
          await resend.emails.send({
            from: `MES Complaint Corner <${fromEmail}>`,
            to: [superadmin.email],
            subject: 'MES Complaint Corner — Reset Your SuperAdmin Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #dc2626;">
                  <h2 style="color: #1e3a5f; margin: 0; font-size: 24px;">MES Complaint Corner</h2>
                  <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">SuperAdmin Restricted Access</p>
                </div>
                <div style="padding: 24px 0;">
                  <h3 style="color: #1e293b; margin-top: 0;">SuperAdmin Password Reset Request</h3>
                  <p style="color: #334155; line-height: 1.6;">Hello,</p>
                  <p style="color: #334155; line-height: 1.6;">A password reset was requested for your SuperAdmin account on the MES Complaint Corner platform.</p>
                  <p style="color: #334155; line-height: 1.6;">Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset SuperAdmin Password</a>
                  </div>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email.</p>
                </div>
                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
                  &copy; 2026 MES Complaint Corner. All rights reserved.
                </div>
              </div>
            `,
            text: `MES Complaint Corner — SuperAdmin Password Reset Request\n\nHello,\n\nA password reset was requested for your SuperAdmin account.\n\nTo reset your password, visit:\n${resetUrl}\n\nValid for 15 minutes.`,
          });
          console.log(`[SuperAdmin Forgot Password] Email sent to: ${superadmin.email}`);
        } catch (emailErr) {
          console.error('[SuperAdmin Forgot Password] Resend Exception:', emailErr.message);
        }
      }
    }

    return res.json({ success: true, message: GENERIC_MSG });
  } catch (err) {
    console.error('[SuperAdmin Forgot Password Error]', err.message);
    return res.json({ success: true, message: GENERIC_MSG });
  }
});

// ─── Public: SuperAdmin Reset Password ───────────────────────────────────────

app.post(['/api/super-admin/reset-password', '/super-admin/reset-password'], async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await superAdminPasswordResetsCollection.findOne({
      resetTokenHash,
      used: false,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid, expired, or already used reset token' });
    }

    let col = superAdminsCollection;
    let superadmin = await superAdminsCollection.findOne({ _id: resetRecord.superAdminId });
    if (!superadmin && adminsCollection) {
      superadmin = await adminsCollection.findOne({ _id: resetRecord.superAdminId, role: 'superadmin' });
      col = adminsCollection;
    }

    if (!superadmin) {
      return res.status(404).json({ success: false, message: 'SuperAdmin account not found' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const newAuthVersion = (superadmin.authVersion || 1) + 1;

    await col.updateOne(
      { _id: superadmin._id },
      { $set: { passwordHash: newHash, authVersion: newAuthVersion, passwordChangedAt: new Date() } }
    );

    await superAdminPasswordResetsCollection.deleteOne({ _id: resetRecord._id });

    console.log(`[SuperAdmin Reset Password] Password reset successfully for ID: ${superadmin._id}`);
    return res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[SuperAdmin Reset Password Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// ─── Protected: Get all complaints (Admin & SuperAdmin) ──────────────────────

app.get(['/api/complaints', '/complaints'], authenticateAnyAdmin, async (req, res) => {
  try {
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Unable to connect to MongoDB' });
    }
    const complaints = await complaintsCollection.find({}).sort({ _id: -1 }).toArray();
    res.json({ success: true, complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// ─── Protected: Update complaint status (Admin & SuperAdmin) ──────────────────

app.put(['/api/complaints/:id/status', '/complaints/:id/status'], authenticateAnyAdmin, async (req, res) => {
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

// ─── Protected: Delete a complaint (SuperAdmin only) ──────────────────────────

app.delete(['/api/complaints/:id', '/complaints/:id'], authenticateSuperAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`[API Request] DELETE complaint ID: ${id}`);
  try {
    if (!complaintsCollection) {
      return res.status(500).json({ success: false, message: 'Unable to connect to MongoDB' });
    }

    let filter = {};
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { _id: id };
    }

    let result = await complaintsCollection.deleteOne(filter);

    if (result.deletedCount === 0) {
      result = await complaintsCollection.deleteOne({ complaintId: id });
    }

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    console.log(`[API Delete Success] Deleted complaint ID: ${id}`);
    res.json({ success: true, message: 'Complaint deleted successfully', id });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to delete complaint' });
  }
});

// ─── Fallback 404 ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  console.log(`[API 404 Fallback] Unmatched route: ${req.method} ${req.originalUrl || req.url}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    method: req.method,
    path: req.url,
  });
});

// ─── Fallback 500 ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[API 500 Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Local Dev Server ─────────────────────────────────────────────────────────

if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT) {
  app.listen(PORT, '0.0.0.0', () => {
    const lanIp = getLanIp();
    console.log(`Server running on http://127.0.0.1:${PORT} and http://${lanIp}:${PORT}`);
  });
}

export default app;
