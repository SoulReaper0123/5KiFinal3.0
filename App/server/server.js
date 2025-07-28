const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config(); // Load environment variables
const cors = require('cors');

console.log('GMAIL_USER:', process.env.GMAIL_USER);

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for PORT if available

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (like HTML, CSS, JS)

// Setup the transporter using Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.GMAIL_USER, // Your email from .env
        pass: process.env.GMAIL_PASS,  // Your app password from .env
    },
});

// Serve the HTML registration page when accessing the root URL
// app.get('/', (req, res) => {
//    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Ensure your HTML file is in a 'public' folder
// });

app.get('/', (req, res) => {
    res.send('API is running ✅');
});

// Endpoint to handle registration and sending emails
app.post('/register', async (req, res) => {
    const { email, firstName, lastName} = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email, first name, last name' });
    }

    console.log('Fetched Registration Data:');
    console.log(`Email: ${email}`);
    console.log(`First Name: ${firstName}`);
    console.log(`Last Name: ${lastName}`);

    try {
        // Email to the owner
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'New Application Submitted',
            text: `A new application has been received. Please review the application at your earliest convenience.` 
        });
        console.log(`Email sent to owner: ${process.env.GMAIL_USER}`);

        console.log(`Sending confirmation register to user: ${email}`);

        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Registration Has Been Confirmed',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your registration is complete and successful.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation register sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/applyLoan', async (req, res) => {
    const { email, firstName, lastName, dateApplied } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Received Loan Application Data:', req.body);

    try {
        // Email to the owner
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: 'New Loan Application Received',
            text: `A new loan application has been submitted. Please review it soon.`
        });
        console.log(`Email sent to owner: ${process.env.GMAIL_USER}`);

        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Confirmation: Your loan application has been received.',
            text: `Hi Mr./Mrs. ${lastName},\n\nThank you for your loan application.\nOur team will review it and keep you updated on the status.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation loan application sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/deposit', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Received Deposit Application Data:', req.body);

    try {
        // Email to the owner
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: 'New Member Deposit Received',
            text: `A new deposit has been received. Please update the records accordingly.`
        });
        console.log(`Email sent to owner: ${process.env.GMAIL_USER}`);

        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Deposit Application Has Been Confirmed',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your deposit application has been successfully processed.\n\nThank you for choosing 5KI Financial Services. If you have any questions, feel free to reach out.\n\nBest regards,\n5KI Financial Services.`
        });
        console.log(`Confirmation deposit sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/payment', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Received Payment Application Data:', req.body);

    try {
        // Email to the owner
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: 'New Payment Received from Members',
            text: `A new payment has been received from members. Please update the records accordingly.` // Handle case if message is not provided
        });
        console.log(`Email sent to owner: ${process.env.GMAIL_USER}`);

        // Confirmation email to the user
        console.log(`Sending confirmation payment to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Payment Has been Confirmed',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your payment application has been successfully processed.\n\nThank you for choosing 5KI Financial Services. If you have any questions, please feel free to contact us.\n\nBest regards,\n5KI Financial Services.`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/withdraw', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Received Withdraw Application Data:', req.body);

    try {
        // Email to the owner
        await transporter.sendMail({
            from: email,
            to: process.env.GMAIL_USER,
            subject: 'Withdrawal Request from Members',
            text: `Hi,\n\nA new withdrawal request has been received from a member. Please process the withdrawal at your earliest convenience.`
        });
        console.log(`Email sent to owner: ${process.env.GMAIL_USER}`);

        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Confirmation: Your withdraw application was successful',
            text: `Thank you, Mr./Mrs. ${lastName}! Your withdraw application was successful.`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approveDeposits', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Received Deposit Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Deposit Application Has Been Approved',
            text: ` Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your deposit application has been approved.\n\nThank you for choosing 5KI Financial Services. If you have any questions or need further assistance, please feel free to contact us.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/rejectDeposits', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Reject Deposit Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Deposit Request Was Not Approved',
            text: `Hi Mr./Mrs. ${lastName},\n\nYour attempt to deposit an amount below 5,000 Pesos has been unsuccessful.\nPlease ensure that your deposit meets the minimum requirement of 5,000 Pesos for approval.\n\nBest regards,\n5KI Financial Services.`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approveLoans', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Approve Loan Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Loan Application Has Been Approved',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your loan application has been approved.\nThank you for choosing 5KI Financial Services. If you have any questions or need further assistance, please don't hesitate to reach out.\n\nBest regards,\n5KI Financial Services.`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/rejectLoans', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Reject Loan Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Loan Application Has Been Denied',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe regret to inform you that your loan application has been rejected.\nIf you would like to discuss the reasons for the rejection or explore alternative options, please feel free to contact us. Thank you for your understanding.\n\nBest regards,\n5KI Financial Services.`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approvePayments', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Approve Payments Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Payment Application Has Been Approved',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your payment application has been approved. Thank you for choosing 5KI Financial Services.\nIf you have any questions or need further assistance, please don’t hesitate to reach out.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/rejectPayments', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Reject Loan Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Payment Application Has Been Denied',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe regret to inform you that your payment application has been rejected.\nIf you would like to discuss the reasons for the rejection or explore alternative options, please feel free to contact us. Thank you for your understanding.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approveWithdraws', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Withdraw Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Withdrawal Request Has Been Approved',
            text: `Hi Mr./Mrs ${lastName},\n\nWe are pleased to inform you that your withdrawal application has been successfully processed.\nThank you for choosing 5KI Financial Services. If you have any questions, please feel free to reach out.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/rejectWithdraws', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Reject Withdraw Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Withdrawal Application Has Been Denied',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe regret to inform you that your withdrawal application has been rejected.\nIf you would like to discuss the reasons for the rejection or explore alternative options, please feel free to contact us. Thank you for your understanding.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/approveRegistrations', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Approve Registrations Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Registration Has Been Approved',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe are pleased to inform you that your registration has been approved successfully.\nThank you for joining 5KI Financial Services.\nIf you have any questions or need further assistance, feel free to contact us.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});

app.post('/rejectRegistrations', async (req, res) => {
    const { email, lastName } = req.body; // Fetch user data from request body

    // Validate user input
    if (!email) {
        return res.status(400).json({ message: 'Missing required fields: email and id' });
    }

    console.log('Reject Registrations Application Data:', req.body);

    try {
        // Confirmation email to the user
        console.log(`Sending confirmation email to user: ${email}`);
        await transporter.sendMail({
            from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: 'Your Registration Has Been Denied',
            text: `Hi Mr./Mrs. ${lastName},\n\nWe regret to inform you that your registration application has been rejected.\nIf you would like to understand the reasons for the rejection or explore other options, please feel free to contact us.\nThank you for your understanding.\n\nBest regards,\n5KI Financial Services`
        });
        console.log(`Confirmation email sent to user: ${email}`);

        // Send success response
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ message: 'Failed to send emails', error: error.message });
    }
});
/*
app.post('/sendCode', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes in ms

  try {
    // Rate limit: check if a code was sent recently
    const snapshot = await db.ref(`verificationCodes/${email.replace(/\./g, '_')}`).get();
    const data = snapshot.val();
    if (data && now - data.sentAt < 60 * 1000) {
      return res.status(429).json({ message: 'Too many requests. Please wait 1 minute before trying again.' });
    }

    // Save code to Firebase
    await db.ref(`verificationCodes/${email.replace(/\./g, '_')}`).set({
      code,
      sentAt: now,
      expiresAt,
      attempts: 0,
    });

    // Send the email
    await transporter.sendMail({
      from: `"5KI Financial Services" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your 6-digit verification code',
      text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: 'Verification code sent successfully.' });
  } catch (err) {
    console.error('Error sending code:', err);
    res.status(500).json({ message: 'Failed to send verification code.', error: err.message });
  }
});
*/


// Start the server and display message when it's running
app.listen(PORT, () => {
    console.log(`Server has started successfully at http://localhost:${PORT}`);
});
