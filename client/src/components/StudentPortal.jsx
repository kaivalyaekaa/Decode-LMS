import React, { useState } from 'react';
import { studentLogin } from '../services/api';

const StudentPortal = () => {
    const [loginData, setLoginData] = useState({ email: '', phone: '' });
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await studentLogin(loginData);
            setStudent(response.data.student);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setStudent(null);
        setLoginData({ email: '', phone: '' });
    };

    const getCertificateUrl = (url) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url}`;
    };

    if (student) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '2.5rem' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                                src="/images/R.png"
                                alt="EKAA Logo"
                                style={{ height: '50px' }}
                            />
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#800080', margin: 0, letterSpacing: '1px' }}>EKAA</h1>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Student Portal</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}>Logout</button>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>Welcome, {student.name}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</label>
                                <div style={{ fontWeight: '600', color: '#374151' }}>{student.email}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone</label>
                                <div style={{ fontWeight: '600', color: '#374151' }}>{student.phone}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Address</label>
                                <div style={{ fontWeight: '600', color: '#374151' }}>{student.countryCity}</div>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem' }}>Your Progress</h3>

                    {student.enrolledPrograms.map((program, pIndex) => (
                        <div key={pIndex} style={{ marginBottom: '2.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#f9fafb', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                                <h4 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>{program.programName}</h4>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#6b7280', fontSize: '0.9rem', fontWeight: '600' }}>Level</th>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#6b7280', fontSize: '0.9rem', fontWeight: '600' }}>Status</th>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#6b7280', fontSize: '0.9rem', fontWeight: '600' }}>Attendance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {program.levels.map((level, lIndex) => (
                                            <tr key={lIndex} style={{ borderBottom: lIndex !== program.levels.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                                <td style={{ padding: '1rem 1.5rem', color: '#374151' }}>Level {level.levelNumber}</td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '999px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500',
                                                        backgroundColor: level.status === 'completed' ? '#dcfce7' : level.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
                                                        color: level.status === 'completed' ? '#166534' : level.status === 'in_progress' ? '#92400e' : '#374151'
                                                    }}>
                                                        {level.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', color: '#374151' }}>{level.attendancePercentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem' }}>Certificates</h3>

                    {student.certificateStatus.isApproved ? (
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                            <h4 style={{ color: '#166534', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Congratulations!</h4>
                            <p style={{ color: '#15803d', marginBottom: '1.5rem' }}>Your certificate has been issued.</p>

                            {student.certificateStatus.certificateUrl ? (
                                <a
                                    href={getCertificateUrl(student.certificateStatus.certificateUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        padding: '0.75rem 2rem',
                                        backgroundColor: '#166534',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 6px rgba(22, 101, 52, 0.2)'
                                    }}
                                >
                                    Download Certificate
                                </a>
                            ) : (
                                <p>Certificate file is being generated. Please check back later.</p>
                            )}
                        </div>
                    ) : (
                        <div style={{ backgroundColor: '#f9fafb', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#6b7280', border: '1px dashed #d1d5db' }}>
                            No certificates issued yet.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '2.5rem' }}>

                {/* Header with Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <img
                            src="/images/R.png"
                            alt="EKAA Logo"
                            style={{ height: '60px' }}
                        />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Student Portal</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Enter your details to view progress</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>Email Address</label>
                        <input
                            type="email"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            placeholder="name@example.com"
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>Phone Number</label>
                        <input
                            type="tel"
                            value={loginData.phone}
                            onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                            required
                            placeholder="Enter your phone number"
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: '#800080',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.8 : 1,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? 'Checking...' : 'View My Status'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentPortal;
