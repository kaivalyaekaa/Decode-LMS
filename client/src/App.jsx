import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import LoginPage from './components/LoginPage';
import InstructorDashboard from './components/InstructorDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import ManagementDashboard from './components/ManagementDashboard';
import RegistrationAdminDashboard from './components/RegistrationAdminDashboard';
import CertificateVerification from './components/CertificateVerification';
import StudentPortal from './components/StudentPortal';
import PrivateRoute from './components/PrivateRoute';


import { ToastProvider } from './context/ToastContext';

function App() {
    return (
        <ToastProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/" element={<RegistrationForm />} />
                    <Route path="/registration" element={<RegistrationForm />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin/login" element={<LoginPage />} />
                    <Route path="/student-portal" element={<StudentPortal />} />

                    {/* Protected Routes */}
                    <Route
                        path="/instructor"
                        element={
                            <PrivateRoute allowedRoles={['instructor']}>
                                <InstructorDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/finance"
                        element={
                            <PrivateRoute allowedRoles={['finance']}>
                                <FinanceDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/management"
                        element={
                            <PrivateRoute allowedRoles={['management']}>
                                <ManagementDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/registration-admin"
                        element={
                            <PrivateRoute allowedRoles={['registration_admin']}>
                                <RegistrationAdminDashboard />
                            </PrivateRoute>
                        }
                    />

                    {/* Public certificate verification */}
                    <Route path="/verify-certificate/:certificateNumber" element={<CertificateVerification />} />
                </Routes>
            </Router>
        </ToastProvider>
    );
}

export default App;
