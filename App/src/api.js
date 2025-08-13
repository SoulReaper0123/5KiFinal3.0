import axios from 'axios';

const API_URL = 'http://10.0.0.34:3000';
const WEBSITE_URL = 'fiveki.onrender.com';
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