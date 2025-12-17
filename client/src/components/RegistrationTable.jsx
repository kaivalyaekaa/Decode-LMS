import React, { useState, useEffect } from 'react';
import {
    getRegAdminRegistrations, getRegAdminInstructors, updateRegistration,
    deleteRegistration, assignToInstructor, exportRegistrations
} from '../services/api';
import { PROGRAM_LEVELS, PAYMENT_STATUSES } from '../constants'; // Import constants
import PaginationControls from './PaginationControls';

const RegistrationTable = ({
    registrations,
    instructors,
    fetchData,
    pagination,
    onPageChange,
    onLimitChange,
    filters,
    onFilterChange
}) => {
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

    const handleSelectRegistration = (id) => {
        setSelectedRegistrations(prev =>
            prev.includes(id) ? prev.filter(regId => regId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRegistrations(registrations.map(reg => reg._id));
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
            // Use current filters for export
            const response = await exportRegistrations(filters);
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

    const handleFilterChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    return (
        <>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <select value={filters.level || ''} onChange={(e) => handleFilterChange('level', e.target.value)} className="form-select" style={{ flex: 1, minWidth: '150px' }}>
                            <option value="">All Levels</option>
                            {programLevelsOptions.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                        <select value={filters.mode || ''} onChange={(e) => handleFilterChange('mode', e.target.value)} className="form-select" style={{ flex: 1, minWidth: '150px' }}>
                            <option value="">All Modes</option>
                            <option value="Online Training">Online Training</option>
                            <option value="Offline">Offline</option>
                        </select>
                        <select value={filters.paymentStatus || ''} onChange={(e) => handleFilterChange('paymentStatus', e.target.value)} className="form-select" style={{ flex: 1, minWidth: '150px' }}>
                            <option value="">All Payment Status</option>
                            {Object.values(PAYMENT_STATUSES).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <input type="text" placeholder="City" value={filters.city || ''} onChange={(e) => handleFilterChange('city', e.target.value)} className="form-input" style={{ flex: 1, minWidth: '150px' }} />
                        <input type="date" value={filters.dateFrom || ''} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="form-input" style={{ flex: 1, minWidth: '130px' }} />
                        <input type="date" value={filters.dateTo || ''} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="form-input" style={{ flex: 1, minWidth: '130px' }} />
                        <button onClick={handleExport} className="btn" style={{ whiteSpace: 'nowrap' }}>Export Excel</button>
                    </div>
                    <div>
                        <input type="text" placeholder="Search by Name, Email, Phone..." value={filters.search || ''} onChange={(e) => handleFilterChange('search', e.target.value)} className="form-input" style={{ width: '100%' }} />
                    </div>
                </div>
            </div>

            {selectedRegistrations.length > 0 && (
                <div className="card alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    <p>{selectedRegistrations.length} registration(s) selected</p>
                    <select value={assignInstructor} onChange={(e) => setAssignInstructor(e.target.value)} className="form-select" style={{ maxWidth: '200px', marginRight: '1rem' }}>
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
                            <th><input type="checkbox" onChange={handleSelectAll} checked={selectedRegistrations.length === registrations.length && registrations.length > 0} /></th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Level</th>
                            <th>Program</th>
                            <th>City, Country</th>
                            <th>Date</th>
                            <th>Batch</th>
                            <th>Trainer Name</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length === 0 ? (
                            <tr><td colSpan="11" className="text-center">No registrations found.</td></tr>
                        ) : (
                            registrations.map(reg => {
                                const levelParts = reg.programLevel ? reg.programLevel.split(' – ') : ['N/A', 'N/A'];
                                const level = levelParts[0] || 'N/A';
                                const program = levelParts[1] || 'N/A';

                                return (
                                    <tr key={reg._id}>
                                        <td><input type="checkbox" checked={selectedRegistrations.includes(reg._id)} onChange={() => handleSelectRegistration(reg._id)} /></td>
                                        <td>{reg.fullName}</td>
                                        <td>{reg.email}</td>
                                        <td>{level}</td>
                                        <td>{program}</td>
                                        <td>{reg.cityCountry}</td>
                                        <td>{reg.manualDate ? new Date(reg.manualDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>{reg.batchId?.batchCode || 'N/A'}</td>
                                        <td>{reg.assignedInstructorId?.fullName || reg.referrerName || 'N/A'}</td>
                                        <td><span className={`status-badge status-${reg.paymentStatus.toLowerCase().replace(' ', '-')}`}>{reg.paymentStatus}</span></td>
                                        <td>
                                            <div className="action-buttons">
                                                <button onClick={() => openAssignModal(reg)} className="btn btn-sm">Assign</button>
                                                <button onClick={() => openEditModal(reg)} className="btn btn-sm">Edit</button>
                                                <button onClick={() => openDeleteModal(reg)} className="btn btn-sm btn-danger">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {pagination && (
                    <PaginationControls
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={onPageChange}
                        limit={pagination.limit}
                        onLimitChange={onLimitChange}
                        totalRecords={pagination.total}
                    />
                )}
            </div>

            {/* Modals for Edit, Delete, Assign */}
            {showEditModal && selectedRegistration && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>Edit Registration</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="fullName" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>City, Country</label>
                                <input type="text" name="cityCountry" value={editForm.cityCountry} onChange={e => setEditForm({ ...editForm, cityCountry: e.target.value })} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" name="manualDate" value={editForm.manualDate ? new Date(editForm.manualDate).toISOString().split('T')[0] : ''} onChange={e => setEditForm({ ...editForm, manualDate: e.target.value })} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Program Level</label>
                                <select name="programLevel" value={editForm.programLevel} onChange={e => setEditForm({ ...editForm, programLevel: e.target.value })} className="form-select">
                                    <option value="">Select Level</option>
                                    {programLevelsOptions.map(level => <option key={level} value={level}>{level}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Instructor name</label>
                                <input type="text" name="referralSource" value={editForm.referralSource} onChange={e => setEditForm({ ...editForm, referralSource: e.target.value })} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Mode</label>
                                <select name="mode" value={editForm.mode} onChange={e => setEditForm({ ...editForm, mode: e.target.value })} className="form-select">
                                    <option value="">Select Mode</option>
                                    <option value="Online Training">Online Training</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Payment Status</label>
                                <select name="paymentStatus" value={editForm.paymentStatus} onChange={e => setEditForm({ ...editForm, paymentStatus: e.target.value })} className="form-select">
                                    {Object.values(PAYMENT_STATUSES).map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Payment Mode</label>
                                <select name="paymentMode" value={editForm.paymentMode} onChange={e => setEditForm({ ...editForm, paymentMode: e.target.value })} className="form-select">
                                    <option value="">Select Payment Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Transaction ID</label>
                                <input type="text" name="transactionId" value={editForm.transactionId} onChange={e => setEditForm({ ...editForm, transactionId: e.target.value })} className="form-input" />
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