import React from 'react';
// Remove unused Link import
// import { Link } from 'react-router-dom';
import { SignIn } from "@clerk/clerk-react";
// import './LoginPage.css'; // Removed non-existent CSS import

function LoginPage() {
  return (
    <div className="login-page"> { /* Ensure this class provides centering/layout */}
      <div className="login-container">
        <div className="logo-container">
          <img
            src="/images/Neurolens Aligned Eye Blue PNG.png"
            alt="Neurolens - Relief is in Sight"
            className="company-logo"
          />
        </div>
        {/* Remove placeholder H1 and P tags */}
        {/* <p>Login page will be implemented in the future</p> */}
        {/* <Link to="/all" className="login-button">Continue to Dashboard</Link> */}

        {/* Add the Clerk SignIn component */}
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/sign-up" // Optional: Adjust if you have a custom sign-up route or disable
          afterSignInUrl="/all-customers"
        />
      </div>
    </div>
  );
}

export default LoginPage;