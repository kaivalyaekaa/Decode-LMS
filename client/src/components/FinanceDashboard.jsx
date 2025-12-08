import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFinanceRegistrations, updateRegistrationPayment, getFinanceStats } from '../services/api';
import { PAYMENT_STATUSES, REGIONS } from '../constants';

const FinanceDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, us_manual

    // Filters
    const [filters, setFilters] = useState({
        country: '',
        startDate: '',
        endDate: ''
    });

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUSES.PENDING);
    const [paymentMode, setPaymentMode] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchData();
    }, []);

    useEffect(() => {
        const region = activeTab === 'us_manual' ? REGIONS.US : '';
        fetchRegistrations({ ...filters, region });
    }, [activeTab, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes] = await Promise.all([getFinanceStats()]);
            setStats(statsRes.data.statistics);
        } catch (error) {
            alert('Error loading stats: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async (params) => {
        try {
            setLoading(true);
            const regsRes = await getFinanceRegistrations(params);
            setRegistrations(regsRes.data.registrations);
        } catch (error) {
            alert('Error fetching registrations: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const openUpdateModal = (registration) => {
        setSelectedRegistration(registration);
        setPaymentStatus(registration.paymentStatus || PAYMENT_STATUSES.PENDING);
        setPaymentMode(registration.paymentMode || '');
        setTransactionId(registration.transactionId || '');
        setShowUpdateModal(true);
    };

    const handleUpdatePayment = async () => {
        try {
            await updateRegistrationPayment(selectedRegistration._id, { paymentStatus, paymentMode, transactionId });
            alert('Payment status updated!');
            setShowUpdateModal(false);
            fetchRegistrations({ ...filters, region: activeTab === 'us_manual' ? REGIONS.US : '' });
        } catch (error) {
            alert('Error updating payment: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="admin-container">
            <header className="dashboard-nav">
                <div className="dashboard-header">
                    <h1>Finance Dashboard</h1>
                    <p>Welcome, {user?.fullName}</p>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="nav-tabs">
                    <button onClick={() => setActiveTab('all')} className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}>All Regions</button>
                    <button onClick={() => setActiveTab('us_manual')} className={`nav-tab ${activeTab === 'us_manual' ? 'active' : ''}`}>US Manual Payments</button>
                </div>

                <div className="filters-section card" style={{ marginBottom: '20px', padding: '15px' }}>
                    <h3>Filters</h3>
                    <div className="flex-group" style={{ gap: '15px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Country (Search)</label>
                            <input
                                type="text"
                                name="country"
                                value={filters.country}
                                onChange={handleFilterChange}
                                placeholder="e.g. India, UAE"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="form-input"
                            />
                        </div>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setFilters({ country: '', startDate: '', endDate: '' })}
                            style={{ height: '40px' }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Email</th>
                                    <th>Program</th>
                                    <th>Region</th>
                                    <th>Payment Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center"><div className="spinner"></div></td></tr>
                                ) : registrations.map(reg => (
                                    <tr key={reg._id}>
                                        <td>{reg.fullName}</td>
                                        <td>{reg.email}</td>
                                        <td>{reg.programLevel}</td>
                                        <td><span className="badge-primary">{reg.region}</span></td>
                                        <td><span className={`status-badge status-${reg.paymentStatus.toLowerCase().replace(' ', '-')}`}>{reg.paymentStatus}</span></td>
                                        <td>
                                            <button onClick={() => openUpdateModal(reg)} className="btn">Update</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showUpdateModal && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Update Payment</h2>
                        <div className="form-group">
                            <label>Payment Status</label>
                            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="form-select">
                                {Object.values(PAYMENT_STATUSES).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Payment Mode</label>
                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="form-select">
                                <option value="">Select Mode</option>
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Transaction ID</label>
                            <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="form-input" />
                        </div>
                        <div className="flex-group">
                            <button onClick={handleUpdatePayment} className="btn" style={{ flex: 1 }}>Update</button>
                            <button onClick={() => setShowUpdateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceDashboard;
