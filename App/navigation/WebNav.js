import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WebHome from '../src/web/WebHome';
import AdminLoginPage from '../src/web/WebAuth/AdminLoginPage';
import SuperAdminLoginPage from '../src/web/WebAuth/SuperAdminLoginPage';
import AdminHome from '../src/web/AdminHome';
import SuperAdminHome from '../src/web/SuperAdminHome';
import SystemSettings from '../src/web/Settings/Settings';
import ForgotPasswordPage from '../src/web/WebAuth/ForgotPasswordPage';

const WebNav = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WebHome />} />
        <Route path="/adminlogin" element={<AdminLoginPage />} />
        <Route path="/superadminlogin" element={<SuperAdminLoginPage />} />
        <Route path="/adminhome" element={<AdminHome />} />
        <Route path="/superadminhome" element={<SuperAdminHome />} />
        <Route path="/settings" element={<SystemSettings />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </Router>
  );
};

export default WebNav;
