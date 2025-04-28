// src/Router.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import App from './App'; // Your existing dashboard
import PublicApp from './PublicApp'; // Import the new public component
import LoginPage from './LoginPage';
import AllCustomersPage from './AllCustomersPage';

// Get the Publishable Key from environment variables
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing REACT_APP_CLERK_PUBLISHABLE_KEY from .env");
}

// New component to handle Clerk Provider and Routes within BrowserRouter context
function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
    >
      <Routes>
        {/* Protected dashboard route */}
        <Route
          path="/dashboard/:practiceId"
          element={
            <>
              <SignedIn>
                <App />
              </SignedIn>
              <SignedOut>
                {/* Redirect to login if trying to access dashboard while signed out */}
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Public Report Route - Does not require sign-in */}
        <Route 
          path="/public-report/:practiceId" 
          element={<PublicApp />} 
        />

        {/* Login Page Route - Added wildcard */}
        <Route path="/login/*" element={<LoginPage />} />

        {/* Protected All Customers Route */}
        <Route
          path="/all-customers"
          element={
            <>
              <SignedIn>
                <AllCustomersPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Redirect root path to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Optional: Add a Sign Up route if needed, often handled by Clerk component */}
        {/* <Route path="/sign-up" element={<SignUpPage />} /> */}

        {/* Optional: Catch-all for undefined routes */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}

      </Routes>
    </ClerkProvider>
  );
}

// Original AppRouter now just sets up BrowserRouter
function AppRouter() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  );
}

export default AppRouter;