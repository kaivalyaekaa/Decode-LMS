import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationTable from './RegistrationTable';
import UserManagementTable from './UserManagementTable';
import {
    getRegAdminRegistrations, getRegAdminInstructors,
    getRegAdminStats, getAllUsers, uploadExcel
} from '../services/api';
import { PROGRAM_LEVELS, ROLES, PAYMENT_STATUSES } from '../constants'; // Import constants

const RegistrationAdminDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    
    // UI States
    const [activeTab, setActiveTab] = useState('registrations');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Upload States
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [regsRes, instRes, statsRes, usersRes] = await Promise.all([
                getRegAdminRegistrations(), getRegAdminInstructors(), getRegAdminStats(), getAllUsers()
            ]);
            setRegistrations(regsRes.data.registrations);
            setInstructors(instRes.data.instructors);
            setStats(statsRes.data.statistics);
            setUsers(usersRes.data.users);
        } catch (error) {
            alert('Error loading data: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUploadClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadFile(file);
            setShowUploadModal(true);
        }
    };

    const handleUploadExcel = async () => {
        if (!uploadFile) return;
        const formData = new FormData();
        formData.append('file', uploadFile);
        setUploading(true);
        setUploadResult(null);
        try {
            const res = await uploadExcel(formData);
            setUploadResult(res.data);
            fetchData();
        } catch (error) {
            setUploadResult({ successCount: 0, failedCount: 0, errors: [error.response?.data?.message || 'Upload failed.'] });
        } finally {
            setUploading(false);
        }
    };
    
    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="admin-container">
            <header className="dashboard-nav">
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto' }}>
                    <div>
                        <h1 style={{ color: 'white', margin: 0 }}>Registration Admin</h1>
                        <p style={{ color: 'var(--primary-soft-lavender)', margin: 0 }}>Welcome, {user?.fullName}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </header>
            
            <main style={{ maxWidth: '1600px', margin: '2rem auto', padding: '0 2rem' }}>
                 <div className="card-grid">
                    <div className="card text-center">
                        <h3>Total Registrations</h3>
                        <p className="big-number">{stats?.totalRegistrations || 0}</p>
                    </div>
                     <div className="card text-center">
                        <h3>Assigned</h3>
                        <p className="big-number">{stats?.assignedRegistrations || 0}</p>
                    </div>
                     <div className="card text-center">
                        <h3>Unassigned</h3>
                        <p className="big-number">{stats?.unassignedRegistrations || 0}</p>
                    </div>
                     <div className="card text-center">
                        <h3>Online</h3>
                        <p className="big-number">{stats?.onlineRegistrations || 0}</p>
                    </div>
                     <div className="card text-center">
                        <h3>Offline</h3>
                        <p className="big-number">{stats?.offlineRegistrations || 0}</p>
                    </div>
                     <div className="card text-center">
                        <h3>Paid</h3>
                        <p className="big-number">{stats?.paidRegistrations || 0}</p>
                    </div>
                </div>

                <div className="nav-tabs">
                    <button onClick={() => setActiveTab('registrations')} className={`nav-tab ${activeTab === 'registrations' ? 'active' : ''}`}>Registrations</button>
                    <button onClick={() => setActiveTab('users')} className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}>User Management</button>
                </div>

                <div style={{marginTop: '2rem'}}>
                    {activeTab === 'registrations' ? (
                        <>
                            <div className="table-header">
                                <h3>All Registrations ({registrations.length})</h3>
                                <button className="btn" onClick={handleUploadClick}>Upload Excel</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx, .xls" />
                            </div>
                            <RegistrationTable registrations={registrations} instructors={instructors} fetchData={fetchData} />
                        </>
                    ) : (
                        <UserManagementTable users={users} fetchData={fetchData} />
                    )}
                </div>
            </main>
            
            {showUploadModal && (
                 <div className="popup-overlay">
                    <div className="popup-box" style={{width: '500px'}}>
                        <h2>Upload Excel File</h2>
                        {uploadResult ? (
                            <div>
                                <h4>Upload Complete</h4>
                                <p className="alert alert-success">Successful: {uploadResult.successCount}</p>
                                <p className="alert alert-error">Failed: {uploadResult.failedCount}</p>
                                {uploadResult.errors?.length > 0 && (
                                    <div style={{marginTop: '1rem'}}>
                                        <h5>Errors:</h5>
                                        <ul style={{textAlign: 'left', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: '#f3f4f6'}}>
                                            {uploadResult.errors.map((err, i) => <li key={i} style={{fontSize: '0.8rem'}}>{err}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p>Uploading: <strong>{uploadFile?.name}</strong></p>
                                <p>Ensure columns are: <small>Full Name, Email, Phone, Instructor, Program Level, Batch, Mode, Payment Status</small></p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            {!uploadResult && <button onClick={handleUploadExcel} disabled={uploading} className="btn">{uploading ? 'Uploading...' : 'Confirm Upload'}</button>}
                            <button onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadResult(null); }} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationAdminDashboard;
