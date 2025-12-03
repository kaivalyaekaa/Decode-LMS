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
        region: REGIONS.IN, // Default region
        referrerName: ''
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
            } else {
                console.warn(`Invalid program level received from URL: ${decodedProgramLevel}`);
                setResponseMessage('Invalid program level specified. Please select from the available options.');
            }
        }

        if (validatedProgramLevel) {
            setFormData(prev => ({
                ...prev,
                programLevel: validatedProgramLevel,
                mode: modeFromUrl ? decodeURIComponent(modeFromUrl) : prev.mode,
                region: regionFromUrl ? decodeURIComponent(regionFromUrl).toUpperCase() : prev.region
            }));
            setIsPreFilled(true);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
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
        <div className="registration-container">
             <header className="form-header">
                 <img src="/images/R.png" alt="EKAA Logo" className="logo" />
             </header>

            <div className="card form-card">
                {submitted ? (
                    <div className="text-center">
                        <h2>Registration Received!</h2>
                        <p>{responseMessage}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h1 className="form-title">DECODE Registration</h1>
                        {responseMessage && <p className="alert alert-error">{responseMessage}</p>}

                        {isPreFilled && (
                            <div className="prefilled-info alert alert-info">
                                <p><strong>Program:</strong> {formData.programLevel}</p>
                                <p><strong>Mode:</strong> {formData.mode}</p>
                                <p><strong>Region:</strong> {formData.region}</p>
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cityCountry">City, Country</label>
                            <input id="cityCountry" type="text" name="cityCountry" value={formData.cityCountry} onChange={handleChange} required className="form-input" />
                        </div>
                         <div className="form-group">
                            <label htmlFor="referrerName">Trainer Name</label>
                            <input id="referrerName" type="text" name="referrerName" value={formData.referrerName} onChange={handleChange} className="form-input" />
                        </div>

                        <button type="submit" disabled={loading} className="btn primary-btn">
                            {loading ? 'Submitting...' : 'Submit Registration'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RegistrationForm;