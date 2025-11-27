import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRegistrations, exportRegistrations, deleteRegistration, verifyToken } from '../services/api';

const AdminPanel = () => {
    const [registrations, setRegistrations] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [filters, setFilters] = useState({ search: '', program: '', date: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 10 });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [registrations, filters]);

    const checkAuth = async () => {
        try {
            await verifyToken();
            fetchData();
        } catch (error) {
            console.error("Auth failed", error);
            localStorage.removeItem('adminToken');
            navigate('/admin-login');
        }
    };

    const fetchData = async () => {
        try {
            const response = await getRegistrations();
            setRegistrations(response.data);
        } catch (error) {
            console.error("Error fetching data", error);
            if (error.response?.status === 401) {
                localStorage.removeItem('adminToken');
                navigate('/admin-login');
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteRegistration(id);
            setDeleteConfirm({ show: false, id: null, name: '' });
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error deleting registration", error);
            alert("Failed to delete registration");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin-login');
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value.toLowerCase() }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const applyFilters = () => {
        let rows = registrations;
        if (filters.search) {
            rows = rows.filter(r =>
                Object.values(r).some(val => String(val).toLowerCase().includes(filters.search))
            );
        }
        if (filters.program) {
            rows = rows.filter(r => r.selectedTrainings && r.selectedTrainings.toLowerCase().includes(filters.program));
        }
        if (filters.date) {
            rows = rows.filter(r => r.createdAt && r.createdAt.includes(filters.date));
        }
        setFilteredRows(rows);
    };

    // Pagination Logic
    const indexOfLastRow = pagination.currentPage * pagination.rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - pagination.rowsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredRows.length / pagination.rowsPerPage);

    return (
        <div className="admin-container">
            <div className="card" style={{ maxWidth: '1400px' }}>
                <div className="header-row">
                    <img src="/images/R.png" alt="Ekaa Logo" />
                    <h1>Admin Panel</h1>
                </div>

                <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <button className="refresh-btn" onClick={fetchData}>Refresh Data</button>
                    <button className="refresh-btn" onClick={exportRegistrations}>Download Excel</button>
                    <button className="refresh-btn" onClick={handleLogout} style={{ backgroundColor: '#c00' }}>Logout</button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        id="search"
                        placeholder="Search anything..."
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem', flex: '1', minWidth: '150px' }}
                        onChange={handleFilterChange}
                    />
                    <select
                        id="program"
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem', flex: '1', minWidth: '150px' }}
                        onChange={handleFilterChange}
                    >
                        <option value="">Filter by Program</option>
                        {[...new Set(registrations.map(r => r.selectedTrainings))].map((prog, idx) => (
                            <option key={idx} value={prog}>{prog}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        id="date"
                        placeholder="dd-mm-yyyy"
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem', width: '150px' }}
                        onChange={handleFilterChange}
                    />
                    <select
                        id="rowsPerPage"
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem', width: '120px' }}
                        onChange={(e) => setPagination({ ...pagination, rowsPerPage: Number(e.target.value), currentPage: 1 })}
                    >
                        <option value="10">10 rows</option>
                        <option value="20">20 rows</option>
                        <option value="50">50 rows</option>
                    </select>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sl No</th>
                                <th>Submitted On</th>
                                <th>Program</th>
                                <th>Country / City</th>
                                <th>Connected With</th>
                                <th>Name</th>
                                <th>Phone No</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((reg, index) => (
                                <tr key={reg._id || index}>
                                    <td>{indexOfFirstRow + index + 1}</td>
                                    <td>{reg.createdAt}</td>
                                    <td>{reg.selectedTrainings}</td>
                                    <td>{reg.countryCity}</td>
                                    <td>{reg.connectedWith}</td>
                                    <td>{reg.name}</td>
                                    <td>{reg.phone}</td>
                                    <td>{reg.email}</td>
                                    <td>
                                        <button
                                            onClick={() => setDeleteConfirm({ show: true, id: reg._id, name: reg.name })}
                                            style={{
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {currentRows.length === 0 && (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <button
                        className="refresh-btn"
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        style={{ opacity: pagination.currentPage === 1 ? 0.5 : 1 }}
                    >
                        Prev
                    </button>
                    <span style={{ fontWeight: 'bold' }}>Page {pagination.currentPage} of {totalPages || 1}</span>
                    <button
                        className="refresh-btn"
                        disabled={pagination.currentPage === totalPages || totalPages === 0}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        style={{ opacity: (pagination.currentPage === totalPages || totalPages === 0) ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            </div >

            {/* Delete Confirmation Modal */}
            {
                deleteConfirm.show && (
                    <div className="popup-overlay">
                        <div className="popup-box error">
                            <h2>Confirm Delete</h2>
                            <p>Are you sure you want to delete the registration for <strong>{deleteConfirm.name}</strong>?</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    style={{ backgroundColor: '#dc3545' }}
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                                    style={{ backgroundColor: '#6c757d' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <footer>&copy; 2025 EKAA. All rights reserved.</footer>
        </div >
    );
};


export default AdminPanel;
