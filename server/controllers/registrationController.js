const User = require('../models/User'); // Import User model
const Registration = require('../models/Registration');

// Create a new student registration
exports.createRegistration = async (req, res) => {
    try {
        const { fullName, email, phone, cityCountry, programLevel, referralSource, referrerName, mode, region, manualDate } = req.body;

        // Validation
        if (!fullName || !email || !phone || !cityCountry || !programLevel || !mode || !region) {
            return res.status(400).json({
                success: false,
                message: "Full Name, Email, Phone, City/Country, Program Level, Mode, and Region are required."
            });
        }

        const { hashData } = require('../utils/encryption');
        const existingRegistration = await Registration.findOne({ emailHash: hashData(email.toLowerCase()), programLevel: programLevel });
        if (existingRegistration) {
            return res.status(400).json({ success: false, message: 'You have already registered for this program level.' });
        }

        // Auto-Assign Logic
        let assignedInstructorId = null;
        if (referrerName && referrerName.trim()) {
            const instructor = await User.findOne({
                role: 'instructor',
                fullName: { $regex: new RegExp(`^${referrerName.trim()}$`, 'i') } // Case-insensitive exact match
            });
            if (instructor) {
                assignedInstructorId = instructor._id;
            }
        }

        const newRegistration = new Registration({
            fullName,
            email: email.toLowerCase(),
            phone,
            cityCountry,
            programLevel,
            referralSource,
            referrerName,
            mode,
            region,
            manualDate,
            assignedInstructorId // Set the ID
        });

        await newRegistration.save();

        let successMessage = `Thank you for registering! Your registration for ${programLevel} has been received.`;
        // Here you can add region-specific payment logic in the future
        // Payment logic commented out for simple registration flow
        /*
        switch(region) {
            case 'INDIA':
                // initiateRazorpayPayment(newRegistration);
                successMessage += "<br>You will be redirected to Razorpay for payment."
                break;
            case 'UAE':
                // initiateNetworkPayment(newRegistration);
                successMessage += "<br>You will be redirected for payment."
                break;
            case 'USA':
                successMessage += "<br>Our team will contact you shortly regarding payment."
                break;
        }
        */

        res.status(201).json({
            success: true,
            message: successMessage,
            registration: {
                _id: newRegistration._id,
                fullName: newRegistration.fullName,
                email: newRegistration.email,
                programLevel: newRegistration.programLevel,
                region: newRegistration.region
            } // Sanitize response
        });

    } catch (error) {
        console.error("Error creating registration:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get all registrations
exports.getRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ registrationDate: -1 }); // Newest first
        res.status(200).json({ success: true, registrations });
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Delete a registration
exports.deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Registration.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Registration not found" });
        }

        res.status(200).json({ success: true, message: "Registration deleted successfully" });
    } catch (error) {
        console.error("Error deleting registration:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Export to Excel
exports.exportRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ registrationDate: -1 });

        const workbook = new excel.Workbook();
        const sheet = workbook.addWorksheet('DECODE LMS Registrations');

        // Headers
        sheet.columns = [
            { header: 'Sl No', key: 'slNo', width: 10 },
            { header: 'Registration Date', key: 'registrationDate', width: 20 },
            { header: 'Full Name', key: 'fullName', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone No', key: 'phone', width: 15 },
            { header: 'City, Country', key: 'cityCountry', width: 20 },
            { header: 'Program Level', key: 'programLevel', width: 40 },
            { header: 'Referral Source', key: 'referralSource', width: 20 },
            { header: 'Referrer Name', key: 'referrerName', width: 20 },
            { header: 'Mode', key: 'mode', width: 10 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Payment Mode', key: 'paymentMode', width: 15 },
            { header: 'Transaction ID', key: 'transactionId', width: 20 }
        ];

        // Style Headers
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF800080' }
        };

        // Add Data
        registrations.forEach((registration, index) => {
            sheet.addRow({
                slNo: index + 1,
                registrationDate: registration.registrationDate ? registration.registrationDate.toLocaleString() : '',
                fullName: registration.fullName,
                email: registration.email,
                phone: registration.phone,
                cityCountry: registration.cityCountry,
                programLevel: registration.programLevel,
                referralSource: registration.referralSource,
                referrerName: registration.referrerName,
                mode: registration.mode,
                paymentStatus: registration.paymentStatus,
                paymentMode: registration.paymentMode,
                transactionId: registration.transactionId
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=DECODE_LMS_Registrations.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error exporting excel:", error);
        res.status(500).send("Error exporting excel");
    }
};

// Student Login (Check Status)
exports.studentLogin = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ success: false, message: "Email and Phone are required" });
        }

        const { hashData } = require('../utils/encryption');
        // Find by emailHash
        const registration = await Registration.findOne({ emailHash: hashData(email) }).select('fullName email phone programLevel mode paymentStatus certificateStatus batchId');

        // Check phone match (registration.phone is already decrypted by hook)
        if (!registration || registration.phone !== phone) {
            return res.status(404).json({ success: false, message: "Registration not found. Please check your details." });
        }

        res.status(200).json({ success: true, registration });
    } catch (error) {
        console.error("Error logging in student:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

