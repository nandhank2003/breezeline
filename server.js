// server.js – Breezeline Interiors (No MongoDB - Render Optimized)
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Render-specific optimizations
app.use(cors({
  origin: ['https://olive-lark-556337.hostingersite.com/', 'http://localhost:3000', '*'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Breezeline Interiors API'
  });
});

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

// In-memory storage for estimations
let estimations = [];
let estimationIdCounter = 1;

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email Templates (keep your existing templates)
const createUserEmailTemplate = (userName, projectType, projectClass, area, formattedPrice) => {
  return `...your existing email template...`;
};

const createAdminEmailTemplate = (userName, projectType, projectClass, area, formattedPrice, phone, email) => {
  return `...your existing email template...`;
};

// API Routes
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
    const formattedPrice = new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED' 
    }).format(totalPrice);

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

app.get('/api/price-list', (req, res) => {
  res.json({
    success: true,
    data: PRICE_LIST
  });
});

app.post('/api/submit-estimation', async (req, res) => {
  try {
    const { projectType, projectClass, area, phone, email, userName, totalPrice } = req.body;

    if (!projectType || !projectClass || !area || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Project type, class, area, and total price are required'
      });
    }

    // Store estimation in memory
    const estimation = {
      id: estimationIdCounter++,
      projectType,
      projectClass,
      area: parseFloat(area),
      totalPrice: parseFloat(totalPrice),
      phone: phone || 'Not provided',
      email: email || 'Not provided',
      userName: userName || 'Anonymous',
      createdAt: new Date().toISOString()
    };

    estimations.push(estimation);
    
    // Keep only last 1000 estimations
    if (estimations.length > 1000) {
      estimations = estimations.slice(-1000);
    }

    const formattedPrice = new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED' 
    }).format(totalPrice);

    // Send emails if configured
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

        // Email to USER if provided
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
      }
    }

    res.json({
      success: true,
      message: 'Estimation submitted successfully',
      data: {
        estimationId: estimation.id,
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Breezeline Interiors Server Started on Render');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Base URL: https://olive-lark-556337.hostingersite.com`);
  console.log(`📊 Estimation API: Ready for frontend connections!`);
});