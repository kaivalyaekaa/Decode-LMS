const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Check if user is instructor
const isInstructor = (req, res, next) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({ message: 'Access denied. Instructors only.' });
    }
    next();
};

router.use(isInstructor);

// Student Management
router.post('/register-student', instructorController.registerStudent);
router.get('/my-registrations', instructorController.getMyStudents);

// Batch routes
router.get('/my-batches', instructorController.getMyBatches);
router.get('/batch-students', instructorController.getBatchStudentsWithAttendance);

// Attendance routes
router.post('/attendance/mark', instructorController.markAttendance);
router.post('/attendance/bulk', instructorController.bulkMarkAttendance);
router.get('/attendance/:registrationId/:batchId', instructorController.getStudentAttendance);

// Notes routes
router.post('/notes', instructorController.addStudentNote);
router.get('/notes/:registrationId', instructorController.getStudentNotes);

module.exports = router;
