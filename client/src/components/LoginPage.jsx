import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyOtp } from '../services/api';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'instructor'
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('login'); // 'login' or 'otp'
    const [userId, setUserId] = useState(null);
    const [maskedEmail, setMaskedEmail] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await login(formData);

            // Case 1: MFA Required (New Flow)
            if (response.data.mfaRequired) {
                setStep('otp');
                setUserId(response.data.userId);
                setMaskedEmail(response.data.emailMasked);

                if (response.data.devOtp) {
                    alert(`DEV MODE OTP: ${response.data.devOtp}`); // Show OTP on screen
                } else {
                    alert(`OTP sent to ${response.data.emailMasked}`);
                }
            }
            // Case 2: Legacy/Direct Login (Fallback if server not restarted or MFA disabled)
            else if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                switch (response.data.user.role) {
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

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await verifyOtp({ userId, otp });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                switch (response.data.user.role) {
                    case 'registration_admin': navigate('/registration-admin'); break;
                    case 'instructor': navigate('/instructor'); break;
                    case 'finance': navigate('/finance'); break;
                    case 'management': navigate('/management'); break;
                    default: navigate('/');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'OTP Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/images/R.png" alt="EKAA Logo" style={{ height: '60px', marginBottom: '1rem' }} />
                    <h1>{step === 'login' ? 'Admin Login' : 'Verify OTP'}</h1>
                    <p>{step === 'login' ? 'Sign in to manage the portal' : `Enter the code sent to ${maskedEmail}`}</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {step === 'login' ? (
                    <form onSubmit={handleLoginSubmit}>
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
                            {loading ? 'Verifying Credentials...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <div className="form-group">
                            <label htmlFor="otp">One-Time Password</label>
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength="6"
                                placeholder="123456"
                                className="form-input"
                                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.5rem' }}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn" style={{ width: '100%' }}>
                            {loading ? 'Verifying OTP...' : 'Verify Login'}
                        </button>

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <button type="button" onClick={() => setStep('login')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}

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