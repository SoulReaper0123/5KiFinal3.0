import React from 'react';
import { FaExclamationCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

// Exact same styles as your registration modals
const baseStyles = {
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
    padding: '2rem',
    backdropFilter: 'blur(4px)'
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
    minWidth: '80px'
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
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  }
};

export function ConfirmModal({
  visible,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  actionInProgress = false
}) {
  if (!visible) return null;
  
  return (
    <div style={baseStyles.modalOverlay}>
      <div style={baseStyles.modalCardSmall}>
        <FaExclamationCircle style={{ ...baseStyles.confirmIcon, color: '#1e3a8a' }} />
        <p style={baseStyles.modalText}>{message}</p>
        <div style={baseStyles.buttonGroup}>
          <button 
            style={{
              ...baseStyles.actionButton,
              ...baseStyles.primaryButton
            }} 
            onClick={onConfirm}
            disabled={actionInProgress}
          >
            {actionInProgress ? 'Processing...' : confirmLabel}
          </button>
          <button 
            style={{
              ...baseStyles.actionButton,
              ...baseStyles.secondaryButton
            }} 
            onClick={onCancel}
            disabled={actionInProgress}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuccessModal({
  visible,
  message,
  onClose,
  okLabel = 'OK',
  type = 'approve' // 'approve' or 'reject'
}) {
  if (!visible) return null;
  
  return (
    <div style={baseStyles.modalOverlay}>
      <div style={baseStyles.modalCardSmall}>
        {type === 'approve' ? (
          <FaCheckCircle style={{ ...baseStyles.confirmIcon, color: '#10b981' }} />
        ) : (
          <FaTimes style={{ ...baseStyles.confirmIcon, color: '#ef4444' }} />
        )}
        <p style={baseStyles.modalText}>{message}</p>
        <button 
          style={{
            ...baseStyles.actionButton,
            ...baseStyles.primaryButton
          }} 
          onClick={onClose}
        >
          {okLabel}
        </button>
      </div>
    </div>
  );
}

export function ErrorModal({
  visible,
  message,
  onClose,
  okLabel = 'OK'
}) {
  if (!visible) return null;
  
  return (
    <div style={baseStyles.modalOverlay}>
      <div style={baseStyles.modalCardSmall}>
        <FaExclamationCircle style={{ ...baseStyles.confirmIcon, color: '#ef4444' }} />
        <p style={baseStyles.modalText}>{message}</p>
        <button 
          style={{
            ...baseStyles.actionButton,
            ...baseStyles.primaryButton
          }} 
          onClick={onClose}
        >
          {okLabel}
        </button>
      </div>
    </div>
  );
}