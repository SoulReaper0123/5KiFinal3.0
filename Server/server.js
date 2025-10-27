const express = require('express');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const Mailjet = require('node-mailjet');

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
                    Email: process.env.MAILJET_FROM_EMAIL || 'louisdysarino@gmail.com',
                    Name: process.env.MAILJET_FROM_NAME || '5KI Financial Services'
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
        from: mailOptions.from || `"5KI Financial Services" <${process.env.MAILJET_FROM_EMAIL || 'louisdysarino@gmail.com'}>`
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
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: '5KI Email API',
    email: transporter ? 'Connected' : 'Not Connected',
    provider: 'Mailjet'
  });
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
          From: ${process.env.MAILJET_FROM_EMAIL || 'louisdysarino@gmail.com'}<br>
          Service: Mailjet<br>
          Status: ${transporter ? '✅ Connected' : '❌ Not Connected'}
        </div>

        <form id="testForm">
          <div class="form-group">
            <label for="email">Send test email to:</label>
            <input type="email" id="email" name="email" value="louisdysarino@gmail.com" required>
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
    const { to = 'louisdysarino@gmail.com', subject = 'Test Email from Mailjet - 5KI Financial Services' } = req.body;
    
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
                <td style="padding: 8px; border: 1px solid #ddd;">${process.env.MAILJET_FROM_EMAIL || 'louisdysarino@gmail.com'}</td>
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
    const { to = 'louisdysarino@gmail.com' } = req.body;
    
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
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();