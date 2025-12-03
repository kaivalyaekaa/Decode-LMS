const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Note = require('../models/Note');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');

// Get students for a batch with their most recent attendance status
const getBatchStudentsWithAttendance = async (req, res) => {
    try {
        const { batchId } = req.query;
        const instructorId = req.user.userId;

        if (!batchId) {
            return res.status(400).json({ success: false, message: 'Batch ID is required.' });
        }

        const matchStage = {
            batchId: new mongoose.Types.ObjectId(batchId),
            assignedInstructorId: new mongoose.Types.ObjectId(instructorId)
        };

        const students = await Registration.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'attendances',
                    let: { regId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$studentRegistrationId', '$$regId'] },
                                        { $eq: ['$batchId', new mongoose.Types.ObjectId(batchId)] }
                                    ]
                                }
                            }
                        },
                        { $sort: { date: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'latestAttendance'
                }
            },
            {
                $addFields: {
                    attendanceStatus: { $ifNull: [{ $first: '$latestAttendance.status' }, 'Not Marked'] }
                }
            },
            { $sort: { fullName: 1 } }
        ]);

        res.json({ success: true, students });
    } catch (error) {
        console.error('Error fetching students for batch:', error);
        res.status(500).json({ success: false, message: 'Error fetching students.' });
    }
};

// Get attendance records for a student within a specific batch
const getStudentAttendance = async (req, res) => {
    try {
        const { registrationId, batchId } = req.params;

        const attendanceRecords = await Attendance.find({
            studentRegistrationId: registrationId,
            batchId: batchId
        })
            .populate('instructorId', 'fullName')
            .sort({ date: -1 });

        res.json({ success: true, attendance: attendanceRecords });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records'
        });
    }
};

// Mark attendance for a single student
const markAttendance = async (req, res) => {
    try {
        const { registrationId, date, status, batchId } = req.body;
        const instructorId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(registrationId) || !mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format for registration or batch.' });
        }

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }

        if (registration.batchId.toString() !== batchId) {
            return res.status(400).json({ success: false, message: 'Student does not belong to this batch.' });
        }

        const attendance = await Attendance.findOneAndUpdate(
            { studentRegistrationId: registrationId, date: new Date(date), batchId },
            { status, instructorId, programLevel: registration.programLevel },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking attendance'
        });
    }
};

// Bulk mark attendance for multiple students
const bulkMarkAttendance = async (req, res) => {
    try {
        const { attendanceData, date, batchId } = req.body;
        const instructorId = req.user.userId;

        if (!Array.isArray(attendanceData) || !batchId || !date) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data. Requires attendanceData array, batchId, and date.'
            });
        }

        const registrationIds = attendanceData.map(a => a.registrationId);
        const registrations = await Registration.find({
            _id: { $in: registrationIds },
            batchId: batchId // Ensure all students belong to the specified batch
        }).select('_id programLevel');

        if (registrations.length !== registrationIds.length) {
            return res.status(400).json({ success: false, message: 'One or more students do not belong to the specified batch.' });
        }

        const registrationMap = new Map(registrations.map(r => [r._id.toString(), r]));

        const bulkOps = attendanceData.map(record => {
            const registration = registrationMap.get(record.registrationId);
            return {
                updateOne: {
                    filter: { studentRegistrationId: record.registrationId, date: new Date(date), batchId },
                    update: { $set: { status: record.status, instructorId: instructorId, programLevel: registration.programLevel } },
                    upsert: true
                }
            };
        });

        const result = await Attendance.bulkWrite(bulkOps);

        res.json({
            success: true,
            message: 'Bulk attendance marked successfully',
            result
        });
    } catch (error) {
        console.error('Error bulk marking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking bulk attendance'
        });
    }
};

// Register a new student (Instructor only)
const registerStudent = async (req, res) => {
    try {
        const { fullName, email, phone, cityCountry, programLevel, referralSource, referrerName, mode } = req.body;
        const instructorId = req.user.userId;

        // Validation
        if (!fullName || !email || !phone || !cityCountry || !programLevel || !mode) {
            return res.status(400).json({ message: "Full Name, Email, Phone, City/Country, Program Level, and Mode are required." });
        }

        // Duplicate check
        const existingRegistration = await Registration.findOne({ email: email.toLowerCase() });
        if (existingRegistration) {
            return res.status(400).json({ success: false, message: 'A student with this email is already registered.' });
        }

        const newRegistration = new Registration({
            fullName,
            email: email.toLowerCase(),
            phone,
            cityCountry,
            programLevel,
            referralSource: referralSource || 'Instructor',
            referrerName,
            mode,
            registeredBy: instructorId, // Link to instructor
            assignedInstructorId: instructorId // Assign to the instructor who registered them
        });

        await newRegistration.save();
        res.status(201).json({ success: true, message: "Student registered successfully", registration: newRegistration });

    } catch (error) {
        console.error("Error registering student:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get registrations created by the logged-in instructor
const getMyStudents = async (req, res) => {
    try {
        const instructorId = req.user.userId;
        // Fetch students registered by this instructor OR assigned to this instructor
        const registrations = await Registration.find({
            $or: [
                { registeredBy: instructorId },
                { assignedInstructorId: instructorId }
            ]
        }).sort({ registrationDate: -1 });
        res.json({ success: true, registrations });
    } catch (error) {
        console.error("Error fetching my registrations:", error);
        res.status(500).json({ success: false, message: "Error fetching registrations" });
    }
};

// Create a new batch
const createBatch = async (req, res) => {
    try {
        const { batchCode, programLevel, startDate, mode, studentIds } = req.body;
        const instructorId = req.user.userId;

        if (!batchCode || !programLevel || !startDate) {
            return res.status(400).json({ success: false, message: 'Batch Code, Program Level, and Start Date are required.' });
        }

        const newBatch = new Batch({
            batchCode,
            programLevel,
            startDate,
            mode: mode || 'Online',
            instructorId,
            createdBy: instructorId,
            currentStudents: studentIds ? studentIds.length : 0
        });

        await newBatch.save();

        // If students are selected, update their batchId
        if (studentIds && studentIds.length > 0) {
            await Registration.updateMany(
                { _id: { $in: studentIds } },
                { $set: { batchId: newBatch._id, assignedInstructorId: instructorId } }
            );
        }

        res.status(201).json({ success: true, message: 'Batch created successfully', batch: newBatch });
    } catch (error) {
        console.error('Error creating batch:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Batch Code must be unique.' });
        }
        res.status(500).json({ success: false, message: 'Error creating batch' });
    }
};

// Add a note for a student registration
const addStudentNote = async (req, res) => {
    try {
        const { registrationId, noteContent } = req.body;
        const instructorId = req.user.userId;

        if (!registrationId || !noteContent) {
            return res.status(400).json({ message: 'Registration ID and note content are required.' });
        }

        const newNote = new Note({
            studentRegistrationId: registrationId,
            instructorId,
            note: noteContent
        });

        await newNote.save();
        res.status(201).json({ success: true, message: 'Note added successfully', note: newNote });
    } catch (error) {
        console.error('Error adding student note:', error);
        res.status(500).json({ success: false, message: 'Error adding note.' });
    }
};

// Get all notes for a specific student registration
const getStudentNotes = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const notes = await Note.find({ studentRegistrationId: registrationId })
            .populate('instructorId', 'fullName')
            .sort({ createdAt: -1 });

        res.json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching student notes:', error);
        res.status(500).json({ success: false, message: 'Error fetching notes.' });
    }
};

// Get all batches assigned to the logged-in instructor
const getMyBatches = async (req, res) => {
    try {
        const instructorId = req.user.userId;
        const batches = await Batch.find({ instructorId: instructorId }).sort({ startDate: -1 });
        res.json({ success: true, batches });
    } catch (error) {
        console.error('Error fetching instructor batches:', error);
        res.status(500).json({ success: false, message: 'Error fetching batches' });
    }
};

module.exports = {
    getBatchStudentsWithAttendance,
    getStudentAttendance,
    markAttendance,
    bulkMarkAttendance,
    registerStudent,
    getMyStudents,
    addStudentNote,
    getStudentNotes,
    getMyBatches,
    createBatch
};