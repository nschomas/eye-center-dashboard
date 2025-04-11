// src/Router.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App'; // Your existing dashboard
import LoginPage from './LoginPage';
import AllCustomersPage from './AllCustomersPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/all" element={<AllCustomersPage />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/dashboard/:practiceId" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;