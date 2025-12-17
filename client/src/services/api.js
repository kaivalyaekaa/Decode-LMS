import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const login = (credentials) => api.post('/auth/login', credentials);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const verifyToken = () => api.get('/auth/verify');
export const getCurrentUser = () => api.get('/auth/me');

// Registration (Public)
export const createRegistration = (data) => api.post('/registration', data);
export const studentLogin = (data) => api.post('/student-login', data);

// Instructor
export const getInstructorBatches = () => api.get('/instructors/my-batches');
export const createBatch = (data) => api.post('/instructors/batch', data);
export const moveStudentBatch = (data) => api.put('/instructors/move-student', data);
export const getBatchStudents = (batchId) => api.get(`/instructors/batch-students`, { params: { batchId } });
export const markAttendance = (data) => api.post('/instructors/attendance/mark', data);
export const bulkMarkAttendance = (data) => api.post('/instructors/attendance/bulk', data);
export const getMyStudents = (params) => api.get('/instructors/my-registrations', { params });
export const registerStudentByInstructor = (data) => api.post('/instructors/register-student', data);

// Finance
export const getFinanceRegistrations = (params) => api.get('/finance/registrations', { params });
export const updateRegistrationPayment = (registrationId, data) => api.put(`/finance/registration/${registrationId}/payment`, data);
export const getFinanceStats = () => api.get('/finance/statistics');

// Management
export const getAllRegistrationsStatus = () => api.get('/management/registrations/all');
export const getEligibleRegistrations = () => api.get('/management/registrations/eligible');
export const approveCertificate = (data) => api.post('/management/certificate/approve', data);
export const getManagementStats = () => api.get('/management/statistics');
export const getIssuedCertificates = () => api.get('/management/certificates');
export const createTemplate = (data) => api.post('/management/templates', data);
export const getTemplates = () => api.get('/management/templates');
export const setActiveTemplate = (data) => api.post('/management/templates/set-active', data);

// Registration Admin
export const getRegAdminRegistrations = (params) => api.get('/registration-admin/registrations', { params });
export const getRegAdminInstructors = () => api.get('/registration-admin/instructors');
export const updateRegistration = (registrationId, data) => api.put(`/registration-admin/registration/${registrationId}`, data);
export const deleteRegistration = (registrationId) => api.delete(`/registration-admin/registration/${registrationId}`);
export const assignToInstructor = (data) => api.post('/registration-admin/assign-instructor', data);
export const exportRegistrations = (params) => api.get('/registration-admin/export', { params, responseType: 'blob' });
export const getRegAdminStats = () => api.get('/registration-admin/statistics');
export const uploadExcel = (formData) => api.post('/registration-admin/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Batch Management
export const getAllBatches = () => api.get('/management/batches');
export const getStudentsByBatch = (batchId) => api.get(`/management/batches/${batchId}/students`);
export const downloadBatchCertificates = (batchId) =>
    api.get(`/management/batches/${batchId}/certificates-zip`, { responseType: 'blob' });
export const rejectCertificate = (data) => api.post('/management/reject-certificate', data);

// User Management (Registration Admin)
export const getAllUsers = () => api.get('/registration-admin/users');
export const createUser = (data) => api.post('/registration-admin/users', data);
export const updateUser = (userId, data) => api.put(`/registration-admin/users/${userId}`, data);
export const deleteUser = (userId) => api.delete(`/registration-admin/users/${userId}`);

// Certificate Verification (Public)
export const verifyCertificate = (certNumber) => api.get(`/certificate/verify/${certNumber}`);

export default api;