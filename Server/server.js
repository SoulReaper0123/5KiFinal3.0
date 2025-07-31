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
            text: `
New Admin Account Created

A new admin account has been successfully created in the system.

Admin Details:
- Name: ${fullName}
- Email: ${email}
- Date Created: ${currentDate}

This is an automated notification. No action is required unless this was unauthorized.

Links:
- Website: ${websiteLink || WEBSITE_LINK}
- Facebook: ${facebookLink || FACEBOOK_LINK}
            `
        };

        // Email to new admin
        console.log('[NOTIFICATION] Sending admin credentials to new admin');
        const adminMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your 5KI Financial Services Admin Account',
            text: `
Welcome to 5KI Financial Services

Dear ${firstName},

Your administrator account has been successfully created. Below are your login credentials:

Account Information:
- Email: ${email}
- Temporary Password: ${password}
- Account Type: Administrator

Important Security Notice:
- Change your password immediately after first login
- Never share your credentials with anyone
- Always log out after your session

Login to your account here: ${websiteLink || WEBSITE_LINK}

For any questions, please contact the system administrator.

Links:
- Website: ${websiteLink || WEBSITE_LINK}
- Facebook: ${facebookLink || FACEBOOK_LINK}
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
            text: `
Admin Account Deletion Notification

An administrator account has been permanently removed from the system.

Account Details:
- Name: ${fullName}
- Email: ${email}
- Date Deleted: ${currentDate}

Note: This action is irreversible. All access privileges have been revoked.

Links:
- Website: ${websiteLink || WEBSITE_LINK}
- Facebook: ${facebookLink || FACEBOOK_LINK}
            `
        };

        // Email to deleted admin
        console.log('[NOTIFICATION] Sending admin deletion notification to deleted admin');
        const adminMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your 5KI Financial Services Admin Access Has Been Removed',
            text: `
Account Access Update

Dear ${firstName},

We're writing to inform you that your administrator access to the 5KI Financial Services system has been permanently removed as of ${currentDate}.

Details:
- Name: ${fullName}
- Email: ${email}
- Effective Date: ${currentDate}

Important Information:
- You will no longer have access to the admin dashboard
- All admin privileges have been revoked
- This action is permanent and cannot be undone

If this action was taken in error or you have any questions, please contact the system administrator immediately at ${process.env.GMAIL_USER}.

Links:
- Website: ${websiteLink || WEBSITE_LINK}
- Facebook: ${facebookLink || FACEBOOK_LINK}
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
            text: `
New Registration Received

Name: ${firstName} ${lastName}
Email: ${email}
Registration Date: ${formatDisplayDate(registrationDate)}

Please review this application in the admin panel: ${DASHBOARD_LINK}
            `
        };

        await transporter.sendMail(ownerMailOptions);

        console.log('[NOTIFICATION] Sending registration confirmation to user');
        const userMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Registration Received - 5Ki Financial Services',
            text: `
Thank You for Registering!

Dear ${firstName},

We have received your registration application on ${formatDisplayDate(registrationDate)}.

Our team will review your information and notify you once your application is processed.

For any questions, please contact us at ${GMAIL_OWNER}.

Connect with us on Facebook: ${FACEBOOK_LINK}

Best regards,
5KI Financial Services Team
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
            text: `
Welcome to 5Ki Financial Services!

Dear ${firstName},

We are pleased to inform you that your registration has been approved on ${dateApproved} at ${approvedTime}.

Your Member ID: ${memberId}

You now have full access to our services. Please log in to your account to get started.

Connect with us on Facebook: ${FACEBOOK_LINK}

Best regards,
5KI Financial Services Team
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
            text: `
Registration Application Update

Dear ${firstName},

After careful review, we regret to inform you that your registration application submitted on ${dateRejected} at ${rejectedTime} has not been approved.

${rejectionReason ? `Reason: ${rejectionReason}\n` : ''}
You may reapply after addressing any issues. For questions, contact us at ${GMAIL_OWNER}.

Best regards,
5KI Financial Services Team
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
            text: `
Deposit Application Submitted

Hi Admin,

A deposit application has been submitted with the following details:

Member: ${fullName}
Amount: ₱${amount}
Date Submitted: ${formatDisplayDate(date)}
Reference No.: ${referenceNumber}

Kindly review and process this request via the admin dashboard: ${DASHBOARD_LINK}
            `
        });

        console.log('[NOTIFICATION] Sending deposit confirmation to user');
        const mailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Deposit Successful',
            text: `
Deposit Successful

Hi ${firstName},

We have successfully received your deposit amounting ₱${amount} under reference number ${referenceNumber} and was completed using ${method}.

Please log in to your account to view your updated balance.

Thank you for keeping your 5Ki Financial Services account active.

Best regards,
5KI Financial Services Team
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
            text: `
Withdrawal Request Received

Dear Admin,

A member has requested a withdrawal:

Member: ${fullName}
Amount: ₱${amount}
Date: ${formatDisplayDate(date)}
Recipient Account: ${recipientAccount}
Reference No.: ${referenceNumber}

Please verify and take appropriate action in the dashboard: ${DASHBOARD_LINK}
            `
        });

        console.log('[NOTIFICATION] Sending withdrawal confirmation to user');
        const mailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Withdrawal Successful',
            text: `
Withdrawal Successful

Hi ${firstName},

Your withdrawal request for ₱${amount} has been processed on ${formatDisplayDate(date)}.

The funds were sent to your recipient account (${recipientAccount}). Thank you for using 5Ki Financial Services.

Best regards,
5KI Financial Services Team
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
            text: `
New Loan Application

Applicant: ${fullName}
Email: ${email}
Amount: ₱${amount}
Term: ${term} months
Application Date: ${formatDisplayDate(date)}

Review Application: ${DASHBOARD_LINK}
            `
        });

        console.log('[NOTIFICATION] Sending loan application confirmation to user');
        const userMailOptions = {
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Loan Application Received',
            text: `
Loan Application Received

Hi ${firstName},

We have received your loan application on ${formatDisplayDate(date)}. Our team is currently reviewing your application and will process it within 3-5 business days.

You'll be notified once your application has been successfully processed.

Loan Details:
- Amount: ₱${amount}
- Term: ${term} months
- Status: Under Review

Thank you for choosing 5Ki Financial Services.

Best regards,
5KI Financial Services Team
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
            text: `
Congratulations! Your Loan is Approved

Hi ${firstName},

We're pleased to inform you that your loan application has been approved on ${formatDisplayDate(date)}.

Loan Details:
- Approved Amount: ₱${amount}
- Repayment Term: ${term} months

Please log in to your account to view the full details and next steps.

Congratulations and thank you for trusting 5Ki Financial Services.

Best regards,
5KI Financial Services Team
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
            text: `
Loan Rejected

Hi Mr./Mrs. ${lastName},

Your loan has been rejected.

Connect with us: ${FACEBOOK_LINK}

Best regards,
5KI Financial Services
            `
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
            text: `
Loan Payment Received

Dear Admin,

A loan payment has been recorded:

Member: ${fullName}
Amount Paid: ₱${amount}
Date: ${formatDisplayDate(date)}
Payment Method: ${paymentMethod}

The system has updated the loan balance accordingly.

View in Dashboard: ${DASHBOARD_LINK}
            `
        });

        console.log('[NOTIFICATION] Sending payment confirmation to user');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Payment Confirmed',
            text: `
Payment Confirmed

Hi ${firstName},

We have received your payment of ₱${amount} on ${formatDisplayDate(date)} via ${paymentMethod}.

Your transaction has been processed successfully. Thank you for your payment.

Best regards,
5KI Financial Services Team
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
            text: `
Membership Withdrawal Request

Dear Admin,

A new permanent membership withdrawal request has been received:

Member: ${fullName}
Date Requested: ${formatDisplayDate(date)}
${reason ? `Reason: ${reason}\n` : ''}
Kindly update the records and confirm in the system.

View in Dashboard: ${DASHBOARD_LINK}
            `
        });

        console.log('[NOTIFICATION] Sending membership withdrawal confirmation to user');
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Membership Withdrawal Request Received',
            text: `
Membership Withdrawal Request Received

Hi ${firstName},

We have received your membership withdrawal request on ${formatDisplayDate(date)}.

${reason ? `Your reason: ${reason}\n` : ''}
Our team will process your request and notify you once completed.

Best regards,
5KI Financial Services Team
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