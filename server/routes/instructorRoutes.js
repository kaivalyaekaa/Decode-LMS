const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const authMiddleware = require('../middleware/authMiddleware');

const authorize = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.use(authorize('instructor'));

// Student Management
router.post('/register-student', instructorController.registerStudent);
router.put('/move-student', instructorController.moveStudentBatch);
router.get('/my-registrations', instructorController.getMyStudents);

// Batch routes
router.get('/my-batches', instructorController.getMyBatches);
router.post('/batch', instructorController.createBatch);
router.get('/batch-students', instructorController.getBatchStudentsWithAttendance);

// Attendance routes
router.post('/attendance/mark', instructorController.markAttendance);
router.post('/attendance/bulk', instructorController.bulkMarkAttendance);
router.get('/attendance/:registrationId/:batchId', instructorController.getStudentAttendance);

// Notes routes
router.post('/notes', instructorController.addStudentNote);
router.get('/notes/:registrationId', instructorController.getStudentNotes);

module.exports = router;
