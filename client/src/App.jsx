import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// Auth Pages
import Login from './pages/auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
// Components
import Loader from './components/ui/Loader';
// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import Patients from './pages/patients/Patients';
import PatientRegistration from './pages/patients/PatientRegistration';
import PatientDetails from './pages/patients/PatientDetails';
import Admissions from './pages/admissions/Admissions';
import AdmissionForm from './pages/admissions/AdmissionForm';
import BedManagement from './pages/beds/BedManagement';
import Billing from './pages/billing/Billing';
import UserManagement from './pages/user/UserManagement';
import Layout from './components/layout/Layout';
import { ToastProvider } from './contexts/ToastContext';




const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/patients" element={
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/patients/register" element={
          <ProtectedRoute>
            <Layout>
              <PatientRegistration />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/patients/:id" element={
          <ProtectedRoute>
            <Layout>
              <PatientDetails />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admissions" element={
          <ProtectedRoute>
            <Layout>
              <Admissions />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admissions/new" element={
          <ProtectedRoute>
            <Layout>
              <AdmissionForm />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/beds" element={
          <ProtectedRoute>
            <Layout>
              <BedManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/billing" element={
          <ProtectedRoute>
            <Layout>
              <Billing />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
  );
}

export default App;