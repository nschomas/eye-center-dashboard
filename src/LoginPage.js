import React from 'react';
import { Link } from 'react-router-dom';

function LoginPage() {
    // This is a stub for the login page
    // Will be implemented later
  
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="logo-container">
            <img 
              src="/images/Neurolens Aligned Eye Blue PNG.png" 
              alt="Neurolens - Relief is in Sight" 
              className="company-logo" 
            />
          </div>
          <h1>Login</h1>
          <p>Login page will be implemented in the future</p>
          <Link to="/all" className="login-button">Continue to Dashboard</Link>
        </div>
      </div>
    );
  }

export default LoginPage;