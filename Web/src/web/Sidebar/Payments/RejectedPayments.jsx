import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ApprovedPayments = ({ approvedPayments }) => {
  const navigate = useNavigate();

  if (!approvedPayments || approvedPayments.length === 0) {
    return (
      <div className="no-payments-container">
        <p>No approved payments found</p>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <h2 className="section-title">Approved Payments</h2>
      
      <div className="payments-list">
        {approvedPayments.map((payment) => (
          <div key={payment.id} className="payment-card approved">
            <div className="payment-header">
              <FaCheckCircle className="status-icon" />
              <span className="payment-id">Payment ID: {payment.id}</span>
            </div>
            
            <div className="payment-details">
              <p><strong>Member:</strong> {payment.memberName}</p>
              <p><strong>Amount:</strong> ${payment.amount.toFixed(2)}</p>
              <p><strong>Date Approved:</strong> {payment.approvalDate}</p>
              <p><strong>Approved By:</strong> {payment.approvedBy}</p>
            </div>

            <button 
              className="view-details-btn"
              onClick={() => navigate(`/payments/approved/${payment.id}`)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const RejectedPayments = ({ rejectedPayments }) => {
  const navigate = useNavigate();

  if (!rejectedPayments || rejectedPayments.length === 0) {
    return (
      <div className="no-payments-container">
        <p>No rejected payments found</p>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <h2 className="section-title">Rejected Payments</h2>
      
      <div className="payments-list">
        {rejectedPayments.map((payment) => (
          <div key={payment.id} className="payment-card rejected">
            <div className="payment-header">
              <FaTimesCircle className="status-icon" />
              <span className="payment-id">Payment ID: {payment.id}</span>
            </div>
            
            <div className="payment-details">
              <p><strong>Member:</strong> {payment.memberName}</p>
              <p><strong>Amount:</strong> ${payment.amount.toFixed(2)}</p>
              <p><strong>Date Rejected:</strong> {payment.rejectionDate}</p>
              <p><strong>Rejected By:</strong> {payment.rejectedBy}</p>
              <p><strong>Reason:</strong> {payment.rejectionReason || 'Not specified'}</p>
            </div>

            <button 
              className="view-details-btn"
              onClick={() => navigate(`/payments/rejected/${payment.id}`)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export both components
export { ApprovedPayments, RejectedPayments };
export default ApprovedPayments; // Default export for backward compatibility


// CSS Styles
const styles = `
  .payments-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-title {
    color: #2d5783;
    margin-bottom: 20px;
    font-size: 24px;
  }

  .payments-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .payment-card {
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 4px solid;
  }

  .payment-card.approved {
    border-left-color: #4CAF50;
  }

  .payment-card.rejected {
    border-left-color: #f44336;
  }

  .payment-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .status-icon {
    margin-right: 10px;
    font-size: 20px;
  }

  .approved .status-icon {
    color: #4CAF50;
  }

  .rejected .status-icon {
    color: #f44336;
  }

  .payment-id {
    font-weight: bold;
    color: #333;
  }

  .payment-details {
    margin-bottom: 15px;
  }

  .payment-details p {
    margin: 5px 0;
    color: #555;
  }

  .view-details-btn {
    background-color: #2d5783;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    width: 100%;
  }

  .view-details-btn:hover {
    background-color: #1e3d6b;
  }

  .no-payments-container {
    text-align: center;
    padding: 40px;
    color: #666;
  }
`;

// Add styles to the document head
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);