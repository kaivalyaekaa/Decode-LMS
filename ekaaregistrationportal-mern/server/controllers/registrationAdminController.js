const Registration = require('../models/Registration');
const User = require('../models/User');
const Batch = require('../models/Batch');
const excel = require('exceljs');
const bcrypt = require('bcryptjs');

const getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({})
            .populate('assignedInstructorId', 'fullName email')
            .populate('batchId', 'batchCode')
            .sort({ registrationDate: -1 });
        res.json({ success: true, registrations });
    } catch (error) {
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
        const registration = await Registration.findByIdAndUpdate(registrationId, updateData, { new: true });
        if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
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
        const onlineRegistrations = await Registration.countDocuments({ mode: 'Online' });
        const paidRegistrations = await Registration.countDocuments({ paymentStatus: 'Paid' });
        res.json({ success: true, statistics: {
            totalRegistrations,
            assignedRegistrations,
            unassignedRegistrations: totalRegistrations - assignedRegistrations,
            onlineRegistrations,
            offlineRegistrations: totalRegistrations - onlineRegistrations,
            paidRegistrations,
            pendingRegistrations: totalRegistrations - paidRegistrations
        }});
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
    // Logic from previous turn
};

const exportRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find().populate('assignedInstructorId', 'fullName');
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Registrations');
        worksheet.columns = [
            { header: 'Full Name', key: 'fullName', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Program Level', key: 'programLevel', width: 30 },
            { header: 'Instructor', key: 'instructor', width: 30 },
            { header: 'Batch', key: 'batch', width: 20 },
            { header: 'Mode', key: 'mode', width: 15 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        ];
        registrations.forEach(reg => {
            worksheet.addRow({
                ...reg.toObject(),
                instructor: reg.assignedInstructorId ? reg.assignedInstructorId.fullName : 'N/A',
                batch: reg.batchId ? reg.batchId.batchCode : 'N/A'
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
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