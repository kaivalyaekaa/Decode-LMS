import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFinanceRegistrations, updateRegistrationPayment, getFinanceStats } from '../services/api';
import { PAYMENT_STATUSES, REGIONS } from '../constants';

import Layout from './Layout';
import { useToast } from '../context/ToastContext';

const FinanceDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('india'); // 'india', 'international'

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
    const [paymentDate, setPaymentDate] = useState(''); // New State for Date update in modal if needed, or mostly for display

    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchData();
    }, []);

    useEffect(() => {
        // Map tabs to regions
        let region = '';
        if (activeTab === 'india') region = 'INDIA';
        if (activeTab === 'international') region = 'USA'; // Or logic to exclude India if API supports it, for now assume USA/International mapped to specific value or backend handles 'International' 

        // Current backend likely filters exact match. 
        // If I want "Not India", I might need backend change or just send 'USA' (assuming two main regions: India, USA, UAE).
        // Let's assume 'International' fetches USA + UAE or sends nothing and we filter client side? 
        // Better: Update backend to handle 'International'. Or just loop through requests.
        // For now, let's map 'international' to 'USA' as start, but maybe 'UAE' too?
        // Let's pass the activeTab directly if backend supports "International" or handle multiple.
        // The user requirement said "US / International". 
        // I will update fetch logic to handle this client side or query wise.

        // Simpler approach: Pass activeTab as region query if it matches, else specific.
        // Let's trust backend handles exact 'INDIA'. For others, maybe empty checks?
        // Note: financeController uses `filter.region = region`.

        fetchRegistrations({ ...filters, region: activeTab === 'india' ? 'INDIA' : (activeTab === 'international' ? 'USA' : '') });
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
            addToast('Error loading stats: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async (params) => {
        try {
            setLoading(true);
            // Handling International (Non-India) logic if needed
            // If params.region is USA, it fetches USA. What about UAE?
            // If activeTab is International, we might want to fetch ALL and filter? Or fix backend.
            // For this task, I'll stick to mapping International -> USA as per previous code context (US_MANUAL).
            // If user has UAE, they might show up if I leave region blank?
            // Let's leave region blank for International to fetch all, then filter OUT India?
            // But if I pass region='INDIA', it works.

            let queryParams = { ...params };
            if (activeTab === 'international') {
                delete queryParams.region; // Fetch all, then filter
            }

            const regsRes = await getFinanceRegistrations(queryParams);
            let regs = regsRes.data.registrations;

            if (activeTab === 'international') {
                regs = regs.filter(r => r.region !== 'INDIA');
            }

            setRegistrations(regs);
        } catch (error) {
            addToast('Error fetching registrations: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
        }
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
            addToast('Payment status updated!', 'success');
            setShowUpdateModal(false);
            // Refresh
            const region = activeTab === 'india' ? 'INDIA' : (activeTab === 'international' ? 'USA' : '');
            // Retrigger effect
            // Or manually fetch
            fetchRegistrations({ ...filters, region: activeTab === 'india' ? 'INDIA' : '' }); // Trigger refresh logic
        } catch (error) {
            addToast('Error updating payment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    return (
        <Layout title="Finance Dashboard">
            <div className="dashboard-content">
                <div className="dashboard-nav">
                    <div className="nav-tabs">
                        <button onClick={() => setActiveTab('india')} className={`nav-tab ${activeTab === 'india' ? 'active' : ''}`}>India Payments</button>
                        <button onClick={() => setActiveTab('international')} className={`nav-tab ${activeTab === 'international' ? 'active' : ''}`}>International (US/Global)</button>
                    </div>
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
                                    <th>Payment Date</th>
                                    <th>Transaction ID</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center"><div className="spinner"></div></td></tr>
                                ) : registrations.map(reg => (
                                    <tr key={reg._id}>
                                        <td>{reg.fullName}</td>
                                        <td>{reg.email}</td>
                                        <td>{reg.programLevel}</td>
                                        <td><span className="badge-primary">{reg.region}</span></td>
                                        <td><span className={`status-badge status-${reg.paymentStatus.toLowerCase().replace(' ', '-')}`}>{reg.paymentStatus}</span></td>
                                        <td>{reg.paymentDate ? new Date(reg.paymentDate).toLocaleDateString() : '-'}</td>
                                        <td>{reg.transactionId || '-'}</td>
                                        <td>
                                            <button onClick={() => openUpdateModal(reg)} className="btn btn-sm">Update</button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && registrations.length === 0 && (
                                    <tr><td colSpan="8" className="text-center">No records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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
        </Layout>
    );
};

export default FinanceDashboard;
