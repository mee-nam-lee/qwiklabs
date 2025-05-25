import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ toggleAutoRefresh, isAutoRefreshing, manualUpdateScores }) => {
  return (
    <header className="app-header">
      <Link to="/" className="logo-link">
        <div className="logo">
          <span className="logo-icon">H</span> Hackathon Tracker
        </div>
      </Link>
      <nav className="navigation">
        <Link to="/register" style={{ marginRight: '10px' }}>Register Participant</Link>
        <Link to="/setup" style={{ marginRight: '25px' }}>Setup</Link>
        <button 
          onClick={manualUpdateScores}
          className="nav-button" // You might want to style this like a link or a subtle button
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#4fc3f7', // Link-like color
            cursor: 'pointer', 
            padding: '0', 
            fontSize: 'inherit',
            marginRight: '15px' 
          }}
        >
          Update Score
        </button>
      </nav>
      <div className="user-actions">
        <button 
          className="icon-button" 
          aria-label={isAutoRefreshing ? "Stop Realtime Refresh" : "Start Realtime Refresh"}
          onClick={toggleAutoRefresh}
          style={{
            backgroundColor: isAutoRefreshing ? '#e74c3c' : '#2ecc71', // Red when on, Green when off
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '15px', // Add some space from the new button
            fontSize: '0.8rem' // Reduced font size
          }}
        >
          {isAutoRefreshing ? 'Stop Auto Refresh' : 'Auto Refresh'}
        </button>
      </div>
    </header>
  );
};

export default Header;
