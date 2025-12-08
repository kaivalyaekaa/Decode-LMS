import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getInstructorBatches,
    getBatchStudents,
    getMyStudents,
    registerStudentByInstructor,
    markAttendance,
    bulkMarkAttendance,
    createBatch
} from '../services/api';
import { PROGRAM_LEVELS, PAYMENT_STATUSES } from '../constants'; // Import constants

const InstructorDashboard = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [students, setStudents] = useState([]);
    const [registeredByMeRegistrations, setRegisteredByMeRegistrations] = useState([]);
    const [activeTab, setActiveTab] = useState('attendance'); // attendance, my_students, register, create_batch
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    // Registration Form State
    const [regForm, setRegForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        cityCountry: '',
        programLevel: '',
        referralSource: '',
        referrerName: '',
        mode: 'Online Training'
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

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchBatches();
        fetchMyStudents();
    }, []);

    useEffect(() => {
        if (selectedBatchId) {
            fetchStudents(selectedBatchId);
        } else {
            setStudents([]);
        }
    }, [selectedBatchId]);

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
            const registeredByMeRes = await getMyStudents();
            setRegisteredByMeRegistrations(registeredByMeRes.data.registrations);
        } catch (error) {
            console.error('Error fetching instructor data:', error);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

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
                mode: 'Online'
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

    if (loading && !batches.length) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="admin-container">
            <header className="dashboard-nav">
                <div className="dashboard-header">
                    <h1>Instructor Dashboard</h1>
                    <p>Welcome, {user?.fullName}</p>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </header>

            <div className="dashboard-content">
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
                                        <th>Payment Status</th>
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
                                                    <span className={`status-badge status-${registration.paymentStatus.toLowerCase().replace(' ', '-')}`}>
                                                        {registration.paymentStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                <label>Email Address (To receive certificate)</label>
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
                                <label>From whom did you hear about us? (Name of referrer/trainer)</label>
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
                                <label>Batch Code *</label>
                                <input
                                    type="text"
                                    value={batchForm.batchCode}
                                    onChange={e => setBatchForm({ ...batchForm, batchCode: e.target.value })}
                                    required
                                    placeholder="e.g. L1-JAN-2024"
                                    className="form-input"
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
                                <div className="student-selection-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                                    {registeredByMeRegistrations.length === 0 ? (
                                        <p className="text-muted">No students available to add.</p>
                                    ) : (
                                        registeredByMeRegistrations.map(student => (
                                            <div key={student._id} className="checkbox-item" style={{ marginBottom: '5px' }}>
                                                <input
                                                    type="checkbox"
                                                    id={`student-${student._id}`}
                                                    checked={batchForm.studentIds.includes(student._id)}
                                                    onChange={() => handleStudentSelection(student._id)}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <label htmlFor={`student-${student._id}`}>
                                                    {student.fullName} ({student.email})
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="btn primary-btn">Create Batch</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructorDashboard;
