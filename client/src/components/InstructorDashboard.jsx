import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getInstructorBatches,
    getBatchStudents,
    getMyStudents,
    registerStudentByInstructor,
    markAttendance,
    bulkMarkAttendance,
    createBatch,
    moveStudentBatch
} from '../services/api';
import { PROGRAM_LEVELS, PAYMENT_STATUSES, REGIONS } from '../constants'; // Import constants

import Layout from './Layout';
import SmartStudentPicker from './SmartStudentPicker';
import PaginationControls from './PaginationControls';

const InstructorDashboard = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [students, setStudents] = useState([]);
    const [registeredByMeRegistrations, setRegisteredByMeRegistrations] = useState([]);
    const [activeTab, setActiveTab] = useState('attendance'); // attendance, my_students, register, create_batch
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    // My Students Pagination
    const [myStudentsPagination, setMyStudentsPagination] = useState({
        page: 1, limit: 10, total: 0, totalPages: 1
    });

    // Registration Form State
    const [regForm, setRegForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        cityCountry: '',
        programLevel: '',
        referralSource: '',
        referrerName: '',
        mode: 'Online Training',
        region: 'INDIA', // Default
        manualDate: ''
    });
    const [regMessage, setRegMessage] = useState(null);

    // Batch Creation Form State
    const [batchForm, setBatchForm] = useState({
        batchCode: '',
        programLevel: '',
        startDate: '',
        mode: 'Online',
        studentIds: []
    });
    const [batchMessage, setBatchMessage] = useState(null);

    // Move Student State
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [studentToMove, setStudentToMove] = useState(null);
    const [targetBatchId, setTargetBatchId] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchBatches();
    }, []);

    useEffect(() => {
        fetchMyStudents();
    }, [myStudentsPagination.page, myStudentsPagination.limit]);

    useEffect(() => {
        if (selectedBatchId) {
            fetchStudents(selectedBatchId);
        } else {
            setStudents([]);
        }
    }, [selectedBatchId]);

    // Auto-generate Batch ID Effect
    useEffect(() => {
        if (batchForm.programLevel && batchForm.startDate && batchForm.mode) {
            generateBatchCode();
        }
    }, [batchForm.programLevel, batchForm.startDate, batchForm.mode]);

    const generateBatchCode = () => {
        // Format: DECODE-L<LEVEL>-<TRAINER_CODE>-<ddmmyy>
        // Example: DECODE-L2-UP-150826

        if (!user || !user.fullName) return;

        const levelMap = {
            'Level 1 – Decode Your Mind': '1',
            'Level 2 – Decode Your Behavior': '2',
            'Level 3 – Decode Your Relationship': '3',
            'Level 4 – Decode Your Blueprint': '4'
        };
        const levelNum = levelMap[batchForm.programLevel] || '1';

        // TRAINER_CODE: First letter of First Name + First letter of Middle/Last Name
        const nameParts = user.fullName.trim().split(/\s+/);
        const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : 'X';
        const secondInitial = nameParts.length > 1 ? nameParts[1][0].toUpperCase() : (nameParts[0].length > 1 ? nameParts[0][1].toUpperCase() : 'X');
        const trainerCode = `${firstInitial}${secondInitial}`;

        const dateObj = new Date(batchForm.startDate);
        if (isNaN(dateObj.getTime())) return;

        // Date in ddmmyy
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yy = String(dateObj.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;

        // Default count is 001 for display. Backend will handle increment if duplicate exists.
        const code = `DECODE-L${levelNum}-${trainerCode}-${dateStr}-001`;
        setBatchForm(prev => ({ ...prev, batchCode: code }));
    };

    const fetchBatches = async () => {
        try {
            const res = await getInstructorBatches();
            setBatches(res.data.batches);
            if (res.data.batches.length > 0) {
                setSelectedBatchId(res.data.batches[0]._id);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (batchId) => {
        try {
            setLoading(true);
            const res = await getBatchStudents(batchId);
            setStudents(res.data.students);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyStudents = async () => {
        try {
            const registeredByMeRes = await getMyStudents({
                page: myStudentsPagination.page,
                limit: myStudentsPagination.limit
            });
            setRegisteredByMeRegistrations(registeredByMeRes.data.registrations);
            setMyStudentsPagination(prev => ({
                ...prev,
                ...registeredByMeRes.data.pagination
            }));
        } catch (error) {
            console.error('Error fetching instructor data:', error);
        }
    }

    const handleMarkAttendance = async (registrationId, status) => {
        try {
            await markAttendance({
                registrationId,
                batchId: selectedBatchId,
                date: attendanceDate,
                status
            });
            alert(`Attendance marked as ${status}!`);
            fetchStudents(selectedBatchId); // Refresh students for the selected batch
        } catch (error) {
            alert('Error marking attendance');
        }
    };

    const handleBulkMarkAttendance = async (status) => {
        try {
            const attendanceData = students.map(student => ({ registrationId: student._id, status }));
            await bulkMarkAttendance({
                attendanceData,
                batchId: selectedBatchId,
                date: attendanceDate
            });
            alert(`All students marked as ${status}!`);
            fetchStudents(selectedBatchId); // Refresh students
        } catch (error) {
            alert('Error bulk marking attendance');
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegMessage(null);

        if (!regForm.programLevel) {
            setRegMessage({ type: 'error', text: 'Please select a program level' });
            return;
        }

        try {
            await registerStudentByInstructor(regForm);
            setRegMessage({ type: 'success', text: 'Student registered successfully!' });
            setRegForm({
                fullName: '',
                email: '',
                phone: '',
                cityCountry: '',
                programLevel: '',
                referralSource: '',
                referrerName: '',
                mode: 'Online Training',
                region: 'INDIA',
                manualDate: ''
            });
            fetchMyStudents();
        } catch (error) {
            setRegMessage({ type: 'error', text: error.response?.data?.message || 'Registration failed' });
        }
    };

    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        setBatchMessage(null);

        if (!batchForm.programLevel || !batchForm.startDate || !batchForm.batchCode) {
            setBatchMessage({ type: 'error', text: 'Please fill all required fields.' });
            return;
        }

        try {
            await createBatch(batchForm);
            setBatchMessage({ type: 'success', text: 'Batch created successfully!' });
            setBatchForm({
                batchCode: '',
                programLevel: '',
                startDate: '',
                mode: 'Online',
                studentIds: []
            });
            fetchBatches(); // Refresh batches list
        } catch (error) {
            setBatchMessage({ type: 'error', text: error.response?.data?.message || 'Batch creation failed' });
        }
    };

    const handleStudentSelection = (studentId) => {
        setBatchForm(prev => {
            const newStudentIds = prev.studentIds.includes(studentId)
                ? prev.studentIds.filter(id => id !== studentId)
                : [...prev.studentIds, studentId];
            return { ...prev, studentIds: newStudentIds };
        });
    };

    const openMoveModal = (student) => {
        setStudentToMove(student);
        setTargetBatchId('');
        setShowMoveModal(true);
    };

    const handleMoveStudent = async () => {
        if (!targetBatchId || !studentToMove) return;

        try {
            await moveStudentBatch({
                registrationId: studentToMove._id,
                targetBatchId
            });
            alert('Student moved successfully!');
            setShowMoveModal(false);
            setStudentToMove(null);
            fetchMyStudents(); // Refresh list to update batch link if we displayed it
            if (selectedBatchId) fetchStudents(selectedBatchId); // Refresh attendance view if needed
        } catch (error) {
            alert(error.response?.data?.message || 'Error moving student');
        }
    };

    if (loading && !batches.length && !registeredByMeRegistrations.length) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <Layout title="Instructor Dashboard">
            <div className="dashboard-content">
                <div className="dashboard-nav">
                    <div className="nav-tabs">
                        {['attendance', 'my_students', 'register', 'create_batch'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'attendance' && (
                    <div className="card">
                        <div className="filters">
                            <div className="form-group">
                                <label htmlFor="batch-select">Select Batch</label>
                                <select id="batch-select" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="form-select">
                                    <option value="">Select a batch</option>
                                    {batches.map(batch => (
                                        <option key={batch._id} value={batch._id}>{batch.batchCode} - {batch.programLevel}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="attendance-date">Attendance Date</label>
                                <input id="attendance-date" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="form-input" />
                            </div>
                        </div>

                        <div className="flex-group" style={{ marginBottom: '1.5rem' }}>
                            <button onClick={() => handleBulkMarkAttendance('Present')} className="btn btn-success">Mark All Present</button>
                            <button onClick={() => handleBulkMarkAttendance('Absent')} className="btn btn-danger">Mark All Absent</button>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Email</th>
                                        <th>Status for {attendanceDate}</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center"><div className="spinner"></div></td></tr>
                                    ) : students.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center empty-message">No students found for this batch.</td></tr>
                                    ) : (
                                        students.map(student => (
                                            <tr key={student._id}>
                                                <td>{student.fullName}</td>
                                                <td>{student.email}</td>
                                                <td>
                                                    <span className={`status-badge status-${student.attendanceStatus.toLowerCase().replace(' ', '-')}`}>
                                                        {student.attendanceStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button onClick={() => handleMarkAttendance(student._id, 'Present')} className="btn btn-success btn-sm">Present</button>
                                                        <button onClick={() => handleMarkAttendance(student._id, 'Absent')} className="btn btn-danger btn-sm">Absent</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'my_students' && (
                    <div className="card">
                        <h3>My Registered Students</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Location</th>
                                        <th>Mode</th>
                                        <th>Registered On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registeredByMeRegistrations.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center empty-message">You haven't registered any students yet.</td></tr>
                                    ) : (
                                        registeredByMeRegistrations.map(registration => (
                                            <tr key={registration._id}>
                                                <td>{registration.fullName}</td>
                                                <td>{registration.email}</td>
                                                <td>{registration.phone}</td>
                                                <td>{registration.cityCountry}</td>
                                                <td><span className={`status-badge status-${registration.mode.toLowerCase()}`}>{registration.mode}</span></td>
                                                <td>{new Date(registration.registrationDate).toLocaleDateString()}</td>
                                                <td>
                                                    <button onClick={() => openMoveModal(registration)} className="btn primary-btn btn-sm">Move Batch</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls
                            currentPage={myStudentsPagination.page}
                            totalPages={myStudentsPagination.totalPages}
                            onPageChange={(page) => setMyStudentsPagination(prev => ({ ...prev, page }))}
                            limit={myStudentsPagination.limit}
                            onLimitChange={(limit) => setMyStudentsPagination(prev => ({ ...prev, limit, page: 1 }))}
                            totalRecords={myStudentsPagination.total}
                        />
                    </div>
                )}

                {activeTab === 'register' && (
                    <div className="card form-card">
                        <h3>Register New Student</h3>
                        {regMessage && (
                            <div className={`alert alert-${regMessage.type === 'success' ? 'success' : 'error'}`}>
                                {regMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="form-group">
                                <label>Full Name (as required in certificate)</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={regForm.fullName}
                                    onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                                    required
                                    placeholder="Enter student's full name"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={regForm.email}
                                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                                    required
                                    placeholder="name@example.com"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={regForm.phone}
                                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                                    required
                                    placeholder="Enter phone number"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>City, Country</label>
                                <input
                                    type="text"
                                    name="cityCountry"
                                    value={regForm.cityCountry}
                                    onChange={e => setRegForm({ ...regForm, cityCountry: e.target.value })}
                                    required
                                    placeholder="e.g. Mumbai, India"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Region</label>
                                <select
                                    name="region"
                                    value={regForm.region}
                                    onChange={e => setRegForm({ ...regForm, region: e.target.value })}
                                    className="form-select"
                                >
                                    {Object.values(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Select Program Level *</label>
                                <select
                                    name="programLevel"
                                    value={regForm.programLevel}
                                    onChange={e => setRegForm({ ...regForm, programLevel: e.target.value })}
                                    required
                                    className="form-select"
                                >
                                    <option value="">Select a program level</option>
                                    {PROGRAM_LEVELS.map((level) => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>How did you hear about us?</label>
                                <input
                                    type="text"
                                    name="referralSource"
                                    value={regForm.referralSource}
                                    onChange={e => setRegForm({ ...regForm, referralSource: e.target.value })}
                                    placeholder="e.g., Social Media, Friend, etc."
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Trainer Name (Referrer)</label>
                                <input
                                    type="text"
                                    name="referrerName"
                                    value={regForm.referrerName}
                                    onChange={e => setRegForm({ ...regForm, referrerName: e.target.value })}
                                    placeholder="Enter name"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Manual Date (Optional)</label>
                                <input
                                    type="date"
                                    name="manualDate"
                                    value={regForm.manualDate}
                                    onChange={e => setRegForm({ ...regForm, manualDate: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Mode</label>
                                <select
                                    name="mode"
                                    value={regForm.mode}
                                    onChange={e => setRegForm({ ...regForm, mode: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="Online Training">Online Training</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>

                            <button type="submit" className="btn primary-btn">Register Student</button>
                        </form>
                    </div>
                )}

                {activeTab === 'create_batch' && (
                    <div className="card form-card">
                        <h3>Create New Batch</h3>
                        {batchMessage && (
                            <div className={`alert alert-${batchMessage.type === 'success' ? 'success' : 'error'}`}>
                                {batchMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleBatchSubmit}>
                            <div className="form-group">
                                <label>Batch Code (Auto-generated)</label>
                                <input
                                    type="text"
                                    value={batchForm.batchCode}
                                    readOnly
                                    className="form-input"
                                    style={{ backgroundColor: '#f0f0f0' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Program Level *</label>
                                <select
                                    value={batchForm.programLevel}
                                    onChange={e => setBatchForm({ ...batchForm, programLevel: e.target.value })}
                                    required
                                    className="form-select"
                                >
                                    <option value="">Select Level</option>
                                    {PROGRAM_LEVELS.map((level) => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    value={batchForm.startDate}
                                    onChange={e => setBatchForm({ ...batchForm, startDate: e.target.value })}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Mode</label>
                                <select
                                    value={batchForm.mode}
                                    onChange={e => setBatchForm({ ...batchForm, mode: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Select Students to Add (Optional)</label>
                                <SmartStudentPicker
                                    onSelectionChange={handleStudentSelection}
                                    selectedStudentIds={batchForm.studentIds}
                                />
                            </div>

                            <button type="submit" className="btn primary-btn" style={{ marginTop: '1rem' }}>Create Batch</button>
                        </form>
                    </div>
                )}

                {/* Move Student Modal */}
                {showMoveModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Move Student: {studentToMove?.fullName}</h3>
                            <div className="form-group">
                                <label>Select New Batch</label>
                                <select
                                    value={targetBatchId}
                                    onChange={(e) => setTargetBatchId(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">Select Target Batch</option>
                                    {batches.map(batch => (
                                        <option key={batch._id} value={batch._id}>
                                            {batch.batchCode} ({new Date(batch.startDate).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowMoveModal(false)} className="btn">Cancel</button>
                                <button onClick={handleMoveStudent} className="btn primary-btn" disabled={!targetBatchId}>Move</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default InstructorDashboard;
