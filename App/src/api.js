import axios from 'axios';

const API_URL = 'http://192.168.254.115:3000';

/*
export const sendVerificationCode = async (email, code) => {
  try {
    const response = await axios.post(`${API_URL}/send-code`, { email, code });
    return response.data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};
*/

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const ApproveRegistration = async (approveRegistrationApplication) => {
    try {
        const response = await axios.post(`${API_URL}/approveRegistrations`, approveRegistrationApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const RejectRegistration = async (rejectRegistrationApplication) => {
    try {
        const response = await axios.post(`${API_URL}/rejectRegistrations`, rejectRegistrationApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const MemberLoan = async (loanApplication) => {
    try {
        const response = await axios.post(`${API_URL}/applyLoan`, loanApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const MemberDeposit = async (depositApplication) => {
    try {
        const response = await axios.post(`${API_URL}/deposit`, depositApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const MemberPayment = async (paymentApplication) => {
    try {
        const response = await axios.post(`${API_URL}/payment`, paymentApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const MemberWithdraw = async (withdrawApplication) => {
    try {
        const response = await axios.post(`${API_URL}/withdraw`, withdrawApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const ApproveDeposits = async (approveDepositsApplication) => {
    try {
        const response = await axios.post(`${API_URL}/approveDeposits`, approveDepositsApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const RejectDeposits = async (rejectDepositsApplication) => {
    try {
        const response = await axios.post(`${API_URL}/rejectDeposits`, rejectDepositsApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const ApproveLoans = async (approveLoanApplication) => {
    try {
        const response = await axios.post(`${API_URL}/approveLoans`, approveLoanApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const RejectLoans = async (rejectLoanApplication) => {
    try {
        const response = await axios.post(`${API_URL}/rejectLoans`, rejectLoanApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const ApprovePayments = async (approvePaymentApplication) => {
    try {
        const response = await axios.post(`${API_URL}/approvePayments`, approvePaymentApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const RejectPayments = async (rejectPaymentApplication) => {
    try {
        const response = await axios.post(`${API_URL}/rejectPayments`, rejectPaymentApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const ApproveWithdraws = async (approveWithdrawApplication) => {
    try {
        const response = await axios.post(`${API_URL}/approveWithdraws`, approveWithdrawApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const RejectWithdraws = async (rejectWithdrawApplication) => {
    try {
        const response = await axios.post(`${API_URL}/rejectWithdraws`, rejectWithdrawApplication);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};