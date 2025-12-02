import React, { useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/api';
import { ROLES } from '../constants'; // Import constants

const UserManagementTable = ({ users, fetchData }) => {
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: ROLES.INSTRUCTOR // Default role
    });

    const openCreateUserModal = () => {
        setIsEditingUser(false);
        setSelectedUser(null);
        setUserForm({ username: '', fullName: '', email: '', password: '', role: ROLES.INSTRUCTOR });
        setShowUserModal(true);
    };

    const openEditUserModal = (user) => {
        setIsEditingUser(true);
        setSelectedUser(user);
        setUserForm({ username: user.username, fullName: user.fullName, email: user.email, password: '', role: user.role });
        setShowUserModal(true);
    };

    const handleUserFormChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditingUser) {
                await updateUser(selectedUser._id, userForm);
                alert('User updated successfully!');
            } else {
                await createUser(userForm);
                alert('User created successfully!');
            }
            setShowUserModal(false);
            fetchData();
        } catch (error) {
            alert('Error saving user: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await deleteUser(userId);
                alert('User deleted successfully!');
                fetchData();
            } catch (error) {
                alert('Error deleting user: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    return (
        <>
            <div className="card">
                <div className="table-header">
                    <h3>User Management ({users.length})</h3>
                    <button onClick={openCreateUserModal} className="btn">
                        + Add New User
                    </button>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td><span className="badge-primary">{user.role}</span></td>
                                    <td>
                                        <button onClick={() => openEditUserModal(user)} className="btn btn-sm">Edit</button>
                                        <button onClick={() => handleDeleteUser(user._id)} className="btn btn-sm btn-danger">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showUserModal && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h2>{isEditingUser ? 'Edit User' : 'Create New User'}</h2>
                        <form onSubmit={handleUserSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" name="username" value={userForm.username} onChange={handleUserFormChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="fullName" value={userForm.fullName} onChange={handleUserFormChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={userForm.email} onChange={handleUserFormChange} required className="form-input" />
                            </div>
                            {!isEditingUser && (
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} required className="form-input" />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role" value={userForm.role} onChange={handleUserFormChange} required className="form-select">
                                    {Object.values(ROLES).map(role => (
                                        <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-group">
                                <button type="submit" className="btn">{isEditingUser ? 'Update User' : 'Create User'}</button>
                                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagementTable;