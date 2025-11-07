// server.js – Breezeline Interiors (With Classic Standard Email Templates) - Render Optimized
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'works');

// Create uploads directory
fs.ensureDirSync(UPLOADS_DIR);

// Render-specific CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000', 
    'https://olive-lark-556337.hostingersite.com/', // Replace with your actual frontend domain
    '*'
  ],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Breezeline Interiors API',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Render deployment info
app.get('/api/info', (req, res) => {
  res.json({
    service: 'Breezeline Interiors Estimation API',
    version: '1.0.0',
    deployed: true,
    environment: process.env.NODE_ENV || 'development',
    features: ['estimation-calculator', 'email-notifications', 'mongo-database', 'render-optimized']
  });
});

// Database connection with Render compatibility
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/breezeline';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('📝 Note: MongoDB is required for full functionality. Using cloud MongoDB Atlas recommended for Render.');
  });

// Schemas
const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

const WorkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image_path: { type: String, required: true }
}, { timestamps: true });

// NEW: Estimation Schema
const EstimationSchema = new mongoose.Schema({
  projectType: { type: String, required: true },
  projectClass: { type: String, required: true },
  area: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  phone: { type: String },
  email: { type: String },
  userName: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
const Category = mongoose.model('Category', CategorySchema);
const Work = mongoose.model('Work', WorkSchema);
const Estimation = mongoose.model('Estimation', EstimationSchema);

// Session setup with MongoDB connection string
app.use(session({
  secret: process.env.SESSION_SECRET || 'breezline_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: { 
    maxAge: 14 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.ensureDirSync(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ success: false, error: 'Unauthorized' });
}

// ===== ESTIMATION FUNCTIONALITY =====
const PRICE_LIST = {
  '1BHK': { Standard: 2000, Premium: 2300 },
  '2BHK': { Standard: 2200, Premium: 2500 },
  '3BHK': { Standard: 2300, Premium: 2600 },
  'Studio Apartment': { Standard: 1600, Premium: 2000 },
  'Office': { Standard: 2600, Premium: 3000 },
  'Retail Shops': { Standard: 5500, Premium: 6500 },
  'F&B': { Standard: 5800, Premium: 6500 },
  'Villa Renovation': { Standard: 5000, Premium: 7000 }
};

// Email configuration with Render compatibility
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email Templates - Classic Standard Theme
const createUserEmailTemplate = (userName, projectType, projectClass, area, formattedPrice) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Estimation - Breezeline Interiors</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background: #f9f9f9;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border: 1px solid #ddd;
        }
        .header { 
            background: #2c3e50; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: bold;
        }
        .content { 
            padding: 30px; 
        }
        .estimation-card {
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .detail-value {
            color: #333;
        }
        .total-price {
            background: #34495e;
            color: white;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
            font-size: 22px;
            font-weight: bold;
            border: 2px solid #2c3e50;
        }
        .next-steps {
            background: #ecf0f1;
            padding: 20px;
            border: 1px solid #bdc3c7;
            margin: 25px 0;
        }
        .footer {
            background: #34495e;
            color: #ecf0f1;
            padding: 25px 20px;
            text-align: center;
            font-size: 14px;
        }
        .contact-info {
            background: #e8f4f8;
            padding: 15px;
            border: 1px solid #3498db;
            margin: 20px 0;
        }
        .note {
            font-style: italic;
            color: #7f8c8d;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Breezeline Interiors - Project Estimation</h1>
            <p>Professional Interior Design Services</p>
        </div>
        
        <div class="content">
            <h2>Dear ${userName || 'Valued Customer'},</h2>
            <p>Thank you for your interest in Breezeline Interiors. We are pleased to provide you with your personalized project estimation.</p>
            
            <div class="estimation-card">
                <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Project Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Project Type:</span>
                    <span class="detail-value">${projectType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Service Class:</span>
                    <span class="detail-value">${projectClass}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Area:</span>
                    <span class="detail-value">${area} square meters</span>
                </div>
            </div>
            
            <div class="total-price">
                Estimated Total: ${formattedPrice}
            </div>
            
            <div class="next-steps">
                <h3 style="color: #2c3e50; margin-top: 0;">Next Steps</h3>
                <p>Our design team will contact you within 24 hours to discuss your project requirements and schedule a consultation at your convenience.</p>
            </div>
            
            <div class="contact-info">
                <h4 style="color: #2c3e50; margin-top: 0;">Contact Information</h4>
                <p><strong>Phone:</strong> +971 58 985 0165</p>
                <p><strong>Email:</strong> info@breezelineinteriors.com</p>
                <p><strong>Business Hours:</strong> Sunday - Thursday, 9:00 AM - 6:00 PM</p>
            </div>
            
            <p class="note">
                "Transforming spaces with excellence and precision"
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Breezeline Interiors</strong></p>
            <p>Dubai, United Arab Emirates</p>
            <p>+971 4 123 4567 | info@breezelineinteriors.com</p>
            <p>&copy; 2024 Breezeline Interiors. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

const createAdminEmailTemplate = (userName, projectType, projectClass, area, formattedPrice, phone, email) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Estimation Request - Breezeline Interiors</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background: #f9f9f9;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border: 1px solid #ddd;
        }
        .header { 
            background: #c0392b; 
            padding: 25px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 22px; 
            font-weight: bold;
        }
        .content { 
            padding: 25px; 
        }
        .alert-badge {
            background: #ffebee;
            color: #c62828;
            padding: 12px;
            border: 1px solid #c62828;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
        }
        .estimation-details {
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin: 15px 0;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 15px 0;
        }
        .detail-item {
            padding: 12px;
            background: white;
            border: 1px solid #e0e0e0;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
        }
        .detail-value {
            font-weight: 500;
            color: #333;
            font-size: 14px;
        }
        .client-info {
            background: #e8f5e8;
            padding: 20px;
            border: 1px solid #4caf50;
            margin: 20px 0;
        }
        .total-section {
            background: #34495e;
            color: white;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border: 2px solid #2c3e50;
        }
        .action-buttons {
            text-align: center;
            margin: 25px 0;
        }
        .action-button {
            display: inline-block;
            background: #2980b9;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border: 1px solid #2471a3;
            margin: 0 10px;
            font-weight: bold;
        }
        .footer {
            background: #34495e;
            color: #ecf0f1;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
        .timestamp {
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Estimation Request Received</h1>
            <p>Breezeline Interiors - Lead Notification</p>
        </div>
        
        <div class="content">
            <div class="alert-badge">
                NEW LEAD - ${projectType} Project - Immediate Attention Required
            </div>
            
            <div class="total-section">
                <h2 style="margin: 0; font-size: 26px;">${formattedPrice}</h2>
                <p style="margin: 5px 0 0 0;">Estimated Project Value</p>
            </div>
            
            <div class="estimation-details">
                <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Project Specifications</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Project Type</div>
                        <div class="detail-value">${projectType}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Service Class</div>
                        <div class="detail-value">${projectClass}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Area</div>
                        <div class="detail-value">${area} sqm.</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date Submitted</div>
                        <div class="detail-value">${new Date().toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
            
            <div class="client-info">
                <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 1px solid #4caf50; padding-bottom: 10px;">Client Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Client Name</div>
                        <div class="detail-value">${userName || 'Not Provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Phone Number</div>
                        <div class="detail-value">${phone || 'Not Provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Email Address</div>
                        <div class="detail-value">${email || 'Not Provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Lead Status</div>
                        <div class="detail-value" style="color: #27ae60;">NEW</div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <a href="mailto:${email || '#'}" class="action-button">Email Client</a>
                <a href="tel:${phone || '#'}" class="action-button">Call Client</a>
            </div>
            
            <div class="timestamp">
                <strong>Response Time Target:</strong> Within 4 business hours<br>
                Received: ${new Date().toLocaleString()}
            </div>
        </div>
        
        <div class="footer">
            <p>Breezeline Interiors CRM System | Automated Lead Notification</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// 1. Calculate estimation (for instant calculation)
app.post('/api/calculate-estimation', async (req, res) => {
  try {
    const { projectType, projectClass, area } = req.body;

    if (!projectType || !projectClass || !area) {
      return res.status(400).json({
        success: false,
        message: 'Project type, class, and area are required'
      });
    }

    const pricePerSqFt = PRICE_LIST[projectType]?.[projectClass];
    if (!pricePerSqFt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project type or class'
      });
    }

    const totalPrice = pricePerSqFt * parseFloat(area);
    const formattedPrice = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalPrice);

    res.json({
      success: true,
      data: {
        projectType,
        projectClass,
        area: parseFloat(area),
        pricePerSqFt,
        totalPrice,
        formattedPrice
      }
    });
  } catch (error) {
    console.error('Estimation calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate estimation'
    });
  }
});

// 2. Get price list for frontend
app.get('/api/price-list', (req, res) => {
  res.json({
    success: true,
    data: PRICE_LIST
  });
});

// 3. Submit estimation with contact info
app.post('/api/submit-estimation', async (req, res) => {
  try {
    const { projectType, projectClass, area, phone, email, userName, totalPrice } = req.body;

    if (!projectType || !projectClass || !area || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Project type, class, area, and total price are required'
      });
    }

    // Save to database
    const estimation = await Estimation.create({
      projectType,
      projectClass,
      area: parseFloat(area),
      totalPrice: parseFloat(totalPrice),
      phone: phone || 'Not provided',
      email: email || 'Not provided',
      userName: userName || 'Anonymous'
    });

    const formattedPrice = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalPrice);

    // Send emails if email configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = createTransporter();
        
        // Email to ADMIN
        await transporter.sendMail({
          from: `"Breezeline Interiors" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: `New ${projectType} Estimation - ${formattedPrice}`,
          html: createAdminEmailTemplate(userName, projectType, projectClass, area, formattedPrice, phone, email)
        });

        // Email to USER if they provided email
        if (email && email !== 'Not provided') {
          await transporter.sendMail({
            from: `"Breezeline Interiors" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your ${projectType} Estimation - ${formattedPrice}`,
            html: createUserEmailTemplate(userName, projectType, projectClass, area, formattedPrice)
          });
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Estimation submitted successfully',
      data: {
        estimationId: estimation._id,
        totalPrice: estimation.totalPrice,
        formattedPrice: formattedPrice,
        userEmailSent: !!(email && email !== 'Not provided')
      }
    });
  } catch (error) {
    console.error('Estimation submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit estimation'
    });
  }
});

// 4. COMPATIBILITY ROUTE - Keep the old endpoint working
app.post('/submit-estimation', async (req, res) => {
  try {
    const { projectType, projectClass, area, phone, email, totalPrice } = req.body;

    if (!projectType || !projectClass || !area || !phone || !email || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Save to database
    await Estimation.create({
      projectType,
      projectClass,
      area: parseFloat(area),
      totalPrice: parseFloat(totalPrice),
      phone: phone,
      email: email,
      userName: 'From Old Form'
    });

    const formattedPrice = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalPrice);

    // Send emails
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = createTransporter();
        
        // Email to ADMIN
        await transporter.sendMail({
          from: `"Breezeline Interiors" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: `New ${projectType} Estimation - ${formattedPrice}`,
          html: createAdminEmailTemplate('From Old Form', projectType, projectClass, area, formattedPrice, phone, email)
        });

        // Email to USER
        await transporter.sendMail({
          from: `"Breezeline Interiors" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Your ${projectType} Estimation - ${formattedPrice}`,
          html: createUserEmailTemplate('Valued Customer', projectType, projectClass, area, formattedPrice)
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.json({ 
      success: true, 
      message: 'Estimation submitted successfully' 
    });
  } catch (error) {
    console.error('Estimation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit estimation' 
    });
  }
});

// 5. Get estimations for admin panel
app.get('/api/estimations', requireAuth, async (req, res) => {
  try {
    const estimations = await Estimation.find().sort({ createdAt: -1 }).lean();
    
    const stats = {
      total: estimations.length,
      thisMonth: estimations.filter(e => {
        const estDate = new Date(e.createdAt);
        const now = new Date();
        return estDate.getMonth() === now.getMonth() && estDate.getFullYear() === now.getFullYear();
      }).length,
      totalValue: estimations.reduce((sum, e) => sum + e.totalPrice, 0)
    };

    res.json({
      success: true,
      data: estimations,
      stats: stats
    });
  } catch (error) {
    console.error('Get estimations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get estimations' });
  }
});

// 6. Get estimation statistics for dashboard
app.get('/api/estimation-stats', requireAuth, async (req, res) => {
  try {
    const totalEstimations = await Estimation.countDocuments();
    const thisMonthEstimations = await Estimation.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    const totalValue = await Estimation.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEstimations,
        thisMonthEstimations,
        totalValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Estimation stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get estimation stats' });
  }
});

// ===== ADMIN PANEL API ROUTES (UNCHANGED) =====

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
    req.session.adminId = admin._id;
    res.json({ success: true, message: 'Logged in' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: !!req.session.adminId });
});

// Categories routes
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: cats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const cat = await Category.create({ name, description });
    res.json({ success: true, data: cat, message: 'Category created' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const cat = await Category.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
    if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    await Work.deleteMany({ category: req.params.id });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Works routes
app.get('/api/works', async (req, res) => {
  try {
    const works = await Work.find().populate('category', 'name').lean();
    const mapped = works.map(w => ({
      id: w._id,
      title: w.title,
      categoryId: w.category ? w.category._id : null,
      category_name: w.category ? w.category.name : '',
      image: w.image_path
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/works', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, category_id } = req.body;
    if (!title || !category_id || !req.file) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const work = await Work.create({
      title,
      category: category_id,
      image_path: `/uploads/works/${req.file.filename}`,
    });
    res.json({ success: true, data: work, message: 'Work added' });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ success: false, error: 'Server error' }); 
  }
});

app.put('/api/works/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ success: false, error: 'Work not found' });

    if (req.file) {
      work.image_path = `/uploads/works/${req.file.filename}`;
    }

    const { title, category_id } = req.body;
    if (title) work.title = title;
    if (category_id) work.category = category_id;

    await work.save();
    res.json({ success: true, data: work, message: 'Work updated' });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ success: false, error: 'Server error' }); 
  }
});

app.delete('/api/works/:id', requireAuth, async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ success: false, error: 'Work not found' });
    
    await Work.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Work deleted' });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ success: false, error: 'Server error' }); 
  }
});

// Dashboard
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const totalWorks = await Work.countDocuments();
    const recent = await Work.find().sort({ createdAt: -1 }).limit(10).lean();
    
    res.json({
      success: true,
      data: {
        totalCategories,
        totalWorks,
        recentUploads: recent.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== FRONTEND ROUTES =====

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-panel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

app.get('/project.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'project.html'));
});

// Initialize admin
async function initializeAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const existing = await Admin.findOne({ username });
    if (!existing) {
      const hash = await bcrypt.hash(password, 10);
      await Admin.create({ username, password: hash });
      console.log('✅ Default admin created');
    }
  } catch (error) {
    console.error('Admin init error:', error);
  }
}

// Start server with Render optimizations
app.listen(PORT, '0.0.0.0', async () => {
  console.log('\n🚀 Breezeline Interiors Server Starting on Render...');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Uploads: ${UPLOADS_DIR}`);
  
  await initializeAdmin();
  
  console.log('\n✅ Server is fully operational!');
  console.log(`🔗 Main Site: https://olive-lark-556337.hostingersite.com`);
  console.log(`🔗 Health Check: /health`);
  console.log(`🔗 API Info: /api/info`);
  console.log('\n📊 Estimation System Active:');
  console.log('   ✅ Real-time calculation API');
  console.log('   ✅ Database storage for estimations');
  console.log('   ✅ Email notifications (if configured)');
  console.log('   ✅ Frontend calculator integration ready');
  
  if (!process.env.MONGODB_URI) {
    console.log('\n⚠️  NOTE: Set MONGODB_URI environment variable for cloud MongoDB database');
  }
});