import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WebHome from '../src/web/WebHome';
import AdminLoginPage from '../src/web/WebAuth/AdminLoginPage';
import SuperAdminLoginPage from '../src/web/WebAuth/SuperAdminLoginPage';
import CoAdminLoginPage from '../src/web/WebAuth/CoAdminLoginPage';
import CoAdminHome from '../src/web/CoAdminHome';
import AdminHome from '../src/web/AdminHome';
import SuperAdminHome from '../src/web/SuperAdminHome';
import SystemSettings from '../src/web/Settings/Settings';
import ForgotPasswordPage from '../src/web/WebAuth/ForgotPasswordPage';
import ProtectedRoute from '../src/web/WebAuth/ProtectedRoute'; 


const WebNav = () => {
  return (
<Router>
  <Routes>
    <Route path="/" element={<WebHome />} />
    <Route path="/adminlogin" element={<AdminLoginPage />} />
    <Route path="/coadminlogin" element={<CoAdminLoginPage />} />
    <Route path="/superadminlogin" element={<SuperAdminLoginPage />} />
    {/* Protecting the admin home route */}
    <Route
      path="/adminhome"
      element={<ProtectedRoute requiredRole="admin"><AdminHome /></ProtectedRoute>}
    />
     <Route
      path="/coadminhome"
      element={<ProtectedRoute requiredRole="coadmin"><CoAdminHome /></ProtectedRoute>}
    />
    {/* Protecting the superadmin home route */}
    <Route
      path="/superadminhome"
      element={<ProtectedRoute requiredRole="superadmin"><SuperAdminHome /></ProtectedRoute>}
    />
    {/* Protecting settings page route */}
    <Route
      path="/settings"
      element={<ProtectedRoute requiredRole="admin"><SystemSettings /></ProtectedRoute>}
    />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  </Routes>
</Router>
  );
};

export default WebNav;
