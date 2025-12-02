const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');
const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const { generateCertificatePDF, generateDigitalSignature } = require('../services/certificateService');
const { sendCertificateEmail, sendNotificationEmail } = require('../services/emailService');

// Get all registrations with their complete status
const getAllRegistrationsStatus = async (req, res) => {
    try {
        const registrations = await Registration.aggregate([
            {
                $lookup: {
                    from: 'batches',
                    localField: 'batchId',
                    foreignField: '_id',
                    as: 'batchInfo'
                }
            },
            {
                $unwind: { path: "$batchInfo", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'attendances',
                    let: { regId: '$_id', batchId: '$batchId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$studentRegistrationId', '$$regId'] },
                                        { $eq: ['$batchId', '$$batchId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'attendanceRecords'
                }
            },
            {
                $addFields: {
                    totalSessions: '$batchInfo.totalSessions',
                    presentSessions: {
                        $size: {
                            $filter: {
                                input: '$attendanceRecords',
                                cond: { $eq: ['$$this.status', 'Present'] }
                            }
                        }
                    },
                     absentSessions: {
                        $size: {
                            $filter: {
                                input: '$attendanceRecords',
                                cond: { $eq: ['$$this.status', 'Absent'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    email: 1,
                    phone: 1,
                    programLevel: 1,
                    paymentStatus: 1,
                    certificateStatus: 1,
                    totalSessions: 1,
                    presentSessions: 1,
                    absentSessions: 1,
                    batchCode: '$batchInfo.batchCode',
                    batchId: '$batchInfo._id'
                }
            },
            { $sort: { registrationDate: -1 } }
        ]);

        res.json({ success: true, registrations });
    } catch (error) {
        console.error('Error fetching registrations status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching registrations status'
        });
    }
};

// Get registrations eligible for certificates
const getEligibleRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.aggregate([
            {
                $match: {
                    paymentStatus: 'Paid',
                    certificateStatus: { $ne: 'Issued' }
                }
            },
            {
                $lookup: {
                    from: 'batches',
                    localField: 'batchId',
                    foreignField: '_id',
                    as: 'batchInfo'
                }
            },
            {
                $unwind: '$batchInfo'
            },
            {
                $lookup: {
                    from: 'attendances',
                    let: { regId: '$_id', batchId: '$batchId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$studentRegistrationId', '$$regId'] },
                                        { $eq: ['$batchId', '$$batchId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'attendanceRecords'
                }
            },
            {
                $addFields: {
                    presentCount: { $size: { $filter: { input: '$attendanceRecords', as: 'att', cond: { $eq: ['$$att.status', 'Present'] } } } },
                    absentCount: { $size: { $filter: { input: '$attendanceRecords', as: 'att', cond: { $eq: ['$$att.status', 'Absent'] } } } },
                }
            },
            {
                $match: {
                    presentCount: { $gt: 0 }, // At least one 'Present'
                    absentCount: 0          // No 'Absent' records
                }
            },
            {
                $project: {
                    fullName: 1, email: 1, programLevel: 1, paymentStatus: 1,
                    batchInfo: 1, batchId: 1, presentCount: 1, absentCount: 1
                }
            },
            { $sort: { registrationDate: -1 } }
        ]);

        res.json({ success: true, registrations });
    } catch (error) {
        console.error('Error fetching eligible registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching eligible registrations'
        });
    }
};


// Get issued certificates
const getIssuedCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({})
            .populate('studentRegistrationId', 'fullName email phone')
            .populate('approvedBy', 'fullName email')
            .sort({ issueDate: -1 });

        res.json({ success: true, certificates });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching certificates'
        });
    }
};

// Approve and issue certificate
const approveCertificate = async (req, res) => {
    try {
        const { registrationId, batchId, notes } = req.body;
        const managementId = req.user.userId;

        if (!registrationId || !batchId) {
            return res.status(400).json({ success: false, message: 'Registration ID and Batch ID are required.' });
        }

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }

        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found.' });
        }

        if (registration.paymentStatus !== 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment not completed.' });
        }

        // Attendance Check: At least one 'Present' and no 'Absent'
        const attendanceRecords = await Attendance.find({ studentRegistrationId: registrationId, batchId: batchId });
        const isPresent = attendanceRecords.some(att => att.status === 'Present');
        const isAbsent = attendanceRecords.some(att => att.status === 'Absent');

        if (!isPresent || isAbsent) {
            return res.status(400).json({ success: false, message: 'Attendance criteria not met. Student must be marked "Present" for at least one session and have no "Absent" marks.' });
        }

        const existingCertificate = await Certificate.findOne({
            studentRegistrationId: registrationId,
            programLevel: batch.programLevel
        });

        if (existingCertificate) {
            return res.status(400).json({ success: false, message: `Certificate already issued for ${batch.programLevel}.` });
        }

        const certificateNumber = `DECODE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const pdfResult = await generateCertificatePDF(registration, batch, certificateNumber);

        if (!pdfResult.success) {
            return res.status(500).json({ success: false, message: 'Error generating certificate PDF', error: pdfResult.error });
        }

        const signatureData = {
            studentRegistrationId: registration._id,
            batchId: batch._id,
            certificateNumber,
            issueDate: new Date()
        };
        const digitalSignature = generateDigitalSignature(signatureData);

        const certificateUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/certificates/${pdfResult.fileName}`;
        const validationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate/${certificateNumber}`;

        const certificate = new Certificate({
            studentRegistrationId: registration._id,
            certificateNumber,
            programLevel: batch.programLevel,
            issueDate: new Date(),
            certificateUrl,
            digitalSignatureHash: digitalSignature,
            approvedBy: managementId,
            validationUrl
        });
        await certificate.save();

        registration.certificateStatus = 'Issued';
        registration.certificateIssuedDate = new Date();
        registration.managementNotes = notes || '';
        await registration.save();
        
        // AUTOMATED EMAIL SENDING IS COMMENTED OUT AS PER REQUIREMENTS
        /*
        try {
            await sendCertificateEmail(
                registration.email,
                registration.fullName,
                certificateUrl,
                batch.programLevel,
                certificateNumber
            );
            certificate.emailStatus = { sent: true, sentDate: new Date(), recipientEmail: registration.email };
            await certificate.save();
        } catch (emailError) {
            console.error('Failed to send certificate email:', emailError);
            // Even if email fails, the certificate is still issued.
        }
        */

        res.json({
            success: true,
            message: 'Certificate approved and issued successfully',
            certificate
        });
    } catch (error) {
        console.error('Error approving certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving certificate',
            error: error.message
        });
    }
};

// ... (rest of the file is the same)
// Resend certificate email
const resendCertificateEmail = async (req, res) => {
    try {
        const { certificateId } = req.body;

        const certificate = await Certificate.findById(certificateId)
            .populate('studentRegistrationId', 'fullName email'); // Changed from studentId

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // const emailResult = await sendCertificateEmail(
        //     certificate.studentRegistrationId.email, // Changed from studentId.email
        //     certificate.studentRegistrationId.fullName, // Changed from studentId.name
        //     certificate.certificateUrl,
        //     certificate.programLevel, // Changed from programName
        //     certificate.certificateNumber
        // );

        // Mock success
        const emailResult = { success: true };

        if (emailResult.success) {
            certificate.emailStatus = {
                sent: false, // Marked as false
                sentDate: new Date(),
                recipientEmail: certificate.studentRegistrationId.email
            };
            await certificate.save();

            res.json({
                success: true,
                message: 'Certificate email resend skipped (functionality disabled)'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error sending email',
                error: emailResult.error
            });
        }
    } catch (error) {
        console.error('Error resending certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending certificate email'
        });
    }
};

// Verify certificate
const verifyCertificate = async (req, res) => {
    try {
        const { certificateNumber } = req.params;

        const certificate = await Certificate.findOne({ certificateNumber })
            .populate('studentRegistrationId', 'fullName email') // Changed from studentId
            .populate('approvedBy', 'fullName');

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        res.json({
            success: true,
            certificate: {
                certificateNumber: certificate.certificateNumber,
                studentName: certificate.studentRegistrationId.fullName, // Changed from studentId.name
                programLevel: certificate.programLevel, // Changed from programName
                issueDate: certificate.issueDate,
                approvedBy: certificate.approvedBy.fullName,
                digitalSignature: certificate.digitalSignatureHash,
                validationUrl: certificate.validationUrl,
                isValid: true
            }
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying certificate'
        });
    }
};

// Get dashboard statistics
const getDashboardStatistics = async (req, res) => {
    try {
        const totalRegistrations = await Registration.countDocuments(); // Changed from totalStudents
        const paidRegistrations = await Registration.countDocuments({ paymentStatus: 'Paid' }); // Changed from paidStudents
        const certificatesIssued = await Certificate.countDocuments();
        const pendingApprovals = await Registration.countDocuments({ // Changed from Student
            paymentStatus: 'Paid',
            certificateStatus: { $ne: 'Issued' } // Changed from isApproved: false
        });

        const stats = {
            totalRegistrations, // Changed from totalStudents
            paidRegistrations, // Changed from paidStudents
            certificatesIssued,
            pendingApprovals,
            certificateIssuanceRate: totalRegistrations > 0 ? ((certificatesIssued / totalRegistrations) * 100).toFixed(2) : 0
        };

        res.json({ success: true, statistics: stats });
    }
     catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
};

// Revoke certificate (if needed)
const revokeCertificate = async (req, res) => {
    try {
        const { certificateId, reason } = req.body;

        const certificate = await Certificate.findById(certificateId);
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Update registration status
        await Registration.updateOne( // Changed from Student.updateOne
            { _id: certificate.studentRegistrationId }, // Changed from certificate.studentId
            {
                $set: {
                    certificateStatus: 'Revoked', // Changed from isApproved: false
                    managementNotes: `Revoked: ${reason}`
                }
            }
        );

        // Delete or mark certificate as revoked
        await Certificate.deleteOne({ _id: certificateId });

        res.json({
            success: true,
            message: 'Certificate revoked successfully'
        });
    } catch (error) {
        console.error('Error revoking certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error revoking certificate'
        });
    }
};

// Template Management
const createTemplate = async (req, res) => {
    try {
        const { name, htmlContent } = req.body;
        const template = await CertificateTemplate.create({
            name,
            htmlContent,
            createdBy: req.user.userId
        });
        res.status(201).json({ success: true, template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTemplates = async (req, res) => {
    try {
        const templates = await CertificateTemplate.find().sort('-createdAt');
        res.json({ success: true, templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const setActiveTemplate = async (req, res) => {
    try {
        const { templateId } = req.body;

        // Deactivate all
        await CertificateTemplate.updateMany({}, { isActive: false });

        // Activate selected
        const template = await CertificateTemplate.findByIdAndUpdate(
            templateId,
            { isActive: true },
            { new: true }
        );

        res.json({ success: true, template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllRegistrationsStatus,
    getEligibleRegistrations,
    getIssuedCertificates,
    approveCertificate,
    resendCertificateEmail,
    verifyCertificate,
    getDashboardStatistics,
    revokeCertificate,
    createTemplate,
    getTemplates,
    setActiveTemplate
};
