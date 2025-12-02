import React, { useState, useEffect } from 'react';
import {
    getRegAdminRegistrations, getRegAdminInstructors, updateRegistration,
    deleteRegistration, assignToInstructor, exportRegistrations
} from '../services/api';
import { PROGRAM_LEVELS, PAYMENT_STATUSES } from '../constants'; // Import constants

const RegistrationTable = ({ registrations, instructors, fetchData }) => {
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterMode, setFilterMode] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
    const [filterReferrer, setFilterReferrer] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Selection states for bulk actions
    const [selectedRegistrations, setSelectedRegistrations] = useState([]);
    const [assignInstructor, setAssignInstructor] = useState('');

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null); // For individual edit/delete
    const [selectedInstructorId, setSelectedInstructorId] = useState(''); // For individual assign

    // Edit form state for individual registration edit
    const [editForm, setEditForm] = useState({
        fullName: '', email: '', phone: '', cityCountry: '', programLevel: '',
        referralSource: '', referrerName: '', mode: '', paymentStatus: '',
        paymentMode: '', transactionId: ''
    });

    const programLevelsOptions = PROGRAM_LEVELS;

    const filteredRegistrations = registrations.filter(registration => {
        const matchesSearch = registration.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            registration.phone.includes(searchTerm);

        const matchesLevel = !filterLevel || registration.programLevel.includes(filterLevel);
        const matchesMode = !filterMode || registration.mode === filterMode;
        const matchesPaymentStatus = !filterPaymentStatus || registration.paymentStatus === filterPaymentStatus;
        const matchesReferrer = !filterReferrer || (registration.referrerName && registration.referrerName.toLowerCase().includes(filterReferrer.toLowerCase()));
        const matchesCity = !filterCity || registration.cityCountry.toLowerCase().includes(filterCity.toLowerCase());

        const registrationDate = new Date(registration.registrationDate);
        const matchesDateFrom = !filterDateFrom || registrationDate >= new Date(filterDateFrom);
        const matchesDateTo = !filterDateTo || registrationDate <= new Date(filterDateTo);

        return matchesSearch && matchesLevel && matchesMode && matchesPaymentStatus && matchesReferrer && matchesCity && matchesDateFrom && matchesDateTo;
    });

    const handleSelectRegistration = (id) => {
        setSelectedRegistrations(prev =>
            prev.includes(id) ? prev.filter(regId => regId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRegistrations(filteredRegistrations.map(reg => reg._id));
        } else {
            setSelectedRegistrations([]);
        }
    };

    const handleAssignToInstructor = async () => {
        if (selectedRegistrations.length === 0 || !assignInstructor) {
            alert('Please select registrations and an instructor.');
            return;
        }
        try {
            await assignToInstructor({ registrationIds: selectedRegistrations, instructorId: assignInstructor });
            alert(`Assigned ${selectedRegistrations.length} registration(s) successfully!`);
            setSelectedRegistrations([]);
            setAssignInstructor('');
            fetchData();
        } catch (error) {
            alert('Error assigning registrations: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleExport = async () => {
        try {
            const params = {
                level: filterLevel, paymentStatus: filterPaymentStatus, referrer: filterReferrer,
                city: filterCity, mode: filterMode, dateFrom: filterDateFrom, dateTo: filterDateTo
            };
            const response = await exportRegistrations(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'DECODE_Registrations.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            alert('Export successful!');
        } catch (error) {
            alert('Error exporting data: ' + (error.response?.data?.message || error.message));
        }
    };

    const openEditModal = (registration) => {
        setSelectedRegistration(registration);
        setEditForm({
            fullName: registration.fullName, email: registration.email, phone: registration.phone,
            cityCountry: registration.cityCountry, programLevel: registration.programLevel,
            referralSource: registration.referralSource || '', referrerName: registration.referrerName || '',
            mode: registration.mode || '', paymentStatus: registration.paymentStatus || 'Pending',
            paymentMode: registration.paymentMode || null, transactionId: registration.transactionId || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateRegistration(selectedRegistration._id, editForm);
            alert('Registration updated successfully!');
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            alert('Error updating registration: ' + (error.response?.data?.message || error.message));
        }
    };

    const openDeleteModal = (registration) => {
        setSelectedRegistration(registration);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            await deleteRegistration(selectedRegistration._id);
            alert('Registration deleted successfully!');
            setShowDeleteModal(false);
            fetchData();
        } catch (error) {
            alert('Error deleting registration: ' + (error.response?.data?.message || error.message));
        }
    };

    const openAssignModal = (registration) => {
        setSelectedRegistration(registration);
        setSelectedInstructorId(registration.assignedInstructorId?._id || '');
        setShowAssignModal(true);
    };

    const handleAssignInstructor = async (e) => {
        e.preventDefault();
        try {
            await assignToInstructor({ registrationIds: [selectedRegistration._id], instructorId: selectedInstructorId });
            alert('Instructor assigned successfully!');
            setShowAssignModal(false);
            fetchData();
        } catch (error) {
            alert('Error assigning instructor: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="filters">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input" />
                    <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="form-select">
                        <option value="">All Levels</option>
                        {programLevelsOptions.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="form-select">
                        <option value="">All Modes</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                    </select>
                    <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className="form-select">
                        <option value="">All Payment Status</option>
                        {Object.values(PAYMENT_STATUSES).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input type="text" placeholder="Referrer Name" value={filterReferrer} onChange={(e) => setFilterReferrer(e.target.value)} className="form-input" />
                    <input type="text" placeholder="City" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="form-input" />
                    <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="form-input" />
                    <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="form-input" />
                    <button onClick={handleExport} className="btn">Export Excel</button>
                </div>
            </div>

            {selectedRegistrations.length > 0 && (
                <div className="card alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    <p>{selectedRegistrations.length} registration(s) selected</p>
                    <select value={assignInstructor} onChange={(e) => setAssignInstructor(e.target.value)} className="form-select" style={{maxWidth: '200px', marginRight: '1rem'}}>
                        <option value="">Select Instructor</option>
                        {instructors.map(inst => (<option key={inst._id} value={inst._id}>{inst.fullName}</option>))}
                    </select>
                    <button onClick={handleAssignToInstructor} className="btn">Assign Selected</button>
                </div>
            )}

            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox" onChange={handleSelectAll} checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0} /></th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Program Level</th>
                            <th>Batch</th>
                            <th>Instructor</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRegistrations.map(reg => (
                            <tr key={reg._id}>
                                <td><input type="checkbox" checked={selectedRegistrations.includes(reg._id)} onChange={() => handleSelectRegistration(reg._id)} /></td>
                                <td>{reg.fullName}</td>
                                <td>{reg.email}</td>
                                <td>{reg.programLevel}</td>
                                <td>{reg.batchId?.batchCode || 'N/A'}</td>
                                <td>{reg.assignedInstructorId?.fullName || 'Unassigned'}</td>
                                <td><span className={`status-badge status-${reg.paymentStatus.toLowerCase().replace(' ', '-')}`}>{reg.paymentStatus}</span></td>
                                <td>
                                    <button onClick={() => openAssignModal(reg)} className="btn btn-sm">Assign</button>
                                    <button onClick={() => openEditModal(reg)} className="btn btn-sm">Edit</button>
                                    <button onClick={() => openDeleteModal(reg)} className="btn btn-sm btn-danger">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals for Edit, Delete, Assign */}
            {showEditModal && selectedRegistration && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Edit Registration</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="fullName" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="form-input" />
                            </div>
                             <div className="form-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="form-input" />
                            </div>
                             <div className="form-group">
                                <label>City, Country</label>
                                <input type="text" name="cityCountry" value={editForm.cityCountry} onChange={e => setEditForm({...editForm, cityCountry: e.target.value})} className="form-input" />
                            </div>
                             <div className="form-group">
                                <label>Program Level</label>
                                <select name="programLevel" value={editForm.programLevel} onChange={e => setEditForm({...editForm, programLevel: e.target.value})} className="form-select">
                                    <option value="">Select Level</option>
                                    {programLevelsOptions.map(level => <option key={level} value={level}>{level}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Referral Source</label>
                                <input type="text" name="referralSource" value={editForm.referralSource} onChange={e => setEditForm({...editForm, referralSource: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Referrer Name</label>
                                <input type="text" name="referrerName" value={editForm.referrerName} onChange={e => setEditForm({...editForm, referrerName: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Mode</label>
                                <select name="mode" value={editForm.mode} onChange={e => setEditForm({...editForm, mode: e.target.value})} className="form-select">
                                    <option value="">Select Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>
                             <div className="form-group">
                                <label>Payment Status</label>
                                <select name="paymentStatus" value={editForm.paymentStatus} onChange={e => setEditForm({...editForm, paymentStatus: e.target.value})} className="form-select">
                                    {Object.values(PAYMENT_STATUSES).map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Payment Mode</label>
                                <select name="paymentMode" value={editForm.paymentMode} onChange={e => setEditForm({...editForm, paymentMode: e.target.value})} className="form-select">
                                    <option value="">Select Payment Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Transaction ID</label>
                                <input type="text" name="transactionId" value={editForm.transactionId} onChange={e => setEditForm({...editForm, transactionId: e.target.value})} className="form-input" />
                            </div>
                            <div className="flex-group">
                                <button type="submit" className="btn">Save Changes</button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && selectedRegistration && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <p>Are you sure you want to delete <strong>{selectedRegistration.fullName}</strong>?</p>
                        <div className="flex-group">
                            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && selectedRegistration && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Assign Instructor to {selectedRegistration.fullName}</h2>
                        <form onSubmit={handleAssignInstructor}>
                            <div className="form-group">
                                <label>Select Instructor</label>
                                <select value={selectedInstructorId} onChange={e => setSelectedInstructorId(e.target.value)} className="form-select">
                                    <option value="">-- Select Instructor --</option>
                                    {instructors.map(inst => <option key={inst._id} value={inst._id}>{inst.fullName}</option>)}
                                </select>
                            </div>
                            <div className="flex-group">
                                <button type="submit" className="btn">Assign</button>
                                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default RegistrationTable;