const Registration = require('../models/Registration');
const User = require('../models/User');
const Batch = require('../models/Batch');
const excel = require('exceljs');
const bcrypt = require('bcryptjs');

const getAllRegistrations = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, level, mode, paymentStatus, referrer, city, dateFrom, dateTo } = req.query;

        const query = {};

        // Search (Name, Email, Phone)
        if (search) {
            // Note: Email/Phone are encrypted, so we can't reliably regex search them unless we search by hash or decrypt everything (slow).
            // For now, let's search by fullName (unencrypted) and potentially exact match on email if hashed. 
            // Or if we want partial search on encrypted fields, we'd need a different strategy.
            // Requirement says: "Search by Name, Email, Phone".
            // Since email/phone are encrypted, we'll stick to Name for partial, and maybe strict match for others if we hash them.
            // BUT, the current implementation decrypts after find. 
            // Let's rely on regex for fullName. For Email/Phone, if they are encrypted, regex won't work on the DB side.
            // We will search by fullName only for now to keep it efficient, OR we accept that we can't regex search encrypted fields easily without a lookup.
            query.fullName = { $regex: search, $options: 'i' };
        }

        if (level) query.programLevel = { $regex: level, $options: 'i' };
        if (mode) query.mode = mode;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (referrer) query.referrerName = { $regex: referrer, $options: 'i' };
        if (city) query.cityCountry = { $regex: city, $options: 'i' };

        if (dateFrom || dateTo) {
            query.registrationDate = {};
            if (dateFrom) query.registrationDate.$gte = new Date(dateFrom);
            if (dateTo) query.registrationDate.$lte = new Date(dateTo);
        }

        const skip = (page - 1) * limit;

        const [registrations, total] = await Promise.all([
            Registration.find(query)
                .populate('assignedInstructorId', 'fullName email')
                .populate('batchId', 'batchCode')
                .sort({ registrationDate: -1 }) // FIFO / Latest First
                .skip(skip)
                .limit(Number(limit)),
            Registration.countDocuments(query)
        ]);

        res.json({
            success: true,
            registrations,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ success: false, message: 'Error fetching registrations' });
    }
};

const getAllInstructors = async (req, res) => {
    try {
        const instructors = await User.find({ role: 'instructor' }).select('_id fullName email').sort({ fullName: 1 });
        res.json({ success: true, instructors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching instructors' });
    }
};

const updateRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const updateData = req.body;

        // Use find + save to trigger encryption hooks
        const registration = await Registration.findById(registrationId);
        if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

        Object.keys(updateData).forEach(key => {
            registration[key] = updateData[key];
        });

        await registration.save(); // Triggers pre('save') hook

        res.json({ success: true, message: 'Registration updated successfully', registration });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating registration' });
    }
};

const deleteRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const registration = await Registration.findByIdAndDelete(registrationId);
        if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
        res.json({ success: true, message: 'Registration deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting registration' });
    }
};

const assignToInstructor = async (req, res) => {
    try {
        const { registrationIds, instructorId } = req.body;
        const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
        if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });
        await Registration.updateMany({ _id: { $in: registrationIds } }, { $set: { assignedInstructorId: instructorId } });
        res.json({ success: true, message: `Assigned registrations to ${instructor.fullName}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error assigning registrations' });
    }
};

const getStatistics = async (req, res) => {
    try {
        const totalRegistrations = await Registration.countDocuments();
        const assignedRegistrations = await Registration.countDocuments({ assignedInstructorId: { $ne: null } });
        const onlineRegistrations = await Registration.countDocuments({ mode: 'Online Training' });
        const paidRegistrations = await Registration.countDocuments({ paymentStatus: 'Paid' });
        res.json({
            success: true, statistics: {
                totalRegistrations,
                assignedRegistrations,
                unassignedRegistrations: totalRegistrations - assignedRegistrations,
                onlineRegistrations,
                offlineRegistrations: totalRegistrations - onlineRegistrations,
                paidRegistrations,
                pendingRegistrations: totalRegistrations - paidRegistrations
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, fullName, email, password, role } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: 'User with this email or username already exists.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, fullName, email, password: hashedPassword, role });
        await user.save();
        res.status(201).json({ success: true, message: 'User created successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, email, role } = req.body;
        const user = await User.findByIdAndUpdate(userId, { fullName, email, role }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const assignUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ success: true, message: 'User role updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const workbook = new excel.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1); // Assume first sheet

        let successCount = 0;
        let failedCount = 0;
        let errors = [];

        // Fetch all instructors for auto-assignment map
        const instructors = await User.find({ role: 'instructor' }).select('_id fullName');
        const instructorMap = new Map();
        instructors.forEach(inst => {
            if (inst.fullName) {
                instructorMap.set(inst.fullName.toLowerCase().trim(), inst._id);
            }
        });

        // Loop through rows (skip header)
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                rows.push(row);
            }
        });

        for (const row of rows) {
            try {
                // Mapping columns (Adjust indices based on your Excel format)
                // Assuming: Name(1), Email(2), Phone(3), Instructor/Referrer(4), Level(5), Batch(6), Mode(7), Payment(8)
                const fullName = row.getCell(1).value?.toString() || '';
                const email = row.getCell(2).text || row.getCell(2).value?.toString() || '';
                const phone = row.getCell(3).value?.toString() || '';
                const referrerName = row.getCell(4).value?.toString() || '';
                const programLevel = row.getCell(5).value?.toString() || '';
                // batch handled separately? skipping for now or assume simple string
                const mode = row.getCell(7).value?.toString() || 'Online Training';
                const paymentStatus = row.getCell(8).value?.toString() || 'Pending';

                if (!email) continue; // Skip empty rows

                // Auto-Assign Logic
                let assignedInstructorId = null;
                if (referrerName && instructorMap.has(referrerName.toLowerCase().trim())) {
                    assignedInstructorId = instructorMap.get(referrerName.toLowerCase().trim());
                }

                // Check for duplicate using Hash
                const { hashData } = require('../utils/encryption');
                const existing = await Registration.findOne({ emailHash: hashData(email) });
                if (existing) {
                    errors.push(`Row ${row.number}: Email ${email} already exists.`);
                    failedCount++;
                    continue;
                }

                const newReg = new Registration({
                    fullName, email, phone, referrerName, programLevel, mode, paymentStatus,
                    assignedInstructorId
                });

                await newReg.save();
                successCount++;
            } catch (err) {
                errors.push(`Row ${row.number}: ${err.message}`);
                failedCount++;
            }
        }

        res.json({
            success: true,
            successCount,
            failedCount,
            errors
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Error processing Excel file' });
    }
};

const exportRegistrations = async (req, res) => {
    try {
        const { level, mode, paymentStatus, referrer, city, dateFrom, dateTo } = req.query;
        let query = {};

        if (level) query.programLevel = { $regex: level, $options: 'i' };
        if (mode) query.mode = mode;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (referrer) query.referrerName = { $regex: referrer, $options: 'i' };
        if (city) query.cityCountry = { $regex: city, $options: 'i' };

        if (dateFrom || dateTo) {
            query.registrationDate = {};
            if (dateFrom) query.registrationDate.$gte = new Date(dateFrom);
            if (dateTo) query.registrationDate.$lte = new Date(dateTo);
        }

        const registrations = await Registration.find(query).populate('assignedInstructorId', 'fullName');
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Registrations');
        worksheet.columns = [
            { header: 'Full Name', key: 'fullName', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Level', key: 'level', width: 15 },
            { header: 'Program', key: 'program', width: 30 },
            { header: 'City, Country', key: 'cityCountry', width: 25 },
            { header: 'Date', key: 'manualDate', width: 15 },
            { header: 'Trainer Name', key: 'trainerName', width: 25 },
            { header: 'Batch', key: 'batch', width: 20 },
            { header: 'Mode', key: 'mode', width: 15 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        ];
        registrations.forEach(reg => {
            const levelParts = reg.programLevel ? reg.programLevel.split(' – ') : ['N/A', 'N/A'];
            worksheet.addRow({
                ...reg.toObject(),
                level: levelParts[0] || 'N/A',
                program: levelParts[1] || 'N/A',
                manualDate: reg.manualDate ? new Date(reg.manualDate).toLocaleDateString() : 'N/A',
                trainerName: reg.assignedInstructorId?.fullName || reg.referrerName || 'N/A',
                batch: reg.batchId ? reg.batchId.batchCode : 'N/A'
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Error exporting registrations' });
    }
};

module.exports = {
    getAllRegistrations,
    getAllInstructors,
    updateRegistration,
    deleteRegistration,
    assignToInstructor,
    getStatistics,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    assignUserRole,
    uploadExcel,
    exportRegistrations
};