import React, { useState } from 'react';
import { registerUser } from '../services/api';

const RegistrationForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        countryCity: '',
        connectedWith: '',
        selectedTrainings: []
    });
    const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '' });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            if (checked) {
                return { ...prev, selectedTrainings: [...prev.selectedTrainings, value] };
            } else {
                return { ...prev, selectedTrainings: prev.selectedTrainings.filter(t => t !== value) };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await registerUser(formData);
            setPopup({
                show: true,
                type: 'success',
                title: 'Registration Successful !',
                message: response.data.message
            });
            setFormData({
                name: '',
                email: '',
                phone: '',
                countryCity: '',
                connectedWith: '',
                selectedTrainings: []
            });
            // Uncheck all checkboxes visually if needed, though React state handles it
        } catch (error) {
            const msg = error.response?.data?.message || "An unknown error occurred.";
            setPopup({
                show: true,
                type: 'error',
                title: 'Submission Failed',
                message: msg
            });
        }
    };

    const closePopup = () => {
        setPopup({ ...popup, show: false });
    };

    const isChecked = (val) => formData.selectedTrainings.includes(val);

    return (
        <div className="registration-container">
            <div className="card">
                <div className="logo">
                    {/* Assuming images are in public/images */}
                    <img src="/images/R.png" alt="Ekaa Logo" />
                </div>
                <h1 className="form-title"><span>REGISTRATION</span></h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input type="text" id="name" value={formData.name} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" value={formData.email} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="countryCity">Country / City</label>
                        <input type="text" id="countryCity" value={formData.countryCity} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="connectedWith">Who from Team EKAA told you about this program? (optional)</label>
                        <input type="text" id="connectedWith" value={formData.connectedWith} onChange={handleInputChange} />
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>PROGRAM</th>
                                <th> LEVELS & MODULES </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 1. Decode Masterclasses */}
                            <tr className="program-divider">
                                <td className="program-name">DECODE Masterclasses</td>
                                <td className="levels">
                                    <LevelCheckbox value="Decode Masterclasses - for leaders" label="For Leaders" checked={isChecked("Decode Masterclasses - for leaders")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Decode Masterclasses - for health practitioners" label="For Health Practitioners" checked={isChecked("Decode Masterclasses - for health practitioners")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Decode Masterclasses - for teachers and parents" label="For Teachers and Parents" checked={isChecked("Decode Masterclasses - for teachers and parents")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>

                            {/* 2. Decode */}
                            <tr className="program-divider">
                                <td className="program-name">DECODE</td>
                                <td className="levels">
                                    <LevelCheckbox value="Decode - Level 1" label="Level 1 DECODE Your Mind" checked={isChecked("Decode - Level 1")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Decode - Level 2" label="Level 2 DECODE Your Behaviour" checked={isChecked("Decode - Level 2")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Decode - Level 3" label="Level 3 DECODE Your Relationships" checked={isChecked("Decode - Level 3")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Decode - Level 4" label="Level 4 DECODE Your Blueprint" checked={isChecked("Decode - Level 4")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>

                            {/* 3. ICH */}
                            <tr className="program-divider">
                                <td className="program-name">Integrated Clinical Hypnotherapy</td>
                                <td className="levels">
                                    <LevelCheckbox value="Integrated Clinical Hypnotherapy - Level 1" label={<>Level 1 <br />Basic Course</>} checked={isChecked("Integrated Clinical Hypnotherapy - Level 1")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Integrated Clinical Hypnotherapy - Level 2" label="Level 2 Behavioural Resolution" checked={isChecked("Integrated Clinical Hypnotherapy - Level 2")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Integrated Clinical Hypnotherapy - Level 3" label="Level 3 Health Resolution" checked={isChecked("Integrated Clinical Hypnotherapy - Level 3")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Integrated Clinical Hypnotherapy - Level 4" label="Level 4 Spiritual Hypnosis" checked={isChecked("Integrated Clinical Hypnotherapy - Level 4")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Integrated Clinical Hypnotherapy - Level 5" label="Level 5 Integrated Clinical Hypnotherapy" checked={isChecked("Integrated Clinical Hypnotherapy - Level 5")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>

                            {/* 4. Workshops */}
                            <tr className="program-divider">
                                <td className="program-name">Workshops</td>
                                <td className="levels">
                                    <LevelCheckbox value="Workshops - Hidden Colours" label="Hidden Colours" checked={isChecked("Workshops - Hidden Colours")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - The Quest" label="The Quest" checked={isChecked("Workshops - The Quest")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - Circle of Life" label="Circle of Life" checked={isChecked("Workshops - Circle of Life")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - Insomnia" label="Insomnia" checked={isChecked("Workshops - Insomnia")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - Fractals" label="Fractals" checked={isChecked("Workshops - Fractals")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - Koshas" label="Koshas" checked={isChecked("Workshops - Koshas")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - Elemental Currents" label="Elemental Currents" checked={isChecked("Workshops - Elemental Currents")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - The Labyrinth" label="The Labyrinth" checked={isChecked("Workshops - The Labyrinth")} onChange={handleCheckboxChange} />
                                    <LevelCheckbox value="Workshops - Tamas" label="Tamas – Understanding Laws of Karma" checked={isChecked("Workshops - Tamas")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>

                            {/* 5. Born Again */}
                            <tr className="program-divider">
                                <td className="program-name">Born Again</td>
                                <td className="levels">
                                    <LevelCheckbox value="Born Again " label={<>Advanced Program In Inner Child Healing<br />(Eligibility : L5 graduate from EKAA Integrated Clinical Hypnotherapy)</>} checked={isChecked("Born Again ")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>

                            {/* 6. Family Constellation */}
                            <tr className="program-divider">
                                <td className="program-name">Family Constellation</td>
                                <td className="levels">
                                    <LevelCheckbox value="Family Constellation" label="Family Constellation" checked={isChecked("Family Constellation")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>

                            {/* 7. TASSO */}
                            <tr className="program-divider">
                                <td className="program-name">TASSO</td>
                                <td className="levels">
                                    <LevelCheckbox value="Transpersonal Regression Therapy" label="Transpersonal Regression Therapy" checked={isChecked("Transpersonal Regression Therapy")} onChange={handleCheckboxChange} />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button type="submit">Register</button>
                </form>
            </div>

            {popup.show && (
                <div className="popup-overlay">
                    <div className={`popup-box ${popup.type}`}>
                        <h2>{popup.title}</h2>
                        <p dangerouslySetInnerHTML={{ __html: popup.message }}></p>
                        <button onClick={closePopup}>OK</button>
                    </div>
                </div>
            )}

            <footer>&copy; 2025 EKAA. All rights reserved. Made by Kaivalya T V (EKAA Training Institue of Hpynotherapy)</footer>
        </div>
    );
};

const LevelCheckbox = ({ value, label, checked, onChange }) => {
    const handleClick = () => {
        // Create a synthetic event to match what onChange expects
        onChange({ target: { value, checked: !checked } });
    };

    return (
        <div className={`level-checkbox ${checked ? 'is-checked' : ''}`} onClick={handleClick}>
            <input type="checkbox" value={value} checked={checked} onChange={onChange} readOnly />
            <label>{label}</label>
        </div>
    );
};

export default RegistrationForm;
