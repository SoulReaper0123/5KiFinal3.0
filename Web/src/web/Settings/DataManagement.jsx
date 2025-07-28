import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';

const DataManagement = () => {
  const [activeSection, setActiveSection] = useState('archiving');
  const [autoArchive, setAutoArchive] = useState(false);
  const [archiveAfter, setArchiveAfter] = useState('');
  const [archivedData] = useState([
    { id: 1, type: 'Loans', date: 'March 10, 2024', status: 'Archived' },
    { id: 2, type: 'Withdrawals', date: 'May 25, 2024', status: 'Archived' },
    { id: 3, type: 'Deposits', date: 'August 30, 2024', status: 'Archived' },
  ]);

  return (
    <div className="data-management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <button
          className={`sidebar-button ${activeSection === 'archiving' ? 'active' : ''}`}
          onClick={() => setActiveSection('archiving')}
        >
          <span className="sidebar-button-text">Data Archiving</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveSection('archived')}
        >
          <span className="sidebar-button-text">Archived Data</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="content-area">
        {activeSection === 'archiving' && (
          <div className="section">
            <h2 className="section-title">Data Archiving</h2>

            <div className="form-row">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={autoArchive} 
                  onChange={(e) => setAutoArchive(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
              <span className="label">Enable Automatic Archiving</span>
            </div>

            <div className="form-row">
              <span className="label">Archive After</span>
              <input
                type="text"
                placeholder="Months/Years"
                className="input"
                value={archiveAfter}
                onChange={(e) => setArchiveAfter(e.target.value)}
              />
            </div>

            <button className="save-button">
              <span className="save-button-text">Save</span>
            </button>
          </div>
        )}

        {activeSection === 'archived' && (
          <div className="section">
            <h2 className="section-title">Archived Data</h2>

            <div className="search-row">
              <input 
                type="text" 
                placeholder="Search" 
                className="search-input" 
              />
              <button className="export-button">
                <FaDownload className="export-icon" />
              </button>
            </div>

            <div className="table-header">
              <span className="table-header-text">Data type</span>
              <span className="table-header-text">Date Archived</span>
              <span className="table-header-text">Status</span>
              <span className="table-header-text">Actions</span>
            </div>

            {archivedData.map(item => (
              <div key={item.id} className="table-row">
                <span className="table-cell">{item.type}</span>
                <span className="table-cell">{item.date}</span>
                <span className="table-cell archived-status">{item.status}</span>
                <div className="actions">
                  <button className="restore-button">
                    <span className="action-text">Restore</span>
                  </button>
                  <button className="delete-button">
                    <span className="action-text">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// CSS Styles
const styles = `
  .data-management-container {
    display: flex;
    min-height: 100vh;
    background-color: #eef1f5;
  }

  .sidebar {
    width: 150px;
    background-color: #dfe4ea;
    padding-top: 20px;
  }

  .sidebar-button {
    display: block;
    width: 100%;
    padding: 12px 10px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .sidebar-button.active {
    background-color: #2ecc71;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .sidebar-button-text {
    font-size: 13px;
    color: #333;
  }

  .sidebar-button.active .sidebar-button-text {
    color: #fff;
    font-weight: bold;
  }

  .content-area {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .section {
    background-color: #fff;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
  }

  .form-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  /* Custom switch styling */
  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
  }

  input:checked + .slider {
    background-color: #2ecc71;
  }

  input:checked + .slider:before {
    transform: translateX(26px);
  }

  .slider.round {
    border-radius: 24px;
  }

  .slider.round:before {
    border-radius: 50%;
  }

  .label {
    font-size: 13px;
    margin-left: 10px;
  }

  .input {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 8px 10px;
    width: 120px;
    font-size: 13px;
    margin-left: 10px;
  }

  .save-button {
    background-color: green;
    padding: 8px 0;
    border-radius: 5px;
    border: none;
    width: 100%;
    cursor: pointer;
  }

  .save-button-text {
    color: #fff;
    font-weight: 600;
  }

  .search-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .search-input {
    flex: 1;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .export-button {
    margin-left: 10px;
    background-color: #ddd;
    padding: 8px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .export-icon {
    font-size: 16px;
  }

  .table-header {
    display: flex;
    margin-bottom: 8px;
    font-weight: bold;
  }

  .table-header-text {
    font-size: 12px;
    width: 25%;
  }

  .table-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .table-cell {
    font-size: 12px;
    width: 25%;
  }

  .archived-status {
    color: orange;
    font-weight: bold;
  }

  .actions {
    display: flex;
  }

  .restore-button {
    background-color: #00C851;
    padding: 4px 6px;
    border-radius: 4px;
    margin-right: 5px;
    border: none;
    cursor: pointer;
  }

  .delete-button {
    background-color: #ff4444;
    padding: 4px 6px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }

  .action-text {
    color: #fff;
    font-size: 10px;
  }

  @media (max-width: 768px) {
    .data-management-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      display: flex;
      padding-top: 0;
    }

    .sidebar-button {
      text-align: center;
      padding: 10px;
    }

    .sidebar-button.active {
      border-radius: 0;
    }

    .content-area {
      padding: 15px;
    }

    .form-row {
      flex-wrap: wrap;
    }

    .input {
      margin-left: 0;
      margin-top: 5px;
      width: 100%;
    }

    .table-header, .table-row {
      flex-wrap: wrap;
    }

    .table-header-text, .table-cell {
      width: 100%;
      margin-bottom: 5px;
    }

    .actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
`;

// Add styles to the document
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default DataManagement;