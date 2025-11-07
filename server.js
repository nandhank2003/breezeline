// server.js – Breezeline Interiors (Render Optimized)
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Render-specific optimizations
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
    features: ['estimation-calculator', 'email-notifications', 'render-optimized']
  });
});

// ===== ESTIMATION FUNCTIONALITY =====
const PRICE_LIST = {
  '1BHK': { Standard: 2600, Premium: 3200 },
  '2BHK': { Standard: 3500, Premium: 4000 },
  '3BHK': { Standard: 4500, Premium: 5000 },
  'Studio Apartment': { Standard: 2200, Premium: 2800 },
  'Office': { Standard: 4200, Premium: 4800 },
  'Retail Shops': { Standard: 5500, Premium: 6500 },
  'F&B': { Standard: 5800, Premium: 6500 },
  'Villa Renovation': { Standard: 6500, Premium: 9000 }
};

// In-memory storage for estimations
let estimations = [];
let estimationIdCounter = 1;

// Email configuration with Render compatibility
const createTransporter = () => {
  // For Render, you can use Gmail or other services
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email Templates
const createUserEmailTemplate = (userName, projectType, projectClass, area, formattedPrice) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Estimation - Breezeline Interiors</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; }
        .header { background: #2c3e50; padding: 30px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 30px; }
        .estimation-card { background: #f8f8f8; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .total-price { background: #34495e; color: white; padding: 20px; text-align: center; margin: 25px 0; font-size: 22px; font-weight: bold; }
        .next-steps { background: #ecf0f1; padding: 20px; border: 1px solid #bdc3c7; margin: 25px 0; }
        .footer { background: #34495e; color: #ecf0f1; padding: 25px 20px; text-align: center; font-size: 14px; }
        .contact-info { background: #e8f4f8; padding: 15px; border: 1px solid #3498db; margin: 20px 0; }
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
                <h3 style="color: #2c3e50; margin-top: 0;">Project Details</h3>
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
            <div class="total-price">Estimated Total: ${formattedPrice}</div>
            <div class="next-steps">
                <h3 style="color: #2c3e50; margin-top: 0;">Next Steps</h3>
                <p>Our design team will contact you within 24 hours to discuss your project.</p>
            </div>
            <div class="contact-info">
                <h4 style="color: #2c3e50; margin-top: 0;">Contact Information</h4>
                <p><strong>Phone:</strong> +971 58 985 0165</p>
                <p><strong>Email:</strong> info@breezelineinteriors.com</p>
            </div>
        </div>
        <div class="footer">
            <p><strong>Breezeline Interiors</strong></p>
            <p>Dubai, United Arab Emirates</p>
            <p>&copy; 2024 Breezeline Interiors. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; }
        .header { background: #c0392b; padding: 25px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 22px; font-weight: bold; }
        .content { padding: 25px; }
        .alert-badge { background: #ffebee; color: #c62828; padding: 12px; border: 1px solid #c62828; font-weight: bold; margin-bottom: 20px; text-align: center; }
        .estimation-details { background: #f8f8f8; border: 1px solid #e0e0e0; padding: 20px; margin: 15px 0; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
        .detail-item { padding: 12px; background: white; border: 1px solid #e0e0e0; }
        .detail-label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
        .detail-value { font-weight: 500; color: #333; font-size: 14px; }
        .client-info { background: #e8f5e8; padding: 20px; border: 1px solid #4caf50; margin: 20px 0; }
        .total-section { background: #34495e; color: white; padding: 20px; text-align: center; margin: 20px 0; }
        .footer { background: #34495e; color: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Estimation Request Received</h1>
            <p>Breezeline Interiors - Lead Notification</p>
        </div>
        <div class="content">
            <div class="alert-badge">NEW LEAD - ${projectType} Project - Immediate Attention Required</div>
            <div class="total-section">
                <h2 style="margin: 0; font-size: 26px;">${formattedPrice}</h2>
                <p style="margin: 5px 0 0 0;">Estimated Project Value</p>
            </div>
            <div class="estimation-details">
                <h3 style="color: #2c3e50; margin-top: 0;">Project Specifications</h3>
                <div class="detail-grid">
                    <div class="detail-item"><div class="detail-label">Project Type</div><div class="detail-value">${projectType}</div></div>
                    <div class="detail-item"><div class="detail-label">Service Class</div><div class="detail-value">${projectClass}</div></div>
                    <div class="detail-item"><div class="detail-label">Area</div><div class="detail-value">${area} sqm.</div></div>
                    <div class="detail-item"><div class="detail-label">Date Submitted</div><div class="detail-value">${new Date().toLocaleDateString()}</div></div>
                </div>
            </div>
            <div class="client-info">
                <h3 style="color: #2c3e50; margin-top: 0;">Client Information</h3>
                <div class="detail-grid">
                    <div class="detail-item"><div class="detail-label">Client Name</div><div class="detail-value">${userName || 'Not Provided'}</div></div>
                    <div class="detail-item"><div class="detail-label">Phone Number</div><div class="detail-value">${phone || 'Not Provided'}</div></div>
                    <div class="detail-item"><div class="detail-label">Email Address</div><div class="detail-value">${email || 'Not Provided'}</div></div>
                    <div class="detail-item"><div class="detail-label">Lead Status</div><div class="detail-value" style="color: #27ae60;">NEW</div></div>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>Breezeline Interiors CRM System | Automated Lead Notification</p>
        </div>
    </div>
</body>
</html>`;
};

// ===== API ROUTES =====

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
    
    // Keep only last 1000 estimations to prevent memory issues
    if (estimations.length > 1000) {
      estimations = estimations.slice(-1000);
    }

    const formattedPrice = new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED' 
    }).format(totalPrice);

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

// 4. Get recent estimations (for admin view)
app.get('/api/estimations', (req, res) => {
  try {
    const recentEstimations = estimations
      .slice(-50) // Last 50 estimations
      .reverse(); // Newest first

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
      data: recentEstimations,
      stats: stats
    });
  } catch (error) {
    console.error('Get estimations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get estimations' });
  }
});

// 5. Get estimation statistics
app.get('/api/estimation-stats', (req, res) => {
  try {
    const totalEstimations = estimations.length;
    const thisMonthEstimations = estimations.filter(e => {
      const estDate = new Date(e.createdAt);
      const now = new Date();
      return estDate.getMonth() === now.getMonth() && estDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalValue = estimations.reduce((sum, e) => sum + e.totalPrice, 0);

    res.json({
      success: true,
      data: {
        totalEstimations,
        thisMonthEstimations,
        totalValue: totalValue
      }
    });
  } catch (error) {
    console.error('Estimation stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get estimation stats' });
  }
});

// 6. Clear estimations (for maintenance)
app.delete('/api/estimations', (req, res) => {
  estimations = [];
  estimationIdCounter = 1;
  res.json({ success: true, message: 'All estimations cleared' });
});

// ===== FRONTEND ROUTES =====

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calculator.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    availableEndpoints: [
      'GET  /health',
      'GET  /api/info',
      'GET  /api/price-list',
      'POST /api/calculate-estimation',
      'POST /api/submit-estimation',
      'GET  /api/estimations',
      'GET  /api/estimation-stats'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server with Render optimizations
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Breezeline Interiors Server Started on Render');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: https://olive-lark-556337.hostingersite.com`);
  console.log(`❤️  Health Check: /health`);
  
  console.log('\n📊 Available Endpoints:');
  console.log('   ✅ GET  /health - Service health check');
  console.log('   ✅ GET  /api/price-list - Get price data');
  console.log('   ✅ POST /api/calculate-estimation - Calculate price');
  console.log('   ✅ POST /api/submit-estimation - Submit & email estimation');
  console.log('   ✅ GET  /api/estimations - Get recent estimations');
  
  console.log('\n📧 Email System:');
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('   ✅ Email notifications ENABLED');
  } else {
    console.log('   ⚠️  Email notifications DISABLED - Set EMAIL_USER and EMAIL_PASS');
  }
  
  console.log('\n✅ Server is fully operational and ready for frontend connections!');
});