give me my api and server of the sendMemberDeleteData

this is my server
const express = require('express');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const Mailjet = require('node-mailjet');
const fetch = require('node-fetch');

console.log('MAILJET_API_KEY:', process.env.MAILJET_API_KEY ? 'Set' : 'Not Set');
console.log('MAILJET_SECRET_KEY:', process.env.MAILJET_SECRET_KEY ? 'Set' : 'Not Set');

const app = express();
const PORT = process.env.PORT || 10000;

// Constants for links
const WEBSITE_LINK = 'https://fivekiapp.onrender.com';
const DASHBOARD_LINK = 'https://fiveki.onrender.com';
const GMAIL_OWNER = '5kifinancials@gmail.com';

// CORS configuration
app.use(cors({
  origin: [
    'https://fiveki.onrender.com',
    'https://fivekiapp.onrender.com',
    'http://localhost:10000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mailjet Configuration
const createTransporter = async () => {
  try {
    console.log('[EMAIL] Using Mailjet email service');
    
    const mailjet = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    return {
      sendMail: async (mailOptions) => {
        try {
          console.log(`[MAILJET] Sending email to ${mailOptions.to}`);
          
          const request = mailjet
            .post('send', { version: 'v3.1' })
            .request({
              Messages: [
                {
                  From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME
                  },
                  To: [
                    {
                      Email: mailOptions.to,
                      Name: mailOptions.toName || mailOptions.to.split('@')[0]
                    }
                  ],
                  Subject: mailOptions.subject,
                  HTMLPart: mailOptions.html,
                  TextPart: mailOptions.text || mailOptions.subject.replace(/<[^>]*>/g, '')
                }
              ]
            });

          const result = await request;
          console.log('[MAILJET] Email sent successfully');
          return { 
            messageId: result.body.Messages[0].To[0].MessageID,
            envelope: { 
              from: process.env.MAILJET_FROM_EMAIL, 
              to: mailOptions.to 
            }
          };
        } catch (error) {
          console.error('[MAILJET ERROR] Failed to send email:', error);
          
          // More detailed error logging
          if (error.statusCode) {
            console.log(`[MAILJET] Status Code: ${error.statusCode}`);
          }
          if (error.response && error.response.body) {
            console.log(`[MAILJET] Error Details:`, error.response.body);
          }
          
          throw error;
        }
      },
      verify: () => Promise.resolve(true),
      close: () => Promise.resolve()
    };

  } catch (error) {
    console.error('[MAILJET ERROR] Failed to initialize Mailjet:', error);
    
    // Fallback to console logging
    console.log('[EMAIL] Using console logger as fallback');
    return {
      sendMail: (mailOptions) => {
        console.log('[EMAIL LOGGER] Would send email:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          from: mailOptions.from,
          html: mailOptions.html ? '(HTML content)' : mailOptions.text
        });
        return Promise.resolve({ 
          messageId: 'mock-message-id-' + Date.now(),
          envelope: { from: mailOptions.from, to: mailOptions.to }
        });
      },
      verify: () => Promise.resolve(true),
      close: () => Promise.resolve()
    };
  }
};

// Global transporter variable
let transporter;

// Initialize transporter when server starts
const initializeTransporter = async () => {
  transporter = await createTransporter();
  
  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log('[EMAIL] Mailjet transporter is ready to send emails');
  } catch (error) {
    console.log('[EMAIL] Transporter verification failed:', error.message);
    console.log('[EMAIL] Emails will be logged to console instead');
  }
};

// Enhanced email sending with better error handling
const sendEmailWithRetry = async (mailOptions, maxRetries = 2, timeout = 15000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EMAIL] Attempt ${attempt} to send to ${mailOptions.to}`);
      
      // Ensure we have a valid transporter
      if (!transporter) {
        await initializeTransporter();
      }

      const emailPromise = transporter.sendMail({
        ...mailOptions,
        from: mailOptions.from || `"5KI Financial Services" <${process.env.MAILJET_FROM_EMAIL}>`
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Email sending timeout after ${timeout/1000} seconds`)), timeout);
      });
      
      const result = await Promise.race([emailPromise, timeoutPromise]);
      
      console.log(`[EMAIL ATTEMPT ${attempt}] Success - Message ID: ${result.messageId}`);
      return { success: true, result };
      
    } catch (error) {
      console.error(`[EMAIL ATTEMPT ${attempt}] Failed:`, error.message);
      
      // If it's an authentication error, log it but don't try to refresh
      if (error.statusCode === 401 || error.message.includes('API key')) {
        console.log('[EMAIL] Mailjet authentication error detected, check API keys');
      }
      
      if (attempt === maxRetries) {
        console.error(`[EMAIL] All attempts failed for ${mailOptions.to}`);
        return { 
          success: false, 
          error: `Failed after ${maxRetries} attempts: ${error.message}` 
        };
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`[EMAIL] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Helper function to format dates for display
const formatDisplayDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
};

// Helper function to format amounts for display
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00';
  try {
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (error) {
    return amount.toString();
  }
};

// Helper to mask password like u*****3 (keep first and last char if length >= 2)
const maskPassword = (pwd) => {
  if (!pwd) return '';
  if (pwd.length <= 2) return pwd[0] + '*';
  const first = pwd[0];
  const last = pwd[pwd.length - 1];
  return `${first}${'*'.repeat(Math.max(1, pwd.length - 2))}${last}`;
};

// Health check endpoint
// Enhanced Health check endpoint
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: '5KI Email API',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    email: transporter ? 'Connected' : 'Not Connected',
    provider: 'Mailjet'
  };
  
  try {
    // Test email connectivity
    if (transporter) {
      await transporter.verify();
      healthcheck.email = 'Connected and Verified';
    }
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'Degraded';
    healthcheck.email = 'Connection Issue';
    healthcheck.error = error.message;
    res.status(503).json(healthcheck);
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>5KI Email Notification API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        .endpoint {
          background-color: #f8f9fa;
          border-left: 4px solid #3498db;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }
        .method {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 3px;
          font-weight: bold;
          margin-right: 10px;
        }
        .post { background-color: #2ecc71; color: white; }
        .get { background-color: #3498db; color: white; }
        .status {
          color: #27ae60;
          font-weight: bold;
        }
        .warning {
          color: #e74c3c;
          background-color: #fdedec;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #e74c3c;
        }
        .success {
          color: #27ae60;
          background-color: #e8f8f5;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #2ecc71;
        }
      </style>
    </head>
    <body>
      <h1>5KI Financial Services Email Notification API</h1>
      <p class="status">API is running ✅</p>
      
      <div class="${transporter ? 'success' : 'warning'}">
        <strong>Email Status:</strong> 
        ${transporter ? 'Mailjet Connected' : 'Initializing Mailjet...'}
      </div>
      
      <h2>Available Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <strong>/health</strong>
        <p>Health check endpoint</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <strong>/send-admin-email</strong>
        <p>Send admin creation emails to both the new admin and system owner.</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <strong>/send-delete-admin-email</strong>
        <p>Send admin deletion emails to both the removed admin and system owner.</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <strong>/register</strong>
        <p>Handle new member registration notifications.</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <strong>/test-mailjet</strong>
        <p>Test Mailjet email service</p>
      </div>
      
      <p>For full documentation, please refer to the API documentation.</p>
    </body>
    </html>
  `);
});

// Add this GET endpoint for testing Mailjet (place it after your health check endpoint)
app.get('/test-mailjet', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Mailjet Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          text-align: center;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #2c3e50;
        }
        input, button {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        }
        button {
          background-color: #3498db;
          color: white;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover {
          background-color: #2980b9;
        }
        .result {
          margin-top: 20px;
          padding: 15px;
          border-radius: 5px;
          display: none;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Test Mailjet Email Service</h1>
        
        <div class="info">
          <strong>Current Configuration:</strong><br>
          From: ${process.env.MAILJET_FROM_EMAIL}<br>
          Service: Mailjet<br>
          Status: ${transporter ? '✅ Connected' : '❌ Not Connected'}
        </div>

        <form id="testForm">
          <div class="form-group">
            <label for="email">Send test email to:</label>
            <input type="email" id="email" name="email" value="${process.env.MAILJET_FROM_EMAIL}" required>
          </div>
          
          <div class="form-group">
            <label for="subject">Subject:</label>
            <input type="text" id="subject" name="subject" value="Test Email from Mailjet - 5KI Financial Services" required>
          </div>
          
          <button type="submit">Send Test Email</button>
        </form>

        <div id="result" class="result"></div>
      </div>

      <script>
        document.getElementById('testForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const submitBtn = e.target.querySelector('button');
          const resultDiv = document.getElementById('result');
          const originalText = submitBtn.textContent;
          
          submitBtn.textContent = 'Sending...';
          submitBtn.disabled = true;
          resultDiv.style.display = 'none';
          
          try {
            const formData = {
              email: document.getElementById('email').value,
              subject: document.getElementById('subject').value
            };
            
            const response = await fetch('/test-mailjet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
              resultDiv.className = 'result success';
              resultDiv.innerHTML = '✅ <strong>Success!</strong> Test email sent successfully via Mailjet. Check your inbox.';
            } else {
              resultDiv.className = 'result error';
              resultDiv.innerHTML = '❌ <strong>Error:</strong> ' + (data.error || data.message || 'Failed to send email');
            }
          } catch (error) {
            resultDiv.className = 'result error';
            resultDiv.innerHTML = '❌ <strong>Network Error:</strong> ' + error.message;
          } finally {
            resultDiv.style.display = 'block';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Your existing POST endpoint for /test-mailjet (keep this as is)
app.post('/test-mailjet', async (req, res) => {
  try {
    const { to = process.env.MAILJET_FROM_EMAIL, subject = 'Test Email from Mailjet - 5KI Financial Services' } = req.body;
    
    const mailOptions = {
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Mailjet Test Successful!
          </h2>
          <p>This is a test email from your 5KI Financial Services application.</p>
          <p>If you're receiving this, your Mailjet integration is working correctly! 🎉</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Test Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Service</td>
                <td style="padding: 8px; border: 1px solid #ddd;">Mailjet</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${process.env.MAILJET_FROM_EMAIL}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timestamp</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toISOString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
                <td style="padding: 8px; border: 1px solid #ddd; color: #27ae60;">✅ Working</td>
              </tr>
            </table>
          </div>
          
          <p>You can now use all the email endpoints in your application with Mailjet!</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    res.status(200).json({ 
      success: true,
      message: 'Test email sent successfully via Mailjet',
      result: result 
    });
  } catch (error) {
    console.error('[TEST ERROR] Failed to send test email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});
// Test endpoint for Mailjet
app.post('/test-mailjet', async (req, res) => {
  try {
    const { to = process.env.MAILJET_FROM_EMAIL } = req.body;
    
    const mailOptions = {
      to: to,
      subject: 'Test Email from Mailjet - 5KI Financial Services',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Mailjet Test Successful!
          </h2>
          <p>This is a test email from your 5KI Financial Services application.</p>
          <p>If you're receiving this, your Mailjet integration is working correctly! 🎉</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    res.status(200).json({ 
      success: true,
      message: 'Test email sent successfully via Mailjet',
      result: result 
    });
  } catch (error) {
    console.error('[TEST ERROR] Failed to send test email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// ==============================================
// ADMIN EMAILS
// ==============================================

app.post('/send-admin-email', async (req, res) => {
  console.log('[NOTIFICATION] Initiating admin creation emails', req.body);
  const { email, firstName, middleName = '', lastName, password, websiteLink } = req.body;

  // Validate required fields
  if (!email || !firstName || !lastName || !password) {
    console.log('[NOTIFICATION ERROR] Missing required fields for admin creation');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, lastName, and password are required'
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    // Email to system owner
    console.log('[NOTIFICATION] Sending admin creation notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'New Admin Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Admin Account Created
          </h2>
          <p>A new admin account has been successfully created in the system.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Admin Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Created</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          
          <p style="font-style: italic; color: #7f8c8d;">
            This is an automated notification. No action is required unless this was unauthorized.
          </p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Quick Links:</h3>
          <ul style="padding-left: 20px;">
            <li><a href="${websiteLink || WEBSITE_LINK}" style="color: #3498db;">Website</a></li>
          </ul>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Email to new admin
    console.log('[NOTIFICATION] Sending admin credentials to new admin');
    const adminMailOptions = {
      to: email,
      subject: 'Your 5KI Financial Services Admin Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Welcome to 5KI Financial Services
          </h2>
          <p>Dear ${firstName},</p>
          
          <p>Your administrator account has been successfully created. Below are your login credentials:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Account Information:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Email</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Temporary Password</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Type</td>
                <td style="padding: 8px; border: 1px solid #ddd;">Administrator</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Important Security Notice:</h3>
          <ul style="margin-bottom: 20px;">
            <li>Change your password immediately after first login</li>
            <li>Never share your credentials with anyone</li>
            <li>Always log out after your session</li>
          </ul>
          
          <p>
            <a href="${websiteLink || WEBSITE_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
              Login to your account
            </a>
          </p>
          
          <p>For any questions, please contact the system administrator.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Send both emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const adminResult = await sendEmailWithRetry(adminMailOptions);

    console.log('[NOTIFICATION SUCCESS] Admin creation process completed');
    res.status(200).json({ 
      success: true,
      message: 'Admin creation process completed',
      emailsSent: {
        owner: ownerResult.success,
        admin: adminResult.success
      },
      data: {
        adminEmail: email,
        dateSent: currentDate
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error in admin creation process:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error in admin creation process',
      error: error.message
    });
  }
});

app.post('/send-delete-admin-email', async (req, res) => {
  console.log('[NOTIFICATION] Initiating admin deletion emails', req.body);
  const { email, firstName, middleName = '', lastName, websiteLink } = req.body;

  // Validate required fields
  if (!email || !firstName || !lastName) {
    console.log('[NOTIFICATION ERROR] Missing required fields for admin deletion');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, and lastName are required'
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    // Email to system owner
    console.log('[NOTIFICATION] Sending admin deletion notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'Admin Account Deleted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Admin Account Deletion Notification
          </h2>
          
          <p>An administrator account has been permanently removed from the system.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Account Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Deleted</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          
          <p style="font-weight: bold; color: #e74c3c;">
            Note: This action is irreversible. All access privileges have been revoked.
          </p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Quick Links:</h3>
          <ul style="padding-left: 20px;">
            <li><a href="${websiteLink || WEBSITE_LINK}" style="color: #3498db;">Website</a></li>
          </ul>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Email to deleted admin
    console.log('[NOTIFICATION] Sending admin deletion notification to deleted admin');
    const adminMailOptions = {
      to: email,
      subject: 'Your 5KI Financial Services Admin Access Has Been Removed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Account Access Update
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <p>We're writing to inform you that your administrator access to the 5KI Financial Services system has been permanently removed as of ${currentDate}.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Effective Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Important Information:</h3>
          <ul style="margin-bottom: 20px;">
            <li>You will no longer have access to the admin dashboard</li>
            <li>All admin privileges have been revoked</li>
            <li>This action is permanent and cannot be undone</li>
          </ul>
          
          <p style="font-weight: bold;">
            If this action was taken in error or you have any questions, please contact the system administrator immediately at 
            <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Send both emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const adminResult = await sendEmailWithRetry(adminMailOptions);

    console.log('[NOTIFICATION SUCCESS] Admin deletion emails sent successfully');
    res.status(200).json({ 
      success: true,
      message: 'Admin deletion emails sent successfully',
      data: {
        adminEmail: email,
        dateSent: currentDate
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending admin deletion emails:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send admin deletion emails',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==============================================
// REGISTRATION FLOW
// ==============================================

app.post('/register', async (req, res) => {
  console.log('[NOTIFICATION] Initiating registration emails', req.body);
  const { email, firstName, lastName, dateCreated } = req.body;
  const registrationDate = dateCreated || new Date().toLocaleDateString();

  if (!email || !firstName || !lastName) {
    console.log('[NOTIFICATION ERROR] Missing required fields for registration');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending new registration notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'New Registration Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Registration Received
          </h2>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Member Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Registration Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(registrationDate)}</td>
            </tr>
          </table>
          
          <p>
            <a href="${DASHBOARD_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Review Application
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    console.log('[NOTIFICATION] Sending registration confirmation to user');
    const userMailOptions = {
      to: email,
      subject: 'Registration Application Successfully Received - Thank You for Signing Up!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Thank You for Registering with 5KI Financial Services!
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <p>We are pleased to inform you that we have successfully received your registration application on ${formatDisplayDate(registrationDate)}. Our team is currently reviewing your information and you will receive a confirmation once your application is approved.</p>
          
          <p>In the meantime, if you have any questions or would like to know more about our services, feel free to contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const userResult = await sendEmailWithRetry(userMailOptions);

    console.log('[NOTIFICATION SUCCESS] Registration emails sent successfully');
    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending registration emails:', error);
    res.status(500).json({ message: 'Failed to send emails', error: error.message });
  }
});

app.post('/approveRegistrations', async (req, res) => {
  console.log('[NOTIFICATION] Initiating registration approval email', req.body);
  const { email, firstName, lastName, dateApproved, approvedTime, memberId, password } = req.body;

  if (!email || !firstName || !lastName || !dateApproved || !approvedTime || !memberId) {
    console.log('[NOTIFICATION ERROR] Missing required fields for registration approval');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending registration approval to user');
    const mailOptions = {
      to: email,
      subject: 'Welcome to 5Ki Financial Services - Your Account is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Welcome to 5Ki Financial Services!
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              Your account has been successfully approved!
            </p>
          </div>
          
          <p>Thank you for registering with 5Ki Financial Services on ${dateApproved}. Your account has been successfully created and you now have access to our range of services including loan applications, transactions tracking, and account management.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Account Information:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Member ID</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: #3498db;">${memberId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Active</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Approval Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dateApproved}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Password</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${maskPassword(password)}</td>
            </tr>
          </table>
          
          <p style="font-weight: bold;">Welcome aboard! Please log in to your account to get started.</p>
          
          <p>
            <a href="${WEBSITE_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">
              Login to Your Account
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Registration approval email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending registration approval email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/rejectRegistrations', async (req, res) => {
  console.log('[NOTIFICATION] Initiating registration rejection email', req.body);
  const { email, firstName, lastName, dateRejected, rejectedTime, rejectionReason } = req.body;

  if (!email || !firstName || !lastName || !dateRejected || !rejectedTime) {
    console.log('[NOTIFICATION ERROR] Missing required fields for registration rejection');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending registration rejection to user');
    const mailOptions = {
      to: email,
      subject: 'Registration Application Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Registration Application Update
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              We regret to inform you that your registration application has not been approved at this time.
            </p>
          </div>
          
          <p>Thank you for your interest in becoming a member of 5KI Financial Services. After careful review, we regret to inform you that your registration application has not been approved at this time due to not meeting the eligibility criteria required for membership.</p>
          
          ${rejectionReason ? `
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Reason for Rejection:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">${rejectionReason}</td>
            </tr>
          </table>
          ` : ''}
          
          <p>Should you wish to reapply, we recommend reviewing the application guidelines thoroughly and ensuring that all required information is complete and accurate.</p>
          
          <p>For questions or clarifications, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p>We appreciate your interest and hope to serve you in the future.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Registration rejection email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending registration rejection email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// ==============================================
// TWO-FACTOR AUTHENTICATION
// ==============================================

app.post('/send-verification-code', async (req, res) => {
  console.log('[NOTIFICATION] Initiating 2FA verification email', req.body);
  const { 
    email, 
    firstName, 
    verificationCode,
    websiteLink,
    facebookLink 
  } = req.body;

  // Validate required fields
  if (!email || !verificationCode) {
    console.log('[NOTIFICATION ERROR] Missing required fields for 2FA email');
    return res.status(400).json({ 
      success: false,
      message: 'Email and verification code are required'
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate verification code format (6 digits)
  if (!/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({
      success: false,
      message: 'Verification code must be 6 digits'
    });
  }

  try {
    // Log the code for development purposes (mask part of it in production)
    const codeToLog = process.env.NODE_ENV === 'production' 
      ? `${verificationCode.substring(0, 3)}***` 
      : verificationCode;
    console.log(`[DEBUG] Sending verification code ${codeToLog} to ${email}`);

    const mailOptions = {
      to: email,
      subject: 'Your 5KI Financial Services Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Security Verification
          </h2>
          
          <p>Hi ${firstName || 'Customer'},</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 0.9em; color: #7f8c8d;">Your verification code is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 10px 0; color: #2c3e50;">
              ${verificationCode}
            </p>
            <p style="margin: 0; font-size: 0.9em; color: #7f8c8d;">
              This code will expire in 10 minutes.
            </p>
          </div>
          
          <p>Please enter this code in the verification page to complete your login process.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">IMPORTANT SECURITY NOTICE:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #fdedec; border-left: 4px solid #e74c3c;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e74c3c;">
                <ul style="margin-bottom: 0;">
                  <li>Never share this code with anyone</li>
                  <li>5KI Financial Services will never ask you for this code</li>
                  <li>If you didn't request this code, contact us immediately at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a></li>
                </ul>
              </td>
            </tr>
          </table>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] 2FA verification email sent successfully');
    res.status(200).json({ 
      success: true,
      message: 'Verification code sent successfully',
      data: {
        emailSent: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending 2FA verification email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send verification code',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==============================================
// TRANSACTION EMAILS
// ==============================================

app.post('/deposit', async (req, res) => {
  console.log('[NOTIFICATION] Initiating deposit notification emails', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amountToBeDeposited,
    depositOption,
    accountNumber,
    accountName,
    proofOfDepositUrl,
    dateApplied,
    transactionId,
    websiteLink,
    facebookLink
  } = req.body;

  if (!email || !firstName || !lastName || !amountToBeDeposited || !depositOption) {
    console.log('[NOTIFICATION ERROR] Missing required fields for deposit notification');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const currentDate = dateApplied || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Email to system owner
    console.log('[NOTIFICATION] Sending deposit application notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'New Deposit Application Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Deposit Application
          </h2>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Member Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amountToBeDeposited)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Method</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${depositOption}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accountName || '5KI'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Number</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accountNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Transaction ID</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${transactionId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Submitted</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
            ${proofOfDepositUrl ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Proof of deposit</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Attached</td>
            </tr>
            ` : ''}
          </table>
          
          <p>
            <a href="${DASHBOARD_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Review Application
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Email to member
    console.log('[NOTIFICATION] Sending deposit confirmation to user');
    const userMailOptions = {
      to: email,
      subject: 'Deposit Application Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Deposit Application Received
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <p>We have received your deposit application for <strong>₱${formatAmount(amountToBeDeposited)}</strong> via <strong>${depositOption}</strong>.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Application Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Account Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accountName || '5KI'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Number</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accountNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Transaction ID</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${transactionId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Submitted</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          
          <p>Our team will process your request and notify you once completed. This typically takes 1-2 business days.</p>
          
          <p>For any questions, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const userResult = await sendEmailWithRetry(userMailOptions);

    console.log('[NOTIFICATION SUCCESS] Deposit notification emails sent successfully');
    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending deposit notification emails:', error);
    res.status(500).json({ message: 'Failed to send emails', error: error.message });
  }
});

app.post('/approveDeposits', async (req, res) => {
  console.log('[NOTIFICATION] Initiating deposit approval email', req.body);
  const { email, firstName, lastName, amount, dateApproved, timeApproved } = req.body;

  if (!email || !firstName || !lastName || !amount || !dateApproved || !timeApproved) {
    console.log('[NOTIFICATION ERROR] Missing required fields for deposit approval');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending deposit approval to user');
    const mailOptions = {
      to: email,
      subject: 'Deposit Approved - 5Ki Financial Services',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Deposit Approved
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              We are pleased to inform you that your deposit of ₱${formatAmount(amount)} has been approved on ${dateApproved}.
            </p>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Transaction Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Approved</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Approval Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dateApproved}</td>
            </tr>
          </table>
          
          <p>Your account balance has been updated accordingly.</p>
          
          <p>Thank you for using 5Ki Financial Services.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Deposit approval email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending deposit approval email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/rejectDeposits', async (req, res) => {
  console.log('[NOTIFICATION] Initiating deposit rejection email', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amount, 
    dateRejected, 
    timeRejected, 
    rejectionReason 
  } = req.body;

  if (!email || !firstName || !lastName || !amount || !dateRejected || !timeRejected) {
    console.log('[NOTIFICATION ERROR] Missing required fields for deposit rejection');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending deposit rejection to user');
    const mailOptions = {
      to: email,
      subject: 'Deposit Application Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Deposit Application Update
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              We regret to inform you that your deposit application has not been approved.
            </p>
          </div>
          
          <p>After careful review, we regret to inform you that your deposit application submitted on ${dateRejected} has not been approved.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Application Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount Requested</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            ${rejectionReason ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${rejectionReason}</td>
            </tr>
            ` : ''}
          </table>
          
          <p>You may submit a new deposit application after addressing any issues.</p>
          
          <p>For questions, contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Deposit rejection email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending deposit rejection email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/withdraw', async (req, res) => {
  console.log('[NOTIFICATION] Initiating withdrawal notification emails', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amount, 
    date, 
    recipientAccount, 
    accountNumber, // Add this line to accept accountNumber
    referenceNumber, 
    withdrawOption,
    accountName,
    websiteLink,
    facebookLink
  } = req.body;

  // Use recipientAccount if provided, otherwise fall back to accountNumber
  const recipientAcc = recipientAccount || accountNumber;

  if (!email || !firstName || !lastName || !amount || !date || !referenceNumber) {
    console.log('[NOTIFICATION ERROR] Missing required fields for withdrawal notification');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, lastName, amount, date, and referenceNumber are required' 
    });
  }

  try {
    console.log('[NOTIFICATION] Sending withdrawal notification to owner');
    
    // Email to system owner
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'New Withdrawal Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Withdrawal Request
          </h2>
          
          <p>Dear Admin,</p>
          
          <p>A member has requested a withdrawal:</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Transaction Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Member</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Withdrawal Method</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${withdrawOption}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accountName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Number</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${recipientAcc || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reference No.</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Submitted</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(date)}</td>
            </tr>
          </table>
          
          <p>
            <a href="${DASHBOARD_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Review Application
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    console.log('[NOTIFICATION] Sending withdrawal confirmation to user');
    
    // Email to member
    const userMailOptions = {
      to: email,
      subject: 'Withdrawal Application Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Withdrawal Application Received
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <p>We have received your withdrawal application for <strong>₱${formatAmount(amount)}</strong> via <strong>${withdrawOption}</strong>.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Application Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Withdrawal Method</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${withdrawOption}</td>
            </tr>
            ${accountName ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accountName}</td>
            </tr>
            ` : ''}
            ${recipientAcc ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Number</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${recipientAcc}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reference Number</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Submitted</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(date)}</td>
            </tr>
          </table>
          
          <p>Our team will process your request and notify you once completed. This typically takes 1-2 business days.</p>
          
          <p>For any questions, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const userResult = await sendEmailWithRetry(userMailOptions);

    console.log('[NOTIFICATION SUCCESS] Withdrawal notification emails sent successfully');
    res.status(200).json({ 
      success: true,
      message: 'Withdrawal notification emails sent successfully' 
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending withdrawal notification emails:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send withdrawal notification emails',
      error: error.message 
    });
  }
});

app.post('/approveWithdraws', async (req, res) => {
  const { email, firstName, lastName, amount, dateApproved, timeApproved } = req.body;

  try {
    const mailOptions = {
      to: email,
      subject: 'Withdrawal Approved - 5Ki Financial Services',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Withdrawal Approved
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              Your withdrawal of ₱${formatAmount(amount)} has been approved on ${dateApproved}.
            </p>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Transaction Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Approved</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Approval Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dateApproved}</td>
            </tr>
          </table>
          
          <p>Thank you for using 5Ki Financial Services.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending approval email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

app.post('/rejectWithdraws', async (req, res) => {
  console.log('[NOTIFICATION] Initiating withdrawal rejection email', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amount, 
    dateRejected, 
    timeRejected, 
    rejectionReason 
  } = req.body;

  if (!email || !firstName || !lastName || !amount || !dateRejected || !timeRejected) {
    console.log('[NOTIFICATION ERROR] Missing required fields for withdrawal rejection');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending withdrawal rejection to user');
    const mailOptions = {
      to: email,
      subject: 'Withdrawal Application Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Withdrawal Application Update
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              We regret to inform you that your withdrawal application has not been approved.
            </p>
          </div>
          
          <p>After careful review, we regret to inform you that your withdrawal application submitted on ${dateRejected} has not been approved.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Application Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount Requested</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            ${rejectionReason ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${rejectionReason}</td>
            </tr>
            ` : ''}
          </table>
          
          <p>You may submit a new withdrawal application after addressing any issues.</p>
          
          <p>For questions, contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Withdrawal rejection email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending withdrawal rejection email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// ==============================================
// LOAN EMAILS
// ==============================================

app.post('/applyLoan', async (req, res) => {
  console.log('[NOTIFICATION] Initiating loan application emails', req.body);
  const { email, firstName, lastName, amount, term, date } = req.body;
  const fullName = `${firstName} ${lastName}`;

  if (!email || !firstName || !lastName || !amount || !term || !date) {
    console.log('[NOTIFICATION ERROR] Missing required fields for loan application');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending new loan application notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'New Loan Application Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Loan Application
          </h2>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Applicant Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Applicant</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Term</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${term} months</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Application Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(date)}</td>
            </tr>
          </table>
          
          <p>
            <a href="${DASHBOARD_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Review Application
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    console.log('[NOTIFICATION] Sending loan application confirmation to user');
    const userMailOptions = {
      to: email,
      subject: 'Loan Application Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Loan Application Received
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <p>We have received your loan application on ${formatDisplayDate(date)}. Our team is currently reviewing your application and will process it within 3-5 business days. You'll be notified once your application has been successfully processed.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Loan Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Term</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${term} months</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Under Review</td>
            </tr>
          </table>
          
          <p>For any questions, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const userResult = await sendEmailWithRetry(userMailOptions);

    console.log('[NOTIFICATION SUCCESS] Loan application emails sent successfully');
    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending loan application emails:', error);
    res.status(500).json({ message: 'Failed to send emails', error: error.message });
  }
});

app.post('/approveLoans', async (req, res) => {
  console.log('[NOTIFICATION] Initiating loan approval email', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amount, 
    term, 
    dateApproved, 
    timeApproved,
    interestRate,
    interest,
    totalInterest,
    principal,
    monthlyPayment,
    totalMonthlyPayment,
    totalTermPayment,
    releaseAmount,
    processingFee,
    dueDate
  } = req.body;

  if (!email || !firstName || !lastName || !amount || !term || !dateApproved || !timeApproved) {
    console.log('[NOTIFICATION ERROR] Missing required fields for loan approval');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending loan approval to user');
    const mailOptions = {
      to: email,
      subject: 'Congratulations! Your Loan is Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Congratulations! Your Loan is Approved
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              We're pleased to inform you that your loan application has been approved on ${dateApproved}.
            </p>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Loan Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Approved Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Processing Fee</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(processingFee)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Release Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(releaseAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Terms</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${term} months</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Interest Rate</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${interestRate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Interest</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(totalInterest)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Principal</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(monthlyPayment)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Monthly Interest</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(interest)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Monthly Amortization</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(totalMonthlyPayment)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Maturity</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dueDate}</td>
            </tr>
          </table>
          
          <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Payment Instructions:</h3>
            <ol>
              <li>Payments are due on the ${new Date(dueDate).getDate()}th of each month</li>
              <li>Late payments will incur additional charges</li>
              <li>You may pay through our online portal or at any authorized payment center</li>
            </ol>
          </div>
          
          <p>Please log in to your account to view the full payment schedule and details.</p>
          
          <p>Congratulations and thank you for trusting 5Ki Financial Services.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Loan approval email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending loan approval email:', error);
    res.status(500).json({ 
      message: 'Failed to send email', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/rejectLoans', async (req, res) => {
  console.log('[NOTIFICATION] Initiating loan rejection email', req.body);
  const { 
    email, 
    firstName, 
    lastName,
    rejectionReason,
    rejectionMessage,
    dateRejected,
    timeRejected
  } = req.body;

  if (!email || !firstName || !lastName) {
    console.log('[NOTIFICATION ERROR] Missing required fields for loan rejection');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending loan rejection to user');
    const mailOptions = {
      to: email,
      subject: 'Loan Application Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Loan Application Update
          </h2>
          
          <p>Hi ${firstName},</p>
          
          ${rejectionMessage ? `
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              ${rejectionMessage}
            </p>
          </div>
          ` : `
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              We regret to inform you that your loan application has been rejected.
            </p>
          </div>
          `}
          
          <p>Date of Rejection: ${dateRejected || formatDisplayDate(new Date())}</p>
          
          <p>If you have any questions or need clarification, please don't hesitate to contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Loan rejection email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending loan rejection email:', error);
    res.status(500).json({ 
      message: 'Failed to send email', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==============================================
// PAYMENT & OTHER TRANSACTIONS
// ==============================================

app.post('/payment', async (req, res) => {
  console.log('[NOTIFICATION] Initiating payment confirmation emails', req.body);
  const { email, firstName, lastName, amount, date, paymentMethod } = req.body;
  const fullName = `${firstName} ${lastName}`;

  if (!email || !firstName || !lastName || !amount || !date || !paymentMethod) {
    console.log('[NOTIFICATION ERROR] Missing required fields for payment confirmation');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending payment notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'Loan Payment Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Loan Payment Received
          </h2>
          
          <p>Dear Admin,</p>
          
          <p>A loan payment has been recorded:</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Transaction Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Member</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount Paid</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Payment Method</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
            </tr>
          </table>
          
          <p>The system has updated the loan balance accordingly.</p>
          
          <p>
            <a href="${DASHBOARD_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View in Dashboard
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    console.log('[NOTIFICATION] Sending payment confirmation to user');
    const userMailOptions = {
      to: email,
      subject: 'Payment Application Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Payment Application Confirmed
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              We have received your payment application for an amount of ₱${formatAmount(amount)} on ${formatDisplayDate(date)} via ${paymentMethod}.
            </p>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Payment Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Payment Method</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Transaction Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(date)}</td>
            </tr>
          </table>
          
          <p>Your transaction has been processed successfully. Thank you for your payment.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const userResult = await sendEmailWithRetry(userMailOptions);

    console.log('[NOTIFICATION SUCCESS] Payment confirmation emails sent successfully');
    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending payment confirmation emails:', error);
    res.status(500).json({ message: 'Failed to send emails', error: error.message });
  }
});

app.post('/approvePayments', async (req, res) => {
  console.log('[NOTIFICATION] Initiating payment approval email', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amount, 
    paymentMethod,
    dateApproved, 
    timeApproved,
    interestPaid,
    principalPaid,
    excessPayment,
    isLoanPayment
  } = req.body;

  if (!email || !firstName || !lastName || !amount || !dateApproved || !timeApproved) {
    console.log('[NOTIFICATION ERROR] Missing required fields for payment approval');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending payment approval to user');
    const mailOptions = {
      to: email,
      subject: 'Payment Approved - 5Ki Financial Services',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Payment Approved
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              We are pleased to inform you that your payment has been successfully processed.
            </p>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Payment Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Payment Method</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Approved</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dateApproved}</td>
            </tr>
            ${isLoanPayment ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Payment Breakdown</td>
              <td style="padding: 8px; border: 1px solid #ddd;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px; border: none;">Principal Paid:</td>
                    <td style="padding: 4px; border: none;">₱${formatAmount(principalPaid)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px; border: none;">Interest Paid:</td>
                    <td style="padding: 4px; border: none;">₱${formatAmount(interestPaid)}</td>
                  </tr>
                  ${excessPayment > 0 ? `
                  <tr>
                    <td style="padding: 4px; border: none;">Excess Payment:</td>
                    <td style="padding: 4px; border: none;">₱${formatAmount(excessPayment)}</td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
            ` : ''}
          </table>
          
          <p>Your transaction has been completed successfully. Thank you for your payment.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Payment approval email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending payment approval email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/rejectPayments', async (req, res) => {
  console.log('[NOTIFICATION] Initiating payment rejection email', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    amount, 
    paymentMethod,
    dateRejected, 
    timeRejected, 
    rejectionReason,
    rejectionMessage
  } = req.body;

  if (!email || !firstName || !lastName || !amount || !dateRejected || !timeRejected) {
    console.log('[NOTIFICATION ERROR] Missing required fields for payment rejection');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending payment rejection to user');
    const mailOptions = {
      to: email,
      subject: 'Payment Application Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Payment Application Update
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              ${rejectionMessage || `After careful review, we regret to inform you that your payment application submitted on ${dateRejected} has not been approved.`}
            </p>
          </div>
          
          ${rejectionReason ? `
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Reason:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">${rejectionReason}</td>
            </tr>
          </table>
          ` : ''}
          
          <p>You may submit a new payment application after addressing any issues.</p>
          
          <p>For questions, contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Payment rejection email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending payment rejection email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// ==============================================
// MEMBERSHIP WITHDRAWAL
// ==============================================

app.post('/membershipWithdrawal', async (req, res) => {
  console.log('[NOTIFICATION] Initiating membership withdrawal emails', req.body);
  const { email, firstName, lastName, date, reason } = req.body;
  const fullName = `${firstName} ${lastName}`;

  if (!email || !firstName || !lastName || !date) {
    console.log('[NOTIFICATION ERROR] Missing required fields for membership withdrawal');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending membership withdrawal notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'Membership Withdrawal Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Membership Withdrawal Request
          </h2>
          
          <p>Dear Admin,</p>
          
          <p>A new permanent membership withdrawal request has been received:</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Request Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Member</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Requested</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatDisplayDate(date)}</td>
            </tr>
            ${reason ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${reason}</td>
            </tr>
            ` : ''}
          </table>
          
          <p>Kindly update the records and confirm in the system.</p>
          
          <p>
            <a href="${DASHBOARD_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View in Dashboard
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    console.log('[NOTIFICATION] Sending membership withdrawal confirmation to user');
    const userMailOptions = {
      to: email,
      subject: 'Membership Withdrawal Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Membership Withdrawal Request Received
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <p>We have received your membership withdrawal request on ${formatDisplayDate(date)}. Our team is currently reviewing your application and will process it within 3-5 business days. You'll be notified once your application has been successfully processed.</p>
          
          ${reason ? `
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Your Reason:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">${reason}</td>
            </tr>
          </table>
          ` : ''}
          
          <p>For any questions, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const userResult = await sendEmailWithRetry(userMailOptions);

    console.log('[NOTIFICATION SUCCESS] Membership withdrawal emails sent successfully');
    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending membership withdrawal emails:', error);
    res.status(500).json({ message: 'Failed to send emails', error: error.message });
  }
});

app.post('/approveMembershipWithdrawal', async (req, res) => {
  console.log('[NOTIFICATION] Initiating membership withdrawal approval email', req.body);
  const { email, firstName, lastName, dateApproved } = req.body;

  if (!email || !firstName || !lastName || !dateApproved) {
    console.log('[NOTIFICATION ERROR] Missing required fields for membership withdrawal approval');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending membership withdrawal approval to user');
    const mailOptions = {
      to: email,
      subject: 'Membership Withdrawal Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">
            Membership Withdrawal Approved
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #e8f8f5; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
            <p style="font-weight: bold; color: #27ae60; margin: 0;">
              Your membership withdrawal request has been approved on ${dateApproved}.
            </p>
          </div>
          
          <p>Your membership with 5KI Financial Services has been officially terminated as of ${dateApproved}. All associated accounts and records have been closed.</p>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Important Information:</h3>
          <ul style="margin-bottom: 20px;">
            <li>Your account balance has been settled</li>
            <li>All membership privileges have been revoked</li>
            <li>This action is permanent and cannot be undone</li>
          </ul>
          
          <p>If you wish to rejoin in the future, you will need to submit a new membership application.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Membership withdrawal approval email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending membership withdrawal approval email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/rejectMembershipWithdrawal', async (req, res) => {
  console.log('[NOTIFICATION] Initiating membership withdrawal rejection email', req.body);
  const { email, firstName, lastName, dateRejected, rejectionReason } = req.body;

  if (!email || !firstName || !lastName || !dateRejected) {
    console.log('[NOTIFICATION ERROR] Missing required fields for membership withdrawal rejection');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log('[NOTIFICATION] Sending membership withdrawal rejection to user');
    const mailOptions = {
      to: email,
      subject: 'Membership Withdrawal Request Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Membership Withdrawal Request Update
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="font-weight: bold; color: #e74c3c; margin: 0;">
              We regret to inform you that your membership withdrawal request has not been approved.
            </p>
          </div>
          
          <p>After careful review, we regret to inform you that your membership withdrawal request submitted on ${dateRejected} has not been approved.</p>
          
          ${rejectionReason ? `
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Reason:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">${rejectionReason}</td>
            </tr>
          </table>
          ` : ''}
          
          <p>For any questions or to appeal this decision, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Membership withdrawal rejection email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending membership withdrawal rejection email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// ==============================================
// LOAN REMINDER
// ==============================================

app.post('/send-loan-reminder', async (req, res) => {
  console.log('[NOTIFICATION] Initiating loan reminder email', req.body);
  const { 
    email, 
    firstName, 
    lastName, 
    dueDate,
    loanAmount,
    outstandingBalance,
    memberId,
    transactionId,
    websiteLink,
    facebookLink
  } = req.body;

  // Validate required fields
  if (!email || !firstName || !lastName || !dueDate) {
    console.log('[NOTIFICATION ERROR] Missing required fields for loan reminder');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, lastName, and dueDate are required'
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  try {
    const formattedDueDate = formatDisplayDate(dueDate);
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    const urgencyLevel = daysUntilDue <= 3 ? 'high' : (daysUntilDue <= 7 ? 'medium' : 'low');
    const borderColor = urgencyLevel === 'high' ? '#e74c3c' : (urgencyLevel === 'medium' ? '#f39c12' : '#3498db');
    const bgColor = urgencyLevel === 'high' ? '#fdedec' : (urgencyLevel === 'medium' ? '#fff8e1' : '#e8f8f5');
    
    const subject = urgencyLevel === 'high' 
      ? `URGENT: Loan Payment Due in ${daysUntilDue} Day${daysUntilDue === 1 ? '' : 's'}!` 
      : `Reminder: Loan Payment Due in ${daysUntilDue} Day${daysUntilDue === 1 ? '' : 's'}`;

    console.log('[NOTIFICATION] Sending loan reminder to user');
    
    // FIX: Always use the correct website link with "app"
    const paymentWebsiteLink = WEBSITE_LINK; // This will always be 'https://fivekiapp.onrender.com'
    
    const mailOptions = {
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid ${borderColor}; padding-bottom: 10px;">
            Loan Payment Reminder
          </h2>
          
          <p>Hi ${firstName},</p>
          
          <div style="background-color: ${bgColor}; padding: 15px; border-left: 4px solid ${borderColor}; margin: 20px 0;">
            <p style="font-weight: bold; color: ${borderColor}; margin: 0;">
              ${urgencyLevel === 'high' ? 'URGENT: ' : ''}Your loan payment is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} on ${formattedDueDate}.
            </p>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Loan Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Member ID</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${memberId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Reference</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${transactionId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Original Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(loanAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Outstanding Balance</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₱${formatAmount(outstandingBalance)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Due Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formattedDueDate}</td>
            </tr>
          </table>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Payment Options:</h3>
            <ol>
              <li>Online payment through our website</li>
              <li>Bank transfer to our official accounts</li>
              <li>Cash payment at our office</li>
            </ol>
          </div>
          
          <p>
            <a href="${paymentWebsiteLink}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
              Make Payment Now
            </a>
          </p>
          
          ${urgencyLevel === 'high' ? `
          <div style="background-color: #fdedec; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <h3 style="color: #e74c3c; margin-top: 0;">Important Notice:</h3>
            <p>Failure to make payment by the due date may result in late fees and affect your credit standing with 5KI Financial Services.</p>
          </div>
          ` : ''}
          
          <p>For any questions about your payment, please contact us at <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Loan reminder email sent successfully');
    console.log(`[DEBUG] Payment link used: ${paymentWebsiteLink}`);
    res.status(200).json({ 
      success: true,
      message: 'Loan reminder email sent successfully',
      data: {
        emailSent: email,
        daysUntilDue: daysUntilDue,
        paymentLink: paymentWebsiteLink,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending loan reminder email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send loan reminder email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==============================================
// CO-ADMIN EMAILS
// ==============================================

app.post('/send-coadmin-email', async (req, res) => {
  console.log('[NOTIFICATION] Initiating co-admin creation emails', req.body);
  const { email, firstName, middleName = '', lastName, password, websiteLink, facebookLink } = req.body;

  if (!email || !firstName || !lastName || !password) {
    console.log('[NOTIFICATION ERROR] Missing required fields for co-admin creation');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, lastName, and password are required'
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    // Email to system owner
    console.log('[NOTIFICATION] Sending co-admin creation notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'New Co-Admin Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Co-Admin Account Created
          </h2>
          <p>A new co-admin account has been successfully created in the system.</p>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Co-Admin Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Created</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Quick Links:</h3>
          <ul style="padding-left: 20px;">
            <li><a href="${websiteLink || WEBSITE_LINK}" style="color: #3498db;">Website</a></li>
          </ul>
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Email to new co-admin
    console.log('[NOTIFICATION] Sending co-admin credentials to new co-admin');
    const coAdminMailOptions = {
      to: email,
      subject: 'Your 5KI Financial Services Co-Admin Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Welcome to 5KI Financial Services
          </h2>
          <p>Dear ${firstName},</p>
          <p>Your co-administrator account has been successfully created. Below are your login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Account Information:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Email</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Temporary Password</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Type</td>
                <td style="padding: 8px; border: 1px solid #ddd;">Co-Administrator</td>
              </tr>
            </table>
          </div>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Important Security Notice:</h3>
          <ul style="margin-bottom: 20px;">
            <li>Change your password immediately after first login</li>
            <li>Never share your credentials with anyone</li>
            <li>Always log out after your session</li>
          </ul>
          <p>
            <a href="${websiteLink || WEBSITE_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
              Login to your account
            </a>
          </p>
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Send emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const coAdminResult = await sendEmailWithRetry(coAdminMailOptions);

    console.log('[NOTIFICATION SUCCESS] Co-admin creation emails sent successfully');
    res.status(200).json({ 
      success: true,
      message: 'Co-admin creation emails sent successfully',
      data: {
        adminEmail: email,
        dateSent: currentDate
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending co-admin creation emails:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send co-admin creation emails',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/send-delete-coadmin-email', async (req, res) => {
  console.log('[NOTIFICATION] Initiating co-admin deletion emails', req.body);
  const { email, firstName, middleName = '', lastName, websiteLink } = req.body;

  if (!email || !firstName || !lastName) {
    console.log('[NOTIFICATION ERROR] Missing required fields for co-admin deletion');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, and lastName are required'
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    // Email to system owner
    console.log('[NOTIFICATION] Sending co-admin deletion notification to owner');
    const ownerMailOptions = {
      to: process.env.MAILJET_FROM_EMAIL || email,
      subject: 'Co-Admin Account Deleted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Co-Admin Account Deletion Notification
          </h2>
          <p>A co-administrator account has been permanently removed from the system.</p>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Account Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date Deleted</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          <p style="font-weight: bold; color: #e74c3c;">
            Note: This action is irreversible. All access privileges have been revoked.
          </p>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Quick Links:</h3>
          <ul style="padding-left: 20px;">
            <li><a href="${websiteLink || WEBSITE_LINK}" style="color: #3498db;">Website</a></li>
          </ul>
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Email to deleted co-admin
    console.log('[NOTIFICATION] Sending co-admin deletion notification to deleted co-admin');
    const coAdminMailOptions = {
      to: email,
      subject: 'Your 5KI Financial Services Co-Admin Access Has Been Removed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            Account Access Update
          </h2>
          <p>Dear ${firstName},</p>
          <p>We're writing to inform you that your co-administrator access to the 5KI Financial Services system has been permanently removed as of ${currentDate}.</p>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Effective Date</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${currentDate}</td>
            </tr>
          </table>
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Important Information:</h3>
          <ul style="margin-bottom: 20px;">
            <li>You will no longer have access to the admin dashboard</li>
            <li>All admin privileges have been revoked</li>
            <li>This action is permanent and cannot be undone</li>
          </ul>
          <p style="font-weight: bold;">
            If this action was taken in error or you have any questions, please contact the system administrator immediately at 
            <a href="mailto:${GMAIL_OWNER}" style="color: #3498db;">${GMAIL_OWNER}</a>.
          </p>
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            5KI Financial Services &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    // Send both emails using retry logic
    const ownerResult = await sendEmailWithRetry(ownerMailOptions);
    const coAdminResult = await sendEmailWithRetry(coAdminMailOptions);

    console.log('[NOTIFICATION SUCCESS] Co-admin deletion emails sent successfully');
    res.status(200).json({ 
      success: true,
      message: 'Co-admin deletion emails sent successfully',
      data: {
        adminEmail: email,
        dateSent: currentDate
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending co-admin deletion emails:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send co-admin deletion emails',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==============================================
// MEMBER CREDENTIALS
// ==============================================

app.post('/send-member-credentials', async (req, res) => {
  console.log('[NOTIFICATION] Initiating member credentials email', req.body);
  const { email, firstName, lastName, memberId, password, websiteLink } = req.body;

  if (!email || !firstName || !lastName || !memberId || !password) {
    console.log('[NOTIFICATION ERROR] Missing required fields for member credentials');
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: email, firstName, lastName, memberId, and password are required'
    });
  }

  try {
    console.log('[NOTIFICATION] Sending member credentials to user');
    const mailOptions = {
      to: email,
      subject: 'Your 5KI Financial Services Member Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Welcome to 5KI Financial Services!
          </h2>
          
          <p>Dear ${firstName},</p>
          
          <p>Your member account has been successfully created. Below are your login credentials:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Account Information:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Member ID</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${memberId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Password</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Type</td>
                <td style="padding: 8px; border: 1px solid #ddd;">Member</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">Important Security Notice:</h3>
          <ul style="margin-bottom: 20px;">
            <li>Change your password immediately after first login</li>
            <li>Never share your credentials with anyone</li>
            <li>Always log out after your session</li>
            <li>Keep your member ID confidential</li>
          </ul>
          
          <p>
            <a href="${websiteLink || WEBSITE_LINK}" 
               style="display: inline-block; background-color: #3498db; color: white; 
                      padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
              Login to Your Account
            </a>
          </p>
          
          <p>For any questions, please contact our support team.</p>
          
          <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Best regards,<br>
            <strong>5KI Financial Services Team</strong>
          </p>
        </div>
      `
    };

    const result = await sendEmailWithRetry(mailOptions);

    console.log('[NOTIFICATION SUCCESS] Member credentials email sent successfully');
    res.status(200).json({ 
      success: true,
      message: 'Member credentials email sent successfully',
      data: {
        email: email,
        memberId: memberId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Error sending member credentials email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send member credentials email',
      error: error.message
    });
  }
});

// Initialize the server
// Add self-ping function RIGHT BEFORE startServer
const startSelfPing = () => {
  if (process.env.NODE_ENV === 'production') {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    
    setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:${PORT}/health`);
        console.log(`Self-ping: ${response.status} - ${new Date().toISOString()}`);
      } catch (error) {
        console.log('Self-ping failed:', error.message);
      }
    }, PING_INTERVAL);
  }
};

// Enhanced server initialization with auto-recovery
const startServer = async () => {
  try {
    // Initialize email transporter
    await initializeTransporter();
    
    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📧 Email service: ${transporter ? 'Mailjet Ready' : 'Console Fallback'}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/test-mailjet`);
      
      // Start self-ping AFTER server is listening
      startSelfPing();
    });

    // Enhanced error handling for server
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, retrying...`);
        setTimeout(() => {
          server.close();
          startServer();
        }, 1000);
      }
    });

    // Enhanced graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, starting graceful shutdown...');
      server.close(() => {
        console.log('Process terminated gracefully');
        // Don't force exit, let the platform handle it
      });
    });

    // Handle other termination signals
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down...');
      server.close(() => {
        process.exit(0);
      });
    });

    // Prevent uncaught exceptions from crashing the app
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Don't exit, keep the process running
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit, keep the process running
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    // Retry after delay instead of exiting
    console.log('Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
};

// Start the server
startServer();
------
this is my api
import axios from 'axios';

axios.defaults.withCredentials = false; 

const API_URL = 'http://192.168.8.38:10000';
const WEBSITE_URL = 'https://fivekiapp.onrender.com';
const FACEBOOK_URL = 'https://www.facebook.com/5KiFS'; 

// Admin Emails
export const sendAdminCredentialsEmail = async (adminData) => {
  try {
    const response = await axios.post(`${API_URL}/send-admin-email`, {
      ...adminData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error sending admin credentials email:', error);
    throw error;
  }
};

export const sendAdminDeleteData = async (adminData) => {
  try {
    const response = await axios.post(`${API_URL}/send-delete-admin-email`, {
      ...adminData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error sending admin delete email:', error);
    throw error;
  }
};

// Co-Admin Emails
export const sendCoAdminCredentialsEmail = async (adminData) => {
  try {
    const response = await axios.post(`${API_URL}/send-coadmin-email`, {
      ...adminData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response.data;
  } catch (error) {
    console.error('Error sending co-admin credentials email:', error);
    throw error;
  }
};

export const sendCoAdminDeleteData = async (adminData) => {
  try {
    const response = await axios.post(`${API_URL}/send-delete-coadmin-email`, {
      ...adminData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response.data;
  } catch (error) {
    console.error('Error sending co-admin delete email:', error);
    throw error;
  }
};

// Two-Factor Authentication
export const sendVerificationCode = async (emailData) => {
  try {
    const response = await axios.post(`${API_URL}/send-verification-code`, {
      email: emailData.email,
      firstName: emailData.firstName || '',
      verificationCode: emailData.verificationCode,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    }, {
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send verification code');
    }
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new Error(error.response?.data?.message || 'Network error. Please try again.');
  }
};

// User Registration
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      ...userData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Registration Approvals/Rejections
export const ApproveRegistration = async (approveRegistrationApplication) => {
  try {
    const response = await axios.post(`${API_URL}/approveRegistrations`, {
      ...approveRegistrationApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error approving registration:', error);
    throw error;
  }
};

export const RejectRegistration = async (rejectRegistrationApplication) => {
  try {
    const response = await axios.post(`${API_URL}/rejectRegistrations`, {
      ...rejectRegistrationApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting registration:', error);
    throw error;
  }
};

// Member Actions
export const sendMemberCredentialsEmail = async (memberData) => {
  try {
    const response = await axios.post(`${API_URL}/send-member-credentials`, {
      ...memberData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response;
  } catch (error) {
    console.error('Error sending member credentials email:', error);
    throw error;
  }
};

export const MemberLoan = async (loanApplication) => {
  try {
    const response = await axios.post(`${API_URL}/applyLoan`, {
      ...loanApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error applying for loan:', error);
    throw error;
  }
};

export const MemberDeposit = async (depositApplication) => {
  try {
    const response = await axios.post(`${API_URL}/deposit`, {
      ...depositApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error depositing:', error);
    throw error;
  }
};

export const MemberPayment = async (paymentApplication) => {
  try {
    const response = await axios.post(`${API_URL}/payment`, {
      ...paymentApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error making payment:', error);
    throw error;
  }
};

export const MemberWithdraw = async (withdrawApplication) => {
  try {
    const response = await axios.post(`${API_URL}/withdraw`, {
      ...withdrawApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error withdrawing:', error);
    throw error;
  }
};

// Approval APIs
export const ApproveDeposits = async (approveDepositsApplication) => {
  try {
    const response = await axios.post(`${API_URL}/approveDeposits`, {
      ...approveDepositsApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error approving deposit:', error);
    throw error;
  }
};

export const RejectDeposits = async (rejectDepositsApplication) => {
  try {
    const response = await axios.post(`${API_URL}/rejectDeposits`, {
      ...rejectDepositsApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting deposit:', error);
    throw error;
  }
};

export const ApproveLoans = async (approveLoanApplication) => {
  try {
    const response = await axios.post(`${API_URL}/approveLoans`, {
      ...approveLoanApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error approving loan:', error);
    throw error;
  }
};

export const RejectLoans = async (rejectLoanApplication) => {
  try {
    const response = await axios.post(`${API_URL}/rejectLoans`, {
      ...rejectLoanApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting loan:', error);
    throw error;
  }
};

export const ApprovePayments = async (approvePaymentApplication) => {
  try {
    const response = await axios.post(`${API_URL}/approvePayments`, {
      ...approvePaymentApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error approving payment:', error);
    throw error;
  }
};

export const RejectPayments = async (rejectPaymentApplication) => {
  try {
    const response = await axios.post(`${API_URL}/rejectPayments`, {
      ...rejectPaymentApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting payment:', error);
    throw error;
  }
};

export const ApproveWithdraws = async (approveWithdrawApplication) => {
  try {
    const response = await axios.post(`${API_URL}/approveWithdraws`, {
      ...approveWithdrawApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error approving withdraw:', error);
    throw error;
  }
};

export const RejectWithdraws = async (rejectWithdrawApplication) => {
  try {
    const response = await axios.post(`${API_URL}/rejectWithdraws`, {
      ...rejectWithdrawApplication,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL // Added Facebook link
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting withdraw:', error);
    throw error;
  }
};

export const MemberWithdrawMembership = async (withdrawalData) => {
  try {
    const response = await axios.post(`${API_URL}/membershipWithdrawal`, {
      ...withdrawalData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting membership withdrawal:', error);
    throw error;
  }
};

export const ApproveMembershipWithdrawal = async (approvalData) => {
  try {
    const response = await axios.post(`${API_URL}/approveMembershipWithdrawal`, {
      ...approvalData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response.data;
  } catch (error) {
    console.error('Error approving membership withdrawal:', error);
    throw error;
  }
};

export const RejectMembershipWithdrawal = async (rejectionData) => {
  try {
    const response = await axios.post(`${API_URL}/rejectMembershipWithdrawal`, {
      ...rejectionData,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting membership withdrawal:', error);
    throw error;
  }
};

// Add to your existing API exports
export const SendLoanReminder = async ({ 
  memberId, 
  transactionId, 
  dueDate, 
  email, 
  firstName, 
  lastName, 
  loanAmount, 
  outstandingBalance 
}) => {
  try {
    const response = await axios.post(`${API_URL}/send-loan-reminder`, {
      memberId,
      transactionId,
      dueDate,
      email,
      firstName,
      lastName,
      loanAmount,
      outstandingBalance,
      websiteLink: WEBSITE_URL,
      facebookLink: FACEBOOK_URL
    });
    return response.data;
  } catch (error) {
    console.error('Error sending loan reminder:', error);
    throw error;
  }
};

import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaDownload, FaFilter, FaChevronLeft, FaChevronRight, FaPlus, FaSave, FaTimes, FaCheckCircle, FaUser, FaUserCheck, FaUserTimes, FaEye, FaEdit, FaTrash, FaPhone, FaEnvelope, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { FiAlertCircle } from 'react-icons/fi';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendMemberCredentialsEmail, sendMemberDeleteData } from '../../../../Server/api';
import ExcelJS from 'exceljs';

// Options (simplified as requested)
const governmentIdOptions = [
  { key: 'national', label: 'National ID (PhilSys)' },
  { key: 'sss', label: 'SSS ID' },
  { key: 'philhealth', label: 'PhilHealth ID' },
  { key: 'drivers_license', label: 'Drivers License' }
];

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) {
    return generateRandomPassword();
  }
  return pwd;
};

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const styles = {
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '0'
  },
  mainContainer: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  headerText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0'
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    marginTop: '4px'
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    width: '100%'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    flexWrap: 'wrap',
    flex: '1',
    minWidth: '0'
  },
  tabButton: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: 'transparent',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  activeTabButton: {
    backgroundColor: '#fff',
    color: '#1e40af',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tabIcon: {
    fontSize: '16px'
  },
  searchDownloadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: '10',
    flexShrink: '0'
  },
  filterContainer: {
    position: 'relative'
  },
  filterButton: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  filterButtonHover: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    minWidth: '180px',
    zIndex: '100',
    marginTop: '4px'
  },
  filterOption: {
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activeFilterOption: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontWeight: '600'
  },
  searchContainer: {
    position: 'relative',
    width: '280px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  searchInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    zIndex: '1'
  },
  downloadButton: {
    padding: '10px 12px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    width: '40px',
    height: '40px',
    flexShrink: '0'
  },
  downloadButtonHover: {
    backgroundColor: '#047857'
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '80px'
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '40px'
  },
  paginationInfo: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  paginationButton: {
    padding: '4px 8px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '10px',
    minWidth: '24px',
    minHeight: '24px'
  },
  paginationButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb'
  },
  addMemberButton: {
    position: 'fixed',
    right: '32px',
    bottom: '32px',
    backgroundColor: '#1e40af',
    color: '#fff',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(30, 64, 175, 0.3)',
    transition: 'all 0.3s ease',
    zIndex: '100',
    fontSize: '18px'
  },
  addMemberButtonHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 15px 30px rgba(30, 64, 175, 0.4)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    overflowY: 'auto',
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #F1F5F9'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
    color: 'white',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: 0
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
      transform: 'rotate(90deg)'
    }
  },
  modalContent: {
    padding: '2rem',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0
  },
  columnsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '1.5rem'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  section: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e2e8f0'
  },
  fieldGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    padding: '0.5rem 0'
  },
  fieldLabel: {
    fontWeight: '500',
    color: '#64748b',
    fontSize: '0.875rem',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  fieldValue: {
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
    color: '#1f2937',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e5e7eb',
    background: '#f8fafc',
    flexShrink: 0
  },
  actionButton: {
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    minWidth: '140px'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
    }
  },
  secondaryButton: {
    background: '#6b7280',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
    }
  },
  deleteButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
    }
  },
  disabledButton: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    opacity: '0.7',
    '&:hover': {
      transform: 'none',
      boxShadow: 'none'
    }
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#d1d5db'
  },
  noDataText: {
    fontSize: '16px',
    margin: 0
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    background: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '1000px'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
    color: 'white',
    height: '56px',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  tableHeaderCell: {
    padding: '1rem 0.75rem',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  tableRow: {
    height: '52px',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  tableCell: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  viewButton: {
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#2563eb',
      color: 'white'
    }
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusActive: {
    background: '#d1fae5',
    color: '#065f46'
  },
  statusInactive: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  modalCardSmall: {
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  confirmIcon: {
    marginBottom: '14px',
    fontSize: '28px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '18px',
    textAlign: 'center',
    color: '#475569',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formSection: {
    marginBottom: '16px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  requiredAsterisk: {
    color: '#dc2626',
    marginLeft: '2px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },
  formInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  fileUploadSection: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fileUploadSectionHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff'
  },
  fileInput: {
    display: 'none'
  },
  fileUploadText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px',
    textAlign: 'center'
  },
  fileName: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500',
    marginTop: '4px',
    textAlign: 'center',
    wordBreak: 'break-word'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
  },
  financialCard: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  financialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  financialLabel: {
    fontSize: '0.875rem',
    color: '#0369a1',
    fontWeight: '500'
  },
  financialValue: {
    fontSize: '1rem',
    fontWeight: '600'
  }
};

const emptyForm = {
  email: '',
  phoneNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  address: '',
  governmentId: '',
  balance: '',
  investment: '',
  loans: ''
};

const DataMigration = () => {
  // Data
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRegistrationFee, setMinRegistrationFee] = useState(5000);

  // Pagination
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(0);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Files
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);

  // UX
  const [uploading, setUploading] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  const [memberFilter, setMemberFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Form validation errors
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');

  // Create style element and append to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .hover-lift:hover {
        transform: translateY(-2px);
        boxShadow: 0 10px 25px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snap = await database.ref('Members').once('value');
      const data = snap.val() || {};
      const list = Object.values(data).sort((a, b) => Number(a.id) - Number(b.id));
      setMembers(list);
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to load members');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const feeSnap = await database.ref('Settings/RegistrationMinimumFee').once('value');
        const val = feeSnap.val();
        const num = parseFloat(val);
        if (!isNaN(num)) setMinRegistrationFee(num);
      } catch (_) {}

      await fetchMembers();
    })();
  }, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = members;

    // Apply status filter
    if (memberFilter === 'active') {
      filtered = members.filter(member => member.status === 'active');
    } else if (memberFilter === 'inactive') {
      filtered = members.filter(member => member.status === 'inactive');
    }

    // Apply search filter
    if (q) {
      filtered = filtered.filter(m => (
        `${m.firstName || ''} ${m.middleName || ''} ${m.lastName || ''}`.toLowerCase().includes(q) ||
        `${m.email || ''}`.toLowerCase().includes(q) ||
        `${m.phoneNumber || ''}`.toLowerCase().includes(q) ||
        String(m.id || '').includes(q)
      ));
    }

    return filtered;
  }, [searchQuery, members, memberFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    if (currentPage > totalPages - 1) setCurrentPage(0);
  }, [totalPages]);

  const toPeso = (n) => `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);
  };

  const handleDownload = async () => {
    try {
      if (filteredData.length === 0) {
        setErrorMessage('No data to download');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Members');

      const headers = Object.keys(filteredData[0]);
      worksheet.addRow(headers);

      filteredData.forEach(item => {
        const row = headers.map(header => item[header]);
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Members.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const validateFields = () => {
    let isValid = true;
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');
    setPhoneNumberError('');

    if (!formData.email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailError('Invalid email format');
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      setPhoneNumberError('Contact number is required');
      isValid = false;
    } else if (!/^\d{11}$/.test(formData.phoneNumber)) {
      setPhoneNumberError('Contact number must be exactly 11 digits');
      isValid = false;
    }

    return isValid;
  };

  const openAddModal = () => {
    setFormData({ ...emptyForm });
    setValidIdFrontFile(null);
    setSelfieFile(null);
    setProofOfPaymentFile(null);
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');
    setPhoneNumberError('');
    setAddModalVisible(true);
  };

  const openViewModal = (member) => {
    setSelectedMember(member);
    setViewModalVisible(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      firstName: member.firstName || '',
      middleName: member.middleName || '',
      lastName: member.lastName || '',
      dateOfBirth: member.dateOfBirth || '',
      placeOfBirth: member.placeOfBirth || '',
      address: member.address || '',
      governmentId: member.governmentId || '',
      balance: String(member.balance ?? 0),
      investment: String(member.investment ?? 0),
      loans: String(member.loans ?? 0)
    });
    setValidIdFrontFile(null);
    setSelfieFile(null);
    setProofOfPaymentFile(null);
    setEditModalVisible(true);
  };

  const closeModals = () => {
    setAddModalVisible(false);
    setViewModalVisible(false);
    setEditModalVisible(false);
    setSelectedMember(null);
    setEditingMember(null);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
  };

  const uploadImageToStorage = async (file, path) => {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const getNextMemberId = async () => {
    const membersSnap = await database.ref('Members').once('value');
    const membersData = membersSnap.val() || {};
    const existingIds = Object.keys(membersData).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
    let newId = 5001;
    for (const id of existingIds) {
      if (id === newId) newId++;
      else if (id > newId) break;
    }
    return newId;
  };

  const validateAddFields = () => {
    if (!validateFields()) {
      return false;
    }

    if (!validIdFrontFile || !selfieFile || !proofOfPaymentFile) {
      setErrorMessage('Please upload all required images/documents.');
      setErrorModalVisible(true);
      return false;
    }

    // Check if email already exists
    const emailExists = members.some(member => member.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
      setEmailError('Email address is already in use');
      return false;
    }

    return true;
  };

  const handleSubmitConfirmation = () => {
    if (!validateAddFields()) return;
    setPendingAction('add');
    setConfirmModalVisible(true);
  };

  const submitAddMember = async () => {
    setConfirmModalVisible(false);
    setUploading(true);

    try {
      const password = generateRandomPassword();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
      const userId = userCredential.user.uid;

      const newId = await getNextMemberId();

      const now = new Date();
      const dateAdded = formatDate(now);
      const timeAdded = formatTime(now);

      // Upload images
      const validIdFrontUrl = await uploadImageToStorage(validIdFrontFile, `member_docs/${newId}/valid_id_front_${Date.now()}`);
      const selfieUrl = await uploadImageToStorage(selfieFile, `member_docs/${newId}/selfie_${Date.now()}`);
      const proofOfPaymentUrl = await uploadImageToStorage(proofOfPaymentFile, `member_docs/${newId}/registration_payment_proof_${Date.now()}`);

      const balance = parseFloat(formData.balance || 0);
      const investment = parseFloat(formData.investment || 0);
      const loans = parseFloat(formData.loans || 0);

      const memberData = {
        id: newId,
        authUid: userId,
        email: formData.email,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        address: formData.address,
        governmentId: formData.governmentId,
        dateAdded,
        timeAdded,
        status: 'active',
        balance: balance,
        investment: investment,
        loans: loans,
        validIdFront: validIdFrontUrl,
        selfie: selfieUrl,
        registrationPaymentProof: proofOfPaymentUrl,
        initialPassword: password
      };

      // Save member data
      await database.ref(`Members/${newId}`).set(memberData);

      // Store pending add for email sending
      setPendingAdd({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        password: password,
        memberId: memberData.id,
        dateAdded: memberData.dateAdded
      });

      setSuccessMessage('Member added successfully! Credentials have been sent to the member.');
      setSuccessModalVisible(true);
      closeModals();
      await fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      setErrorMessage(error.message || 'Failed to add member');
      setErrorModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const submitEditMember = async () => {
    if (!editingMember) return;
    setUploading(true);

    try {
      const id = editingMember.id;
      const updates = {
        phoneNumber: formData.phoneNumber || '',
        firstName: formData.firstName || '',
        middleName: formData.middleName || '',
        lastName: formData.lastName || '',
        dateOfBirth: formData.dateOfBirth || '',
        placeOfBirth: formData.placeOfBirth || '',
        address: formData.address || '',
        governmentId: formData.governmentId || '',
        balance: parseFloat(formData.balance || editingMember.balance || 0),
        investment: parseFloat(formData.investment || editingMember.investment || 0),
        loans: parseFloat(formData.loans || editingMember.loans || 0)
      };

      if (validIdFrontFile) updates.validIdFront = await uploadImageToStorage(validIdFrontFile, `member_docs/${id}/valid_id_front_${Date.now()}`);
      if (selfieFile) updates.selfie = await uploadImageToStorage(selfieFile, `member_docs/${id}/selfie_${Date.now()}`);
      if (proofOfPaymentFile) updates.registrationPaymentProof = await uploadImageToStorage(proofOfPaymentFile, `member_docs/${id}/registration_payment_proof_${Date.now()}`);

      await database.ref(`Members/${id}`).update(updates);

      setSuccessMessage('Member updated successfully!');
      setSuccessModalVisible(true);
      closeModals();
      await fetchMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      setErrorMessage(error.message || 'Failed to update member');
      setErrorModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMember = async () => {
    setConfirmDeleteVisible(false);
    setIsProcessing(true);
    setActionInProgress(true);

    try {
      const idToDelete = pendingDelete.id;
      const uidToDelete = pendingDelete.uid;

      // Delete from database
      await database.ref(`Members/${idToDelete}`).remove();

      // Delete Firebase authentication user if UID exists
      if (uidToDelete) {
        try {
          // Note: Client-side Firebase Auth doesn't allow deleting other users
          // This would need to be handled via a Cloud Function
          console.log('Firebase user deletion would be handled via Cloud Function for UID:', uidToDelete);
        } catch (authError) {
          console.warn('Could not delete Firebase auth user, but proceeding with database deletion:', authError);
        }
      }

      setSuccessMessage(`Member account deleted successfully!`);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error deleting member:', error);
      setErrorMessage(error.message || 'Failed to delete member');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    
    // Send member credentials email after successful addition
    if (pendingAdd) {
      sendMemberCredentialsEmail({
        firstName: pendingAdd.firstName,
        lastName: pendingAdd.lastName,
        email: pendingAdd.email,
        password: pendingAdd.password,
        memberId: pendingAdd.memberId,
        dateAdded: pendingAdd.dateAdded
      }).catch(error => console.error('Error sending member credentials email:', error));
      
      setPendingAdd(null);
    }

    // Send delete notification after successful deletion
    if (pendingDelete) {
      sendMemberDeleteData({
        email: pendingDelete.email,
        firstName: pendingDelete.firstName || '',
        lastName: pendingDelete.lastName || ''
      }).catch(error => console.error('Error sending member delete notification:', error));
      
      // Close the view modal if it's open (after delete action)
      setViewModalVisible(false);
      setSelectedMember(null);
    }
    
    if (pendingAction) {
      setPendingAction(null);
    }
  };

  const renderMemberFilter = () => {
    return (
      <div style={styles.filterContainer}>
        <button 
          style={{
            ...styles.filterButton,
            ...(isHovered.filterButton ? styles.filterButtonHover : {})
          }}
          onMouseEnter={() => handleMouseEnter('filterButton')}
          onMouseLeave={() => handleMouseLeave('filterButton')}
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <FaFilter />
          <span>{memberFilter === 'all' ? 'All Members' : memberFilter === 'active' ? 'Active' : 'Inactive'}</span>
        </button>

        {showFilterDropdown && (
          <div style={styles.filterDropdown}>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'all' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('all');
                setShowFilterDropdown(false);
              }}
            >
              <FaUser />
              <span>All Members</span>
            </button>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'active' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('active');
                setShowFilterDropdown(false);
              }}
            >
              <FaUserCheck />
              <span>Active</span>
            </button>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'inactive' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('inactive');
                setShowFilterDropdown(false);
              }}
            >
              <FaUserTimes />
              <span>Inactive</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAddEditModal = (mode) => (
    <div style={styles.modalOverlay} onClick={closeModals}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{mode === 'add' ? 'Add New Member' : `Edit Member #${editingMember?.id}`}</h2>
          <button 
            onClick={closeModals}
            style={styles.closeButton}
          >
            <AiOutlineClose />
          </button>
        </div>

        <div style={styles.modalContent}>
          <div style={styles.formGrid}>
            {/* Left Column */}
            <div>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  First Name<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  autoCapitalize="words"
                />
                {firstNameError && <span style={styles.errorText}>{firstNameError}</span>}
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Last Name<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  autoCapitalize="words"
                />
                {lastNameError && <span style={styles.errorText}>{lastNameError}</span>}
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Email Address<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  type="email"
                  autoCapitalize="none"
                  disabled={mode === 'edit'}
                />
                {emailError && <span style={styles.errorText}>{emailError}</span>}
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Phone Number<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  placeholder="Enter 11-digit contact number"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const numericText = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                    handleInputChange('phoneNumber', numericText);
                  }}
                  type="tel"
                />
                {phoneNumberError && <span style={styles.errorText}>{phoneNumberError}</span>}
              </div>

              {mode === 'add' && (
                <div style={styles.formSection}>
                  <label style={styles.formLabel}>
                    Valid ID Front<span style={styles.requiredAsterisk}>*</span>
                  </label>
                  <div 
                    style={styles.fileUploadSection}
                    onClick={() => document.getElementById('validIdFront').click()}
                  >
                    <input
                      id="validIdFront"
                      style={styles.fileInput}
                      type="file"
                      onChange={(e) => handleFileChange(e, setValidIdFrontFile)}
                      accept="image/*"
                    />
                    <p style={styles.fileUploadText}>
                      {validIdFrontFile ? 'Change file' : 'Click to upload'}
                    </p>
                    {validIdFrontFile && (
                      <p style={styles.fileName}>{validIdFrontFile.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>Middle Name</label>
                <input
                  style={styles.formInput}
                  placeholder="Enter middle name"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  autoCapitalize="words"
                />
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Government ID<span style={styles.requiredAsterisk}>*</span>
                </label>
                <select
                  style={styles.formSelect}
                  value={formData.governmentId}
                  onChange={(e) => handleInputChange('governmentId', e.target.value)}
                >
                  <option value="">Select Government ID</option>
                  {governmentIdOptions.map((option) => (
                    <option key={option.key} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Current Balance</label>
                <input
                  style={styles.formInput}
                  type="number"
                  step="0.01"
                  placeholder="Enter current balance"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                />
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Investment</label>
                <input
                  style={styles.formInput}
                  type="number"
                  step="0.01"
                  placeholder="Enter investment amount"
                  value={formData.investment}
                  onChange={(e) => handleInputChange('investment', e.target.value)}
                />
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Loans</label>
                <input
                  style={styles.formInput}
                  type="number"
                  step="0.01"
                  placeholder="Enter loans amount"
                  value={formData.loans}
                  onChange={(e) => handleInputChange('loans', e.target.value)}
                />
              </div>

              {mode === 'add' && (
                <div style={styles.formSection}>
                  <label style={styles.formLabel}>
                    Selfie Photo<span style={styles.requiredAsterisk}>*</span>
                  </label>
                  <div 
                    style={styles.fileUploadSection}
                    onClick={() => document.getElementById('selfie').click()}
                  >
                    <input
                      id="selfie"
                      style={styles.fileInput}
                      type="file"
                      onChange={(e) => handleFileChange(e, setSelfieFile)}
                      accept="image/*"
                    />
                    <p style={styles.fileUploadText}>
                      {selfieFile ? 'Change file' : 'Click to upload selfie'}
                    </p>
                    {selfieFile && (
                      <p style={styles.fileName}>{selfieFile.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Required Fields */}
          <div style={styles.formGrid}>
            <div>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Date of Birth<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  type="date"
                />
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Place of Birth<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  placeholder="Enter place of birth"
                  value={formData.placeOfBirth}
                  onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                  autoCapitalize="words"
                />
              </div>
            </div>

            <div>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Address<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  autoCapitalize="words"
                />
              </div>
            </div>
          </div>

          {/* Proof of Payment for Add */}
          {mode === 'add' && (
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Proof of Payment<span style={styles.requiredAsterisk}>*</span>
              </label>
              <div 
                style={styles.fileUploadSection}
                onClick={() => document.getElementById('proofOfPayment').click()}
              >
                <input
                  id="proofOfPayment"
                  style={styles.fileInput}
                  type="file"
                  onChange={(e) => handleFileChange(e, setProofOfPaymentFile)}
                  accept="image/*,application/pdf"
                />
                <p style={styles.fileUploadText}>
                  {proofOfPaymentFile ? 'Change file' : 'Click to upload proof of payment'}
                </p>
                {proofOfPaymentFile && (
                  <p style={styles.fileName}>{proofOfPaymentFile.name}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.modalActions}>
          <button
            style={{
              ...styles.actionButton,
              ...styles.secondaryButton
            }}
            onClick={closeModals}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.actionButton,
              ...styles.primaryButton,
              ...(uploading ? styles.disabledButton : {})
            }}
            onClick={mode === 'add' ? handleSubmitConfirmation : submitEditMember}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                <span>{mode === 'add' ? 'Adding...' : 'Updating...'}</span>
              </>
            ) : (
              <>
                <FaCheckCircle />
                <span>{mode === 'add' ? 'Add Member' : 'Update Member'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const noMatch = filteredData.length === 0;

  return (
    <div style={styles.safeAreaView}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Members Management</h1>
            <p style={styles.headerSubtitle}>
              Manage all member accounts, balances, and information in one place
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Tabs - Left side */}
            <div style={styles.tabContainer}>
              <button
                style={{
                  ...styles.tabButton,
                  ...styles.activeTabButton
                }}
                className="hover-lift"
              >
                <FaUser style={styles.tabIcon} />
                <span>All Members</span>
              </button>
            </div>

            {/* Search, Filter, Download - Right side */}
            <div style={styles.searchDownloadContainer}>
              {renderMemberFilter()}
              
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? styles.searchInputFocus : {})
                  }}
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => handleMouseEnter('search')}
                  onBlur={() => handleMouseLeave('search')}
                />
              </div>

              <button 
                style={{
                  ...styles.downloadButton,
                  ...(isHovered.download ? styles.downloadButtonHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('download')}
                onMouseLeave={() => handleMouseLeave('download')}
                onClick={handleDownload}
                title="Export to Excel"
              >
                <FaDownload />
              </button>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div style={styles.dataContainer}>
          {/* Pagination at the top */}
          {!noMatch && filteredData.length > 0 && (
            <div style={styles.paginationContainer}>
              <span style={styles.paginationInfo}>
                {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredData.length)} of {filteredData.length}
              </span>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 0 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronLeft />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === totalPages - 1 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}

          {noMatch ? (
            <div style={styles.noDataContainer}>
              <FaSearch style={styles.noDataIcon} />
              <p style={styles.noDataText}>No matches found for your search</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={styles.noDataContainer}>
              <FaUser style={styles.noDataIcon} />
              <p style={styles.noDataText}>No members available</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Email</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Contact</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Balance</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Investment</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Loans</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Date Added</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(m => (
                    <tr key={m.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{m.id}</td>
                      <td style={styles.tableCell}>
                        <div style={{ fontWeight: '500' }}>
                          {m.firstName} {m.lastName}
                        </div>
                      </td>
                      <td style={styles.tableCell}>{m.email}</td>
                      <td style={styles.tableCell}>{m.phoneNumber || m.contactNumber || 'N/A'}</td>
                      <td style={styles.tableCell}>{toPeso(m.balance)}</td>
                      <td style={styles.tableCell}>{toPeso(m.investment)}</td>
                      <td style={styles.tableCell}>{toPeso(m.loans)}</td>
                      <td style={styles.tableCell}>{m.dateAdded || m.dateApproved || 'N/A'}</td>
                      <td style={styles.tableCell}>
                        <button 
                          style={styles.viewButton}
                          onClick={() => openViewModal(m)}
                        >
                          <FaEye />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Member Button */}
        <button 
          style={{
            ...styles.addMemberButton,
            ...(isHovered.addMember ? styles.addMemberButtonHover : {})
          }}
          onMouseEnter={() => handleMouseEnter('addMember')}
          onMouseLeave={() => handleMouseLeave('addMember')}
          onClick={openAddModal}
          className="hover-lift"
        >
          <FaPlus />
        </button>

        {/* Add Member Modal */}
        {addModalVisible && renderAddEditModal('add')}

        {/* Edit Member Modal */}
        {editModalVisible && renderAddEditModal('edit')}

        {/* View Member Modal */}
        {viewModalVisible && selectedMember && (
          <div style={styles.modalOverlay} onClick={closeModals}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  <FaUser />
                  Member Details
                </h2>
                <button 
                  onClick={closeModals}
                  style={styles.closeButton}
                >
                  <AiOutlineClose />
                </button>
              </div>
              
              <div style={styles.modalContent}>
                <div style={styles.columnsContainer}>
                  {/* Left Column - Personal Information */}
                  <div style={styles.column}>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaUser />
                        Personal Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>
                          <FaIdCard />
                          ID:
                        </span>
                        <span style={styles.fieldValue}>#{selectedMember.id}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>First Name:</span>
                        <span style={styles.fieldValue}>{selectedMember.firstName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Middle Name:</span>
                        <span style={styles.fieldValue}>{selectedMember.middleName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Last Name:</span>
                        <span style={styles.fieldValue}>{selectedMember.lastName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date of Birth:</span>
                        <span style={styles.fieldValue}>
                          {selectedMember.dateOfBirth ? new Date(selectedMember.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Place of Birth:</span>
                        <span style={styles.fieldValue}>{selectedMember.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Address:</span>
                        <span style={styles.fieldValue}>{selectedMember.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Contact & Financial Information */}
                  <div style={styles.column}>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaEnvelope />
                        Contact Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>
                          <FaEnvelope />
                          Email:
                        </span>
                        <span style={styles.fieldValue}>{selectedMember.email || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>
                          <FaPhone />
                          Contact Number:
                        </span>
                        <span style={styles.fieldValue}>{selectedMember.phoneNumber || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Government ID:</span>
                        <span style={styles.fieldValue}>{selectedMember.governmentId || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={styles.financialCard}>
                      <h3 style={styles.sectionTitle}>
                        <FaMoneyBillWave />
                        Financial Information
                      </h3>
                      <div style={styles.financialItem}>
                        <span style={styles.financialLabel}>Current Balance:</span>
                        <span style={styles.financialValue}>{toPeso(selectedMember.balance)}</span>
                      </div>
                      <div style={styles.financialItem}>
                        <span style={styles.financialLabel}>Investment:</span>
                        <span style={styles.financialValue}>{toPeso(selectedMember.investment)}</span>
                      </div>
                      <div style={styles.financialItem}>
                        <span style={styles.financialLabel}>Loans:</span>
                        <span style={styles.financialValue}>{toPeso(selectedMember.loans)}</span>
                      </div>
                    </div>

                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaCalendarAlt />
                        Account Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Added:</span>
                        <span style={styles.fieldValue}>{selectedMember.dateAdded || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Added:</span>
                        <span style={styles.fieldValue}>{selectedMember.timeAdded || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Status:</span>
                        <span style={styles.fieldValue}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(selectedMember.status === 'active' ? styles.statusActive : styles.statusInactive)
                          }}>
                            {selectedMember.status || 'active'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton
                  }}
                  onClick={() => {
                    setViewModalVisible(false);
                    openEditModal(selectedMember);
                  }}
                >
                  <FaEdit />
                  Edit Member
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={() => {
                    setPendingDelete(selectedMember);
                    setConfirmDeleteVisible(true);
                  }}
                  disabled={isProcessing}
                >
                  <FaTrash />
                  Delete Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        {confirmModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmModalVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f59e0b' }} />
              <p style={styles.modalText}>
                Are you sure you want to add this member? This will create their account and send them login credentials.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton
                  }} 
                  onClick={submitAddMember}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Yes'}
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton
                  }} 
                  onClick={() => setConfirmModalVisible(false)}
                  disabled={actionInProgress}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmDeleteVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
              <p style={styles.modalText}>
                Are you sure you want to delete this member account? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton
                  }} 
                  onClick={handleDeleteMember}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Delete Account'}
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton
                  }} 
                  onClick={() => setConfirmDeleteVisible(false)}
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModalVisible && (
          <div style={styles.modalOverlay} onClick={handleSuccessOk}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#059669' }} />
              <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Success!</h2>
              <p style={styles.modalText}>
                {successMessage}
              </p>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }}
                onClick={handleSuccessOk}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setErrorModalVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
              <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Error</h2>
              <p style={styles.modalText}>
                {errorMessage}
              </p>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }}
                onClick={() => setErrorModalVisible(false)}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMigration;
