import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAllBatches,
    getStudentsByBatch,
    approveCertificate,
    getManagementStats,
    getIssuedCertificates,
    createTemplate,
    getTemplates,
    setActiveTemplate,
    downloadBatchCertificates,
    rejectCertificate // Import reject API
} from '../services/api';
import { PAYMENT_STATUSES } from '../constants';

import Layout from './Layout';
import { useToast } from '../context/ToastContext';

const ManagementDashboard = () => {
    const [batches, setBatches] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('batches'); // Default to batches
    const [loading, setLoading] = useState(true);

    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchStudents, setBatchStudents] = useState([]);
    const [showDrawer, setShowDrawer] = useState(false);

    // Batch Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterTrainer, setFilterTrainer] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [loadingStudents, setLoadingStudents] = useState(false);

    // Modal States (Certificate/Template)
    const [showCertModal, setShowCertModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [certNotes, setCertNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateHtml, setNewTemplateHtml] = useState('');

    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [batchesRes, statsRes, certsRes, tplRes] = await Promise.all([
                getAllBatches(),
                getManagementStats(),
                getIssuedCertificates(),
                getTemplates()
            ]);
            setBatches(batchesRes.data.batches);
            setStats(statsRes.data.statistics);
            setCertificates(certsRes.data.certificates);
            setTemplates(tplRes.data.templates);
        } catch (error) {
            console.error('Error fetching management data:', error);
            addToast('Error loading data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Batch Drawer Logic ---
    const handleBatchClick = async (batch) => {
        setSelectedBatch(batch);
        setShowDrawer(true);
        setLoadingStudents(true);
        try {
            const res = await getStudentsByBatch(batch._id);
            setBatchStudents(res.data.students);
        } catch (error) {
            addToast('Error fetching students: ' + error.message, 'error');
        } finally {
            setLoadingStudents(false);
        }
    };

    const closeDrawer = () => {
        setShowDrawer(false);
        setSelectedBatch(null);
        setBatchStudents([]);
    };

    // --- Certificate & Template Logic (Existing) ---
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
                batchId: selectedBatch?._id || selectedRegistration.batchId, // Use active batch context if available
                notes: certNotes
            });
            addToast('Certificate Approved Successfully!', 'success');
            setShowCertModal(false);
            // Refresh batch students if drawer is open
            if (selectedBatch) {
                const res = await getStudentsByBatch(selectedBatch._id);
                setBatchStudents(res.data.students);
            }
            fetchData(); // Refresh stats/certificates
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            addToast(`Error issuing certificate: ${errorMessage} `, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectCertificate = async () => {
        if (!window.confirm('Are you sure you want to REJECT this student?')) return;
        setProcessing(true);
        try {
            await rejectCertificate({
                registrationId: selectedRegistration._id,
                notes: certNotes
            });
            addToast('Student Rejected.', 'info');
            setShowCertModal(false);
            if (selectedBatch) {
                const res = await getStudentsByBatch(selectedBatch._id);
                setBatchStudents(res.data.students);
            }
            fetchData();
        } catch (error) {
            addToast('Error rejecting: ' + error.message, 'error');
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

    const defaultTemplateHtml = `< !DOCTYPE html >
    <html>
        <head>
            <style>
                body {font - family: sans-serif; text-align: center; border: 10px solid var(--primary-deep-purple); padding: 50px; }
                h1 {color: var(--primary-deep-purple); font-size: 50px; }
                .name {font - size: 40px; font-weight: bold; margin: 20px 0; }
                .text {font - size: 20px; color: var(--neutral-dark-grey); }
            </style>
        </head>
        <body>
            <h1>Certificate of Completion</h1>
            <p class="text">This is to certify that</p>
            <div class="name">{{ studentName }}</div>
            <p class="text">has successfully completed {{ achievementHtml }}</p>
            <p class="text">Date: {{ issueDate }}</p>
            <p class="text">Certificate No: {{ certificateNumber }}</p>
        </body>
    </html>`;

    // Filter Logic for Batches
    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel ? batch.programLevel === filterLevel : true;
        const matchesTrainer = filterTrainer ? batch.instructorName === filterTrainer : true;
        const matchesStatus = filterStatus ? batch.status === filterStatus : true;
        return matchesSearch && matchesLevel && matchesTrainer && matchesStatus;
    });

    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <Layout title="Management Dashboard">
            <div className="dashboard-nav">
                <div className="nav-tabs">
                    {['batches', 'history', 'templates'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`nav - tab ${activeTab === tab ? 'active' : ''} `}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                {activeTab === 'batches' && (
                    <div className="table-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3>All Training Batches ({filteredBatches.length})</h3>

                            {/* Filter Controls */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {/* Search */}
                                <input
                                    type="text"
                                    placeholder="Search Batch ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input"
                                    style={{ width: '180px', padding: '8px' }}
                                />

                                {/* Level Filter */}
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                    className="form-input"
                                    style={{ width: '150px', padding: '8px' }}
                                >
                                    <option value="">All Levels</option>
                                    {[...new Set(batches.map(b => b.programLevel))].map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>

                                {/* Trainer Filter */}
                                <select
                                    value={filterTrainer}
                                    onChange={(e) => setFilterTrainer(e.target.value)}
                                    className="form-input"
                                    style={{ width: '150px', padding: '8px' }}
                                >
                                    <option value="">All Trainers</option>
                                    {[...new Set(batches.map(b => b.instructorName))].map(trainer => (
                                        <option key={trainer} value={trainer}>{trainer}</option>
                                    ))}
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="form-input"
                                    style={{ width: '130px', padding: '8px' }}
                                >
                                    <option value="">All Status</option>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>

                                {/* Clear Filters */}
                                {(searchTerm || filterLevel || filterTrainer || filterStatus) && (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterLevel('');
                                            setFilterTrainer('');
                                            setFilterStatus('');
                                        }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <table className="batch-table">
                            <thead>
                                <tr>
                                    <th>Batch ID</th>
                                    <th>Program Level</th>
                                    <th>Trainer</th>
                                    <th>Start Date</th>
                                    <th>Status</th>
                                    <th>Students</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBatches.length > 0 ? (
                                    filteredBatches.map(batch => (
                                        <tr key={batch._id} onClick={() => handleBatchClick(batch)} style={{ cursor: 'pointer' }}>
                                            <td className="font-bold">{batch.batchCode}</td>
                                            <td>{batch.programLevel}</td>
                                            <td>{batch.instructorName}</td>
                                            <td>{new Date(batch.startDate).toLocaleDateString()}</td>
                                            <td><span className={`status-badge status-${batch.status.toLowerCase()}`}>{batch.status}</span></td>
                                            <td>{batch.studentCount}</td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary">View Students</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No batches found matching filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* History and Template Tabs remain largely similar */}
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
                                            <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View Certificate</a>
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

            {/* Batch Drawer */}
            {showDrawer && (
                <>
                    <div className="drawer-overlay" onClick={closeDrawer}></div>
                    <div className="drawer">
                        <div className="drawer-header">
                            <div>
                                <h2>Batch Details: {selectedBatch?.batchCode}</h2>
                                <p><strong>Trainer:</strong> {selectedBatch?.instructorName}</p>
                                <p><strong>Date:</strong> {new Date(selectedBatch?.startDate).toLocaleDateString()}</p>
                                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                                    <span>Total Students: <strong>{batchStudents.length}</strong></span> &nbsp;|&nbsp;
                                    <span>Paid: <strong>{batchStudents.filter(s => s.paymentStatus === 'Paid').length}</strong></span> &nbsp;|&nbsp;
                                    <span>Issued: <strong>{batchStudents.filter(s => s.certificateStatus === 'Issued').length}</strong></span>
                                </div>
                            </div>
                            <button onClick={closeDrawer} className="close-btn">&times;</button>
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                                className="btn primary-btn"
                                onClick={async () => {
                                    try {
                                        const response = await downloadBatchCertificates(selectedBatch._id);
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `certificates - ${selectedBatch.batchCode}.zip`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                        window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                        console.error('Download failed', error);
                                        addToast('Failed to download certificates: ' + (error.response?.data?.message || error.message), 'error');
                                    }
                                }}
                            >
                                Download All Certificates
                            </button>
                        </div>

                        {loadingStudents ? (
                            <div className="spinner"></div>
                        ) : (
                            <div className="table-container">
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Payment</th>
                                            <th>Certificate</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batchStudents.map(student => (
                                            <tr key={student._id}>
                                                <td>
                                                    <strong>{student.fullName}</strong><br />
                                                    <small>{student.email}</small>
                                                </td>
                                                <td>
                                                    <span className={`status - badge status - ${student.paymentStatus.toLowerCase()} `}>
                                                        {student.paymentStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status - badge status - ${(student.certificateStatus || 'pending').toLowerCase()} `}>
                                                        {student.certificateStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {student.paymentStatus === 'Paid' && student.certificateStatus !== 'Issued' && (
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => openCertModal(student)}
                                                        >
                                                            Issue Cert
                                                        </button>
                                                    )}
                                                    {student.certificateStatus === 'Issued' && student.certificateUrl && (
                                                        <a
                                                            className="btn btn-sm btn-secondary"
                                                            href={student.certificateUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ textDecoration: 'none', display: 'inline-block' }}
                                                        >
                                                            Download
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {batchStudents.length === 0 && <tr><td colSpan="4">No students in this batch.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Certificate Modal */}
            {showCertModal && (
                <div className="popup-overlay">
                    <div className="popup-box" style={{ width: '500px', maxWidth: '90%' }}>
                        <h2>Issue Certificate</h2>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e9ecef' }}>
                            <p style={{ margin: '0 0 10px 0' }}><strong>StudentCandidate:</strong> {selectedRegistration?.fullName}</p>
                            <p style={{ margin: '0 0 15px 0' }}><strong>Batch Context:</strong> {selectedBatch?.batchCode || 'N/A'}</p>

                            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Evaluation Criteria</h4>
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: selectedRegistration?.paymentStatus === 'Paid' ? 'green' : 'red' }}>
                                    <span style={{ marginRight: '10px' }}>{selectedRegistration?.paymentStatus === 'Paid' ? '✅' : '❌'}</span>
                                    <span>Payment Status: <strong>{selectedRegistration?.paymentStatus}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: 'blue' }}>
                                    <span style={{ marginRight: '10px' }}>ℹ️</span>
                                    <span>
                                        Attendance: <strong>{selectedRegistration?.attendancePresent || 0} Present</strong> / {selectedRegistration?.attendanceTotal || 0} Sessions
                                        {selectedRegistration?.attendanceAbsent > 0 && <span style={{ color: 'red', marginLeft: '5px' }}>({selectedRegistration.attendanceAbsent} Absent)</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Notes (Internal)</label>
                            <textarea
                                value={certNotes}
                                onChange={(e) => setCertNotes(e.target.value)}
                                className="form-textarea"
                                placeholder="Add notes..."
                            />
                        </div>
                        <div className="flex-group">
                            <button onClick={handleRejectCertificate} disabled={processing} className="btn" style={{ backgroundColor: '#dc3545', color: 'white', marginRight: 'auto' }}>Reject</button>
                            <button onClick={() => setShowCertModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleIssueCertificate} disabled={processing} className="btn primary-btn">
                                {processing ? 'Processing...' : 'Approve & Issue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal - same as before */}
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

        </Layout>
    );
};

export default ManagementDashboard;
