import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const registerUser = (data) => api.post('/registration', data);
export const login = (credentials) => axios.post('http://localhost:5000/api/auth/login', credentials);
export const verifyToken = () => axios.get('http://localhost:5000/api/auth/verify', {
    headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
    }
});
export const getRegistrations = () => api.get('/registrations');
export const deleteRegistration = (id) => api.delete(`/registration/${id}`);
export const exportRegistrations = async () => {
    try {
        const response = await api.get('/export-excel', {
            responseType: 'blob'
        });

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Ekaa_Registrations.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export Excel file');
    }
};

export default api;

