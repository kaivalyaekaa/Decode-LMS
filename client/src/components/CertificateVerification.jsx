import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { verifyCertificate } from '../services/api';

const CertificateVerification = () => {
    const { certificateNumber } = useParams();
    const [certId, setCertId] = useState(certificateNumber || '');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (certificateNumber) {
            handleVerify(null, certificateNumber);
        }
    }, [certificateNumber]);

    const handleVerify = async (e, idToVerify) => {
        if (e) e.preventDefault();
        const id = idToVerify || certId;
        if (!id) return;

        setLoading(true);
        setResult(null);
        try {
            const response = await verifyCertificate(id);
            setResult({
                isValid: true,
                message: 'Certificate verified successfully.',
                certificate: response.data.certificate
            });
        } catch (error) {
            setResult({
                isValid: false,
                message: error.response?.data?.message || 'Certificate not found or invalid.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '2.5rem' }}>

                {/* Header with Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <img
                            src="/images/R.png"
                            alt="EKAA Logo"
                            style={{ height: '60px' }}
                        />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Certificate Verification</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Verify the authenticity of a certificate</p>
                </div>

                <form onSubmit={(e) => handleVerify(e)}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            value={certId}
                            onChange={(e) => setCertId(e.target.value)}
                            placeholder="Enter Certificate ID"
                            required
                            style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#800080',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.8 : 1
                            }}
                        >
                            {loading ? '...' : 'Verify'}
                        </button>
                    </div>
                </form>

                {result && (
                    <div style={{
                        padding: '1.5rem',
                        borderRadius: '12px',
                        backgroundColor: result.isValid ? '#f0fdf4' : '#fef2f2',
                        border: result.isValid ? '1px solid #bbf7d0' : '1px solid #fecaca',
                        textAlign: 'center'
                    }}>
                        <h3 style={{
                            color: result.isValid ? '#166534' : '#991b1b',
                            marginTop: 0,
                            marginBottom: '0.5rem',
                            fontSize: '1.25rem'
                        }}>
                            {result.isValid ? '✅ Valid Certificate' : '❌ Invalid Certificate'}
                        </h3>
                        <p style={{ color: result.isValid ? '#15803d' : '#b91c1c', margin: 0 }}>
                            {result.message}
                        </p>

                        {result.isValid && result.certificate && (
                            <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid #bbf7d0', paddingTop: '1rem' }}>
                                <p style={{ margin: '0.5rem 0', color: '#166534' }}><strong>Student:</strong> {result.certificate.studentName}</p>
                                <p style={{ margin: '0.5rem 0', color: '#166534' }}><strong>Program:</strong> {result.certificate.programName}</p>
                                <p style={{ margin: '0.5rem 0', color: '#166534' }}><strong>Issue Date:</strong> {new Date(result.certificate.issueDate).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificateVerification;
