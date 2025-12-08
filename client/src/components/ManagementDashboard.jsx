import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAllRegistrationsStatus,
    getEligibleRegistrations,
    approveCertificate,
    getManagementStats,
    getIssuedCertificates,
    createTemplate,
    getTemplates,
    setActiveTemplate
} from '../services/api';
import { PAYMENT_STATUSES, CERTIFICATE_STATUSES } from '../constants';

const ManagementDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [eligibleForCert, setEligibleForCert] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('all_registrations');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Modal States
    const [showCertModal, setShowCertModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [certNotes, setCertNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateHtml, setNewTemplateHtml] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [regsRes, eligibleRes, statsRes, certsRes, tplRes] = await Promise.all([
                getAllRegistrationsStatus(),
                getEligibleRegistrations(),
                getManagementStats(),
                getIssuedCertificates(),
                getTemplates()
            ]);
            setRegistrations(regsRes.data.registrations);
            setEligibleForCert(eligibleRes.data.registrations);
            setStats(statsRes.data.statistics);
            setCertificates(certsRes.data.certificates);
            setTemplates(tplRes.data.templates);
        } catch (error) {
            console.error('Error fetching management data:', error);
            alert('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const openCertModal = (registration) => {
        setSelectedRegistration(registration);
        setCertNotes('');
        setShowCertModal(true);
    };

    const handleIssueCertificate = async () => {
        if (!selectedRegistration) return;
        setProcessing(true);
        try {
            await approveCertificate({
                registrationId: selectedRegistration._id,
                batchId: selectedRegistration.batchId,
                notes: certNotes
            });
            alert('Certificate Approved Successfully!');
            setShowCertModal(false);
            fetchData();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            alert(`Error issuing certificate: ${errorMessage}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName || !newTemplateHtml) {
            alert('Please fill in all fields');
            return;
        }
        try {
            await createTemplate({ name: newTemplateName, htmlContent: newTemplateHtml });
            alert('Template created successfully!');
            setShowTemplateModal(false);
            setNewTemplateName('');
            setNewTemplateHtml('');
            fetchData();
        } catch (error) {
            alert('Error creating template: ' + error.message);
        }
    };

    const handleSetActiveTemplate = async (templateId) => {
        try {
            await setActiveTemplate({ templateId });
            alert('Active template updated!');
            fetchData();
        } catch (error) {
            alert('Error updating active template: ' + error.message);
        }
    };

    const defaultTemplateHtml = `<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: sans-serif; text-align: center; border: 10px solid var(--primary-deep-purple); padding: 50px; }
    h1 { color: var(--primary-deep-purple); font-size: 50px; }
    .name { font-size: 40px; font-weight: bold; margin: 20px 0; }
    .text { font-size: 20px; color: var(--neutral-dark-grey); }
</style>
</head>
<body>
    <h1>Certificate of Completion</h1>
    <p class="text">This is to certify that</p>
    <div class="name">{{studentName}}</div>
    <p class="text">has successfully completed {{achievementHtml}}</p>
    <p class="text">Date: {{issueDate}}</p>
    <p class="text">Certificate No: {{certificateNumber}}</p>
</body>
</html>`;

    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="admin-container">
            <header className="dashboard-nav">
                <div className="dashboard-header">
                    <h1>Management Dashboard</h1>
                    <p>Welcome, {user?.fullName}</p>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="nav-tabs">
                    {['all_registrations', 'approvals', 'history', 'templates'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-tab ${activeTab === tab ? 'active' : ''}`}>
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="card">
                    {activeTab === 'all_registrations' && (
                        <div className="table-container">
                            <h3>All Registered Students ({registrations.length})</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Email</th>
                                        <th>Program Level</th>
                                        <th>Batch</th>
                                        <th>Attendance</th>
                                        <th>Payment</th>
                                        <th>Certificate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((reg) => (
                                        <tr key={reg._id}>
                                            <td>{reg.fullName}</td>
                                            <td>{reg.email}</td>
                                            <td>{reg.programLevel}</td>
                                            <td><span className="badge-primary">{reg.batchCode || 'N/A'}</span></td>
                                            <td>
                                                <span className={`status-badge ${reg.presentSessions >= reg.totalSessions && reg.totalSessions > 0 ? 'status-present' : 'status-absent'}`}>
                                                    {reg.presentSessions || 0}/{reg.totalSessions || 0} Sessions
                                                </span>
                                            </td>
                                            <td><span className={`status-badge status-${reg.paymentStatus.toLowerCase().replace(' ', '-')}`}>{reg.paymentStatus}</span></td>
                                            <td><span className={`status-badge status-${reg.certificateStatus.toLowerCase()}`}>{reg.certificateStatus}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'approvals' && (
                        <div className="table-container">
                            <h3>Pending Approvals ({eligibleForCert.length})</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Program Level</th>
                                        <th>Batch</th>
                                        <th>Payment</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eligibleForCert.map((reg) => (
                                        <tr key={reg._id}>
                                            <td>{reg.fullName}</td>
                                            <td>{reg.programLevel}</td>
                                            <td><span className="badge-primary">{reg.batchInfo?.batchCode || 'N/A'}</span></td>
                                            <td><span className={`status-badge status-${PAYMENT_STATUSES.PAID.toLowerCase()}`}>{PAYMENT_STATUSES.PAID}</span></td>
                                            <td>
                                                <button onClick={() => openCertModal(reg)} className="btn">
                                                    Evaluate & Issue
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="table-container">
                            <h3>Certificate History ({certificates.length})</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Certificate No.</th>
                                        <th>Student</th>
                                        <th>Program Level</th>
                                        <th>Issue Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {certificates.map((cert) => (
                                        <tr key={cert._id}>
                                            <td>{cert.certificateNumber}</td>
                                            <td>{cert.studentRegistrationId?.fullName || 'N/A'}</td>
                                            <td>{cert.programLevel}</td>
                                            <td>{new Date(cert.issueDate).toLocaleDateString()}</td>
                                            <td>
                                                <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View PDF</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div>
                            <div className="table-header">
                                <h3>Manage Certificate Designs</h3>
                                <button onClick={() => { setNewTemplateHtml(defaultTemplateHtml); setShowTemplateModal(true); }} className="btn">
                                    + Add New Template
                                </button>
                            </div>
                            <div className="template-grid">
                                {templates.map((template) => (
                                    <div key={template._id} className="card template-card">
                                        {template.isActive && <span className="badge-primary active-badge">Active</span>}
                                        <h4>{template.name}</h4>
                                        <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                                        {!template.isActive && (
                                            <button onClick={() => handleSetActiveTemplate(template._id)} className="btn btn-secondary">Set Active</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {showCertModal && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Issue Certificate</h2>
                        <p><strong>Student:</strong> {selectedRegistration.fullName}</p>
                        <p><strong>Program:</strong> {selectedRegistration.programLevel}</p>
                        <p><strong>Batch:</strong> {selectedRegistration.batchCode || selectedRegistration.batchInfo?.batchCode || 'N/A'}</p>

                        <div className="form-group">
                            <label>Notes (Internal)</label>
                            <textarea
                                value={certNotes}
                                onChange={(e) => setCertNotes(e.target.value)}
                                className="form-textarea"
                            />
                        </div>

                        <div className="flex-group">
                            <button onClick={handleIssueCertificate} disabled={processing} className="btn">
                                {processing ? 'Issuing...' : 'Approve & Issue Certificate'}
                            </button>
                            <button onClick={() => setShowCertModal(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTemplateModal && (
                <div className="popup-overlay">
                    <div className="popup-box large-popup">
                        <h2>Create New Template</h2>
                        <div className="form-group">
                            <label>Template Name</label>
                            <input
                                type="text"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="e.g., Modern Certificate 2025"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>HTML Content</label>
                            <p>Available variables: {'{{studentName}}'}, {'{{achievementHtml}}'}, {'{{issueDate}}'}, {'{{certificateNumber}}'}</p>
                            <textarea
                                value={newTemplateHtml}
                                onChange={(e) => setNewTemplateHtml(e.target.value)}
                                className="form-textarea large-textarea"
                            />
                        </div>
                        <div className="flex-group">
                            <button onClick={handleCreateTemplate} className="btn">Save Template</button>
                            <button onClick={() => setShowTemplateModal(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagementDashboard;
