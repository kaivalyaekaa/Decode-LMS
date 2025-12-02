import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'instructor'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await login(formData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                switch (formData.role) {
                    case 'registration_admin': navigate('/registration-admin'); break;
                    case 'instructor': navigate('/instructor'); break;
                    case 'finance': navigate('/finance'); break;
                    case 'management': navigate('/management'); break;
                    default: navigate('/');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/images/R.png" alt="EKAA Logo" style={{ height: '60px', marginBottom: '1rem' }} />
                    <h1>Admin Login</h1>
                    <p>Sign in to manage the portal</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="role">Login As</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} required className="form-select">
                            <option value="registration_admin">Registration Admin</option>
                            <option value="instructor">Instructor</option>
                            <option value="finance">Finance Team</option>
                            <option value="management">Management</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Enter your username" className="form-input" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Enter your password" className="form-input" />
                    </div>

                    <button type="submit" disabled={loading} className="btn" style={{ width: '100%' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <a href="/" style={{ color: 'var(--primary-deep-purple)', textDecoration: 'none', fontWeight: '600' }}>
                        ← Back to Registration
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;