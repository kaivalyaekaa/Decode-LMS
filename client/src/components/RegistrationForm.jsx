import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createRegistration } from '../services/api';
import { PROGRAM_LEVELS, REGIONS } from '../constants';

const RegistrationForm = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        cityCountry: '',
        programLevel: '',
        mode: '',
        region: REGIONS.IN,
        referrerName: '',
        manualDate: ''
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const [isPreFilled, setIsPreFilled] = useState(false);

    useEffect(() => {
        const programLevelFromUrl = searchParams.get('program');
        const modeFromUrl = searchParams.get('mode');
        const regionFromUrl = searchParams.get('region');

        let validatedProgramLevel = '';
        if (programLevelFromUrl) {
            const decodedProgramLevel = decodeURIComponent(programLevelFromUrl);
            if (PROGRAM_LEVELS.includes(decodedProgramLevel)) {
                validatedProgramLevel = decodedProgramLevel;
            }
        }

        if (validatedProgramLevel) {
            setFormData(prev => ({
                ...prev,
                programLevel: validatedProgramLevel,
                mode: modeFromUrl ? decodeURIComponent(modeFromUrl) : prev.mode,
                region: regionFromUrl
                    ? decodeURIComponent(regionFromUrl).toUpperCase()
                    : prev.region
            }));
            setIsPreFilled(true);
        }
    }, [searchParams]);

    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setResponseMessage('');
        try {
            const res = await createRegistration(formData);
            setSubmitted(true);
            setResponseMessage(res.data?.message || 'Registration successful!');
        } catch (error) {
            setResponseMessage(error.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* INLINE CSS */}
            <style>{`
                .registration-container {
                    display: flex;
                    justify-content: center;
                    padding: 40px 20px;
                    background: linear-gradient(135deg, #EEE9FF, #F6F3FF);
                    min-height: 100vh;
                }

                .form-card {
                    width: 100%;
                    max-width: 870px; /* BIGGER BOX */
                    padding: 32px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 10px 35px rgba(0,0,0,0.12);
                    position: relative;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .logo-top-left {
                    position: absolute;
                    top: 8px;
                    left: 18px;
                    width: 75px;
                    height: auto;
                }

                .form-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    text-align: center;
                    margin-top: 99px;
                    margin-bottom: 20px;
                    color: #4b0082;
                }

                .form-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.4rem;
                }

                .form-group label {
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #333;
                }

                .form-input, 
                .form-select {
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid #cfcfcf;
                    background: #fff;
                    font-size: 1rem;
                }

                .form-input:focus, .form-select:focus {
                    border-color: #7a42f4;
                    box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
                    outline: none;
                }

                .btn-purple {
                    padding: 14px;
                    background: #7A2A87;
                    color: white;
                    font-weight: 600;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    font-size: 1.15rem;
                    transition: 0.25s;
                }

                .btn-purple:hover {
                    background: #6328d9;
                    transform: scale(1.03);
                }

                .btn-purple:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .alert-error {
                    background: #fde7e7;
                    color: #d63030;
                    padding: 12px;
                    border-radius: 10px;
                }

                .alert-info {
                    background: #efe9ff;
                    color: #5a32c9;
                    padding: 12px;
                    border-radius: 10px;
                }

                /* MOBILE */
                @media (max-width: 480px) {
                    .form-card {
                        padding: 22px;
                        max-width: 95%;
                    }
                    .form-title {
                        font-size: 1.5rem;
                    }
                    .logo-top-left {
                        width: 60px;
                    }
                }
            `}</style>

            <div className="registration-container">
                <div className="card form-card">

                    {/* TOP LEFT LOGO */}
                    <img src="/images/R.png" alt="EKAA Logo" className="logo-top-left" />

                    <h1 className="form-title">DECODE Registration</h1>

                    {submitted ? (
                        <div className="text-center">
                            <h2>Registration Received!</h2>
                            <p>{responseMessage}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="form-body">

                            {responseMessage && (
                                <p className="alert-error">{responseMessage}</p>
                            )}

                            {isPreFilled && (
                                <div className="alert-info">
                                    <p><strong>Program:</strong> {formData.programLevel}</p>
                                    <p><strong>Mode:</strong> {formData.mode}</p>
                                    <p><strong>Region:</strong> {formData.region}</p>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    className="form-input"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>City, Country</label>
                                <input
                                    className="form-input"
                                    name="cityCountry"
                                    value={formData.cityCountry}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Trainer Name</label>
                                <input
                                    className="form-input"
                                    name="referrerName"
                                    value={formData.referrerName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    name="manualDate"
                                    value={formData.manualDate}
                                    onChange={handleChange}
                                />
                            </div>

                            {!isPreFilled && (
                                <>
                                    <div className="form-group">
                                        <label>Program Level</label>
                                        <select
                                            className="form-select"
                                            name="programLevel"
                                            value={formData.programLevel}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Program Level</option>
                                            {PROGRAM_LEVELS.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Mode</label>
                                        <select
                                            className="form-select"
                                            name="mode"
                                            value={formData.mode}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Online Training">Online Training</option>
                                            <option value="Offline">Offline</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Region</label>
                                        <select
                                            className="form-select"
                                            name="region"
                                            value={formData.region}
                                            onChange={handleChange}
                                            required
                                        >
                                            {Object.values(REGIONS).map(region => (
                                                <option key={region} value={region}>{region}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* PURPLE BUTTON */}
                            <button type="submit" disabled={loading} className="btn-purple">
                                {loading ? 'Submitting...' : 'Submit Registration'}
                            </button>

                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default RegistrationForm;
