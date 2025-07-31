const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

console.log('GMAIL_USER:', process.env.GMAIL_USER);

const app = express();
const PORT = process.env.PORT || 3000;

// Constants for links
const WEBSITE_LINK = 'https://your-official-website.com';
const DASHBOARD_LINK = 'https://your-official-website.com/admin/dashboard';
const FACEBOOK_LINK = 'https://www.facebook.com/5KiFS';
const GMAIL_OWNER = '5kifinancials@gmail.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

// Helper function to format dates for display
const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

app.get('/', (req, res) => {
    res.send('API is running ✅');
});

// ==============================================
// ADMIN EMAILS
// ==============================================

app.post('/send-admin-email', async (req, res) => {
    console.log('[NOTIFICATION] Initiating admin creation emails', req.body);
    const { email, firstName, middleName = '', lastName, password, websiteLink, facebookLink } = req.body;

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
        hour: '2-digit',
        minute: '2-digit'
    });

    try {
        // Email to system owner
        console.log('[NOTIFICATION] Sending admin creation notification to owner');
        const ownerMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'New Admin Account Created',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2D5783; border-bottom: 2px solid #2D5783; padding-bottom: 10px;">
                        New Admin Account Created
                    </h2>
                    <p>A new admin account has been successfully created in the system.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="margin-top: 0; color: #2D5783;">Admin Details</h3>
                        <p><strong>Name:</strong> ${fullName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Date Created:</strong> ${currentDate}</p>
                    </div>
                    
                    <p>This is an automated notification. No action is required unless this was unauthorized.</p>
                    <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
                        <a href="${websiteLink || WEBSITE_LINK}" style="color: #2D5783; text-decoration: none;">Visit Website</a> | 
                        <a href="${facebookLink || FACEBOOK_LINK}" style="color: #2D5783; text-decoration: none;">Facebook Page</a>
                    </p>
                </div>
            `
        };

        // Email to new admin
        console.log('[NOTIFICATION] Sending admin credentials to new admin');
        const adminMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your 5KI Financial Services Admin Account',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2D5783; border-bottom: 2px solid #2D5783; padding-bottom: 10px;">
                        Welcome to 5KI Financial Services
                    </h2>
                    <p>Dear ${firstName},</p>
                    <p>Your administrator account has been successfully created. Below are your login credentials:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="margin-top: 0; color: #2D5783;">Account Information</h3>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Temporary Password:</strong> ${password}</p>
                        <p><strong>Account Type:</strong> Administrator</p>
                    </div>
                    
                    <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0;">
                        <h3 style="margin-top: 0; color: #2D5783;">Important Security Notice</h3>
                        <p>For security reasons:</p>
                        <ul>
                            <li>Change your password immediately after first login</li>
                            <li>Never share your credentials with anyone</li>
                            <li>Always log out after your session</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; margin: 25px 0;">
                        <a href="${websiteLink || WEBSITE_LINK}" 
                           style="background-color: #2D5783; color: white; padding: 10px 20px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Login to Your Account
                        </a>
                    </p>
                    
                    <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
                        <a href="${websiteLink || WEBSITE_LINK}" style="color: #2D5783; text-decoration: none;">Visit Website</a> | 
                        <a href="${facebookLink || FACEBOOK_LINK}" style="color: #2D5783; text-decoration: none;">Facebook Page</a>
                    </p>
                </div>
            `
        };

        // Send both emails
        await transporter.sendMail(ownerMailOptions);
        await transporter.sendMail(adminMailOptions);

        console.log('[NOTIFICATION SUCCESS] Admin creation emails sent successfully');
        res.status(200).json({ 
            success: true,
            message: 'Admin creation emails sent successfully',
            data: {
                adminEmail: email,
                dateSent: currentDate
            }
        });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending admin creation emails:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send admin creation emails',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.post('/send-delete-admin-email', async (req, res) => {
    console.log('[NOTIFICATION] Initiating admin deletion emails', req.body);
    const { email, firstName, middleName = '', lastName, websiteLink, facebookLink } = req.body;

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
        hour: '2-digit',
        minute: '2-digit'
    });

    try {
        // Email to system owner
        console.log('[NOTIFICATION] Sending admin deletion notification to owner');
        const ownerMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'Admin Account Deleted',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2D5783; border-bottom: 2px solid #2D5783; padding-bottom: 10px;">
                        Admin Account Deletion Notification
                    </h2>
                    <p>An administrator account has been permanently removed from the system.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="margin-top: 0; color: #2D5783;">Account Details</h3>
                        <p><strong>Name:</strong> ${fullName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Date Deleted:</strong> ${currentDate}</p>
                    </div>
                    
                    <p style="color: #d32f2f; font-weight: bold;">
                        Note: This action is irreversible. All access privileges have been revoked.
                    </p>
                    
                    <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
                        <a href="${websiteLink || WEBSITE_LINK}" style="color: #2D5783; text-decoration: none;">Visit Website</a> | 
                        <a href="${facebookLink || FACEBOOK_LINK}" style="color: #2D5783; text-decoration: none;">Facebook Page</a>
                    </p>
                </div>
            `
        };

        // Email to deleted admin
        console.log('[NOTIFICATION] Sending admin deletion notification to deleted admin');
        const adminMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your 5KI Financial Services Admin Access Has Been Removed',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2D5783; border-bottom: 2px solid #2D5783; padding-bottom: 10px;">
                        Account Access Update
                    </h2>
                    <p>Dear ${firstName},</p>
                    <p>We're writing to inform you that your administrator access to the 5KI Financial Services system has been permanently removed as of ${currentDate}.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="margin-top: 0; color: #2D5783;">Details</h3>
                        <p><strong>Name:</strong> ${fullName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Effective Date:</strong> ${currentDate}</p>
                    </div>
                    
                    <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0;">
                        <h3 style="margin-top: 0; color: #2D5783;">Important Information</h3>
                        <ul>
                            <li>You will no longer have access to the admin dashboard</li>
                            <li>All admin privileges have been revoked</li>
                            <li>This action is permanent and cannot be undone</li>
                        </ul>
                    </div>
                    
                    <p>If this action was taken in error or you have any questions, please contact the system administrator immediately at <a href="mailto:${process.env.GMAIL_USER}">${process.env.GMAIL_USER}</a>.</p>
                    
                    <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
                        <a href="${websiteLink || WEBSITE_LINK}" style="color: #2D5783; text-decoration: none;">Visit Website</a> | 
                        <a href="${facebookLink || FACEBOOK_LINK}" style="color: #2D5783; text-decoration: none;">Facebook Page</a>
                    </p>
                </div>
            `
        };

        // Send both emails
        await transporter.sendMail(ownerMailOptions);
        await transporter.sendMail(adminMailOptions);

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
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'New Registration Received',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">New Registration Received</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Registration Date:</strong> ${formatDisplayDate(registrationDate)}</p>
                    <p>Please review this application in the admin panel.</p>
                    <p><a href="${DASHBOARD_LINK}">View in Dashboard</a></p>
                </div>
            `
        };

        await transporter.sendMail(ownerMailOptions);

        console.log('[NOTIFICATION] Sending registration confirmation to user');
        const userMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Registration Received - 5Ki Financial Services',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Thank You for Registering!</h2>
                    <p>Dear ${firstName},</p>
                    <p>We have received your registration application on ${formatDisplayDate(registrationDate)}.</p>
                    <p>Our team will review your information and notify you once your application is processed.</p>
                    <p>For any questions, please contact us at ${GMAIL_OWNER}.</p>
                    <p>Connect with us on <a href="${FACEBOOK_LINK}">Facebook</a>.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(userMailOptions);
        console.log('[NOTIFICATION SUCCESS] Registration emails sent successfully');
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending registration emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approveRegistrations', async (req, res) => {
    console.log('[NOTIFICATION] Initiating registration approval email', req.body);
    const { email, firstName, lastName, dateApproved, approvedTime, memberId } = req.body;

    if (!email || !firstName || !lastName || !dateApproved || !approvedTime || !memberId) {
        console.log('[NOTIFICATION ERROR] Missing required fields for registration approval');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('[NOTIFICATION] Sending registration approval to user');
        const mailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Registration Approved - Welcome to 5Ki Financial Services',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Welcome to 5Ki Financial Services!</h2>
                    <p>Dear ${firstName},</p>
                    <p>We are pleased to inform you that your registration has been approved on ${dateApproved} at ${approvedTime}.</p>
                    <p><strong>Your Member ID:</strong> ${memberId}</p>
                    <p>You now have full access to our services. Please log in to your account to get started.</p>
                    <p>Connect with us on <a href="${FACEBOOK_LINK}">Facebook</a>.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
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
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Registration Application Status',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Registration Application Update</h2>
                    <p>Dear ${firstName},</p>
                    <p>After careful review, we regret to inform you that your registration application submitted on ${dateRejected} at ${rejectedTime} has not been approved.</p>
                    ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                    <p>You may reapply after addressing any issues. For questions, contact us at ${GMAIL_OWNER}.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('[NOTIFICATION SUCCESS] Registration rejection email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending registration rejection email:', error);
        res.status(500).json({ message: 'Failed to send email', error: error.message });
    }
});

// ==============================================
// TRANSACTION EMAILS
// ==============================================

app.post('/deposit', async (req, res) => {
    console.log('[NOTIFICATION] Initiating deposit notification emails', req.body);
    const { email, firstName, lastName, amount, referenceNumber, method, date } = req.body;
    const fullName = `${firstName} ${lastName}`;

    if (!email || !firstName || !lastName || !amount || !referenceNumber || !method) {
        console.log('[NOTIFICATION ERROR] Missing required fields for deposit notification');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('[NOTIFICATION] Sending deposit notification to owner');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'Deposit Application Submitted',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Deposit Application Submitted</h2>
                    <p>Hi Admin,</p>
                    <p>A deposit application has been submitted with the following details:</p>
                    <p><strong>Member:</strong> ${fullName}</p>
                    <p><strong>Amount:</strong> ₱${amount}</p>
                    <p><strong>Date Submitted:</strong> ${formatDisplayDate(date)}</p>
                    <p><strong>Reference No.:</strong> ${referenceNumber}</p>
                    <p>Kindly review and process this request via the admin dashboard.</p>
                    <p><a href="${DASHBOARD_LINK}">Go to Dashboard</a></p>
                </div>
            `
        });

        console.log('[NOTIFICATION] Sending deposit confirmation to user');
        const mailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Deposit Successful',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Deposit Successful</h2>
                    <p>Hi ${firstName},</p>
                    <p>We have successfully received your deposit amounting <strong>₱${amount}</strong> under reference number <strong>${referenceNumber}</strong> and was completed using <strong>${method}</strong>.</p>
                    <p>Please log in to your account to view your updated balance.</p>
                    <p>Thank you for keeping your 5Ki Financial Services account active.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('[NOTIFICATION SUCCESS] Deposit notification emails sent successfully');
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending deposit notification emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/withdraw', async (req, res) => {
    console.log('[NOTIFICATION] Initiating withdrawal notification emails', req.body);
    const { email, firstName, lastName, amount, date, recipientAccount, referenceNumber } = req.body;
    const fullName = `${firstName} ${lastName}`;

    if (!email || !firstName || !lastName || !amount || !date || !recipientAccount || !referenceNumber) {
        console.log('[NOTIFICATION ERROR] Missing required fields for withdrawal notification');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('[NOTIFICATION] Sending withdrawal notification to owner');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'Withdrawal Request Received',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Withdrawal Request Received</h2>
                    <p>Dear Admin,</p>
                    <p>A member has requested a withdrawal:</p>
                    <p><strong>Member:</strong> ${fullName}</p>
                    <p><strong>Amount:</strong> ₱${amount}</p>
                    <p><strong>Date:</strong> ${formatDisplayDate(date)}</p>
                    <p><strong>Recipient Account:</strong> ${recipientAccount}</p>
                    <p><strong>Reference No.:</strong> ${referenceNumber}</p>
                    <p>Please verify and take appropriate action in the dashboard.</p>
                    <p><a href="${DASHBOARD_LINK}">Go to Dashboard</a></p>
                </div>
            `
        });

        console.log('[NOTIFICATION] Sending withdrawal confirmation to user');
        const mailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Withdrawal Successful',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Withdrawal Successful</h2>
                    <p>Hi ${firstName},</p>
                    <p>Your withdrawal request for <strong>₱${amount}</strong> has been processed on <strong>${formatDisplayDate(date)}</strong>.</p>
                    <p>The funds were sent to your recipient account (${recipientAccount}). Thank you for using 5Ki Financial Services.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('[NOTIFICATION SUCCESS] Withdrawal notification emails sent successfully');
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending withdrawal notification emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
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
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'New Loan Application Received',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">New Loan Application</h2>
                    <p><strong>Applicant:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Amount:</strong> ₱${amount}</p>
                    <p><strong>Term:</strong> ${term} months</p>
                    <p><strong>Application Date:</strong> ${formatDisplayDate(date)}</p>
                    <p><a href="${DASHBOARD_LINK}">Review Application</a></p>
                </div>
            `
        });

        console.log('[NOTIFICATION] Sending loan application confirmation to user');
        const userMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Loan Application Received',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Loan Application Received</h2>
                    <p>Hi ${firstName},</p>
                    <p>We have received your loan application on ${formatDisplayDate(date)}. Our team is currently reviewing your application and will process it within 3-5 business days.</p>
                    <p>You'll be notified once your application has been successfully processed.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="margin-top: 0;">Loan Details</h3>
                        <p><strong>Amount:</strong> ₱${amount}</p>
                        <p><strong>Term:</strong> ${term} months</p>
                        <p><strong>Status:</strong> Under Review</p>
                    </div>
                    
                    <p>Thank you for choosing 5Ki Financial Services.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(userMailOptions);
        console.log('[NOTIFICATION SUCCESS] Loan application emails sent successfully');
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending loan application emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approveLoans', async (req, res) => {
    console.log('[NOTIFICATION] Initiating loan approval email', req.body);
    const { email, firstName, lastName, amount, term, date } = req.body;

    if (!email || !firstName || !lastName || !amount || !term || !date) {
        console.log('[NOTIFICATION ERROR] Missing required fields for loan approval');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('[NOTIFICATION] Sending loan approval to user');
        const mailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Congratulations! Your Loan is Approved',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Congratulations! Your Loan is Approved</h2>
                    <p>Hi ${firstName},</p>
                    <p>We're pleased to inform you that your loan application has been approved on ${formatDisplayDate(date)}.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="margin-top: 0;">Loan Details</h3>
                        <p><strong>Approved Amount:</strong> ₱${amount}</p>
                        <p><strong>Repayment Term:</strong> ${term} months</p>
                    </div>
                    
                    <p>Please log in to your account to view the full details and next steps.</p>
                    <p>Congratulations and thank you for trusting 5Ki Financial Services.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('[NOTIFICATION SUCCESS] Loan approval email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending loan approval email:', error);
        res.status(500).json({ message: 'Failed to send email', error: error.message });
    }
});

app.post('/rejectLoans', async (req, res) => {
    console.log('[NOTIFICATION] Initiating loan rejection email', req.body);
    const { email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
        console.log('[NOTIFICATION ERROR] Missing required fields for loan rejection');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('[NOTIFICATION] Sending loan rejection to user');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Loan Rejected',
            text: `Hi Mr./Mrs. ${lastName},\n\nYour loan has been rejected.\n\nConnect with us: ${FACEBOOK_LINK}\n\nBest regards,\n5KI Financial Services`
        });

        console.log('[NOTIFICATION SUCCESS] Loan rejection email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending loan rejection email:', error);
        res.status(500).json({ message: 'Failed to send email', error: error.message });
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
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'Loan Payment Received',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Loan Payment Received</h2>
                    <p>Dear Admin,</p>
                    <p>A loan payment has been recorded:</p>
                    <p><strong>Member:</strong> ${fullName}</p>
                    <p><strong>Amount Paid:</strong> ₱${amount}</p>
                    <p><strong>Date:</strong> ${formatDisplayDate(date)}</p>
                    <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                    <p>The system has updated the loan balance accordingly.</p>
                    <p><a href="${DASHBOARD_LINK}">View in Dashboard</a></p>
                </div>
            `
        });

        console.log('[NOTIFICATION] Sending payment confirmation to user');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Payment Confirmed',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Payment Confirmed</h2>
                    <p>Hi ${firstName},</p>
                    <p>We have received your payment of <strong>₱${amount}</strong> on ${formatDisplayDate(date)} via ${paymentMethod}.</p>
                    <p>Your transaction has been processed successfully. Thank you for your payment.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        });

        console.log('[NOTIFICATION SUCCESS] Payment confirmation emails sent successfully');
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending payment confirmation emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

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
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'Membership Withdrawal Request',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Membership Withdrawal Request</h2>
                    <p>Dear Admin,</p>
                    <p>A new permanent membership withdrawal request has been received:</p>
                    <p><strong>Member:</strong> ${fullName}</p>
                    <p><strong>Date Requested:</strong> ${formatDisplayDate(date)}</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                    <p>Kindly update the records and confirm in the system.</p>
                    <p><a href="${DASHBOARD_LINK}">View in Dashboard</a></p>
                </div>
            `
        });

        console.log('[NOTIFICATION] Sending membership withdrawal confirmation to user');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Membership Withdrawal Request Received',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2D5783;">Membership Withdrawal Request Received</h2>
                    <p>Hi ${firstName},</p>
                    <p>We have received your membership withdrawal request on ${formatDisplayDate(date)}.</p>
                    ${reason ? `<p><strong>Your reason:</strong> ${reason}</p>` : ''}
                    <p>Our team will process your request and notify you once completed.</p>
                    <p>Best regards,<br>5KI Financial Services Team</p>
                </div>
            `
        });

        console.log('[NOTIFICATION SUCCESS] Membership withdrawal emails sent successfully');
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('[NOTIFICATION ERROR] Error sending membership withdrawal emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

// ==============================================
// SERVER INITIALIZATION
// ==============================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});