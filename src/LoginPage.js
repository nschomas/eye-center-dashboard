import React from 'react';
// Remove unused Link import
// import { Link } from 'react-router-dom';
import { SignIn } from "@clerk/clerk-react";
// import './LoginPage.css'; // Removed non-existent CSS import

function LoginPage() {
  return (
    <div className="login-page"> { /* Ensure this class provides centering/layout */}
      <div className="login-container">
        {/* Comment out the logo container */}
        {/* 
        <div className="logo-container">
          <img
            src="/images/Neurolens Aligned Eye Blue PNG.png"
            alt="Neurolens - Relief is in Sight"
            className="company-logo"
          />
        </div>
        */}

        {/* Add Custom Title Here */}
        <h1 style={{ 
            color: '#60a5fa', 
            marginBottom: '24px', // Add space below the title 
            fontSize: '1.5rem', // Adjust size as needed
            fontWeight: '600' 
           }}>
          Neurolens Weekly Performance Dashboard
        </h1>

        {/* Add the Clerk SignIn component with appearance override */}
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/sign-up" 
          afterSignInUrl="/all-customers"
          appearance={{
            elements: {
              // Attempt to hide Clerk's default card header elements
              headerTitle: { display: 'none' }, 
              headerSubtitle: { display: 'none' },
              card: { 
                // Remove default Clerk card padding/margin if needed
                padding: '0',
                margin: '0',
                boxShadow: 'none' // Remove default shadow if it clashes
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export default LoginPage;