import React, { useState, useEffect } from 'react';
import SystemSettings from './SystemSettings';
import DataManagement from './DataManagement';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('SystemSettings');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .safe-area-view {
        flex: 1;
        background-color: #F5F5F5;
        height: 100%;
        width: 100%;
        overflow: auto;
      }
      .main-container {
        flex: 1;
      }
      .header-text {
        font-weight: bold;
        font-size: 40px;
        margin-bottom: 10px;
        margin-left: 25px;
        margin-right: 25px;
        margin-top: 100px;
      }
      .top-controls {
        display: flex;
        justify-content: space-between;
        margin: 0 25px;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .circle-tab-wrapper {
        display: flex;
        background-color: #ddd;
        height: 40px;
        border-radius: 30px;
      }
      .tab-button {
        padding: 0 16px;
        height: 40px;
        border-radius: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 1px;
        border: none;
        cursor: pointer;
        outline: none;
      }
      .tab-button:focus {
        outline: none;
        box-shadow: none;
      }
      .tab-text {
        font-size: 14px;
      }
      .data-container {
        flex: 1;
        margin: 0 25px;
        margin-top: 10px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        min-height: 300px;
      }
      .pagination-container {
        display: flex;
        justify-content: flex-end;
        margin: 0 25px;
        margin-top: 10px;
        align-items: center;
      }
      .pagination-info {
        font-size: 12px;
        margin-right: 10px;
        color: #333;
      }
      .pagination-button {
        padding: 0;
        background-color: #2D5783;
        border-radius: 5px;
        margin: 0 3px;
        color: white;
        border: none;
        cursor: pointer;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .pagination-button svg {
        font-size: 10px;
        display: block;
        margin: 0 auto;
      }
      .disabled-button {
        background-color: #ccc;
        cursor: not-allowed;
      }
      @media (max-width: 768px) {
        .circle-tab-wrapper {
          width: 100%;
          justify-content: center;
        }
        .top-controls {
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(styleElement);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      document.head.removeChild(styleElement);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTabSwitch = (section) => {
    setActiveSection(section);
  };

  const renderTabContent = () => {
    switch (activeSection) {
      case 'SystemSettings':
        return <SystemSettings />;
      case 'DataManagement':
        return <DataManagement />;
      default:
        return <SystemSettings />;
    }
  };

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Settings</h2>

        <div className="top-controls">
          <div className="circle-tab-wrapper">
            {[
              { key: 'SystemSettings', label: 'System Settings', color: '#2D5783' },
              { key: 'DataManagement', label: 'Data Management', color: '#FF0000' },
            ].map((tab) => {
              const isActive = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabSwitch(tab.key)}
                  className={`tab-button ${isActive ? 'active-tab' : ''}`}
                  style={{ 
                    backgroundColor: isActive ? tab.color : 'transparent',
                    outline: 'none'
                  }}
                >
                  <span
                    className="tab-text"
                    style={{ color: isActive ? '#fff' : '#000' }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="data-container">
          {renderTabContent()}
        </div>


      </div>
    </div>
  );
};

export default Settings;