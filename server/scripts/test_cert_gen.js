const { generateCertificateImage, generateCertificateId } = require('../services/certificateService');
const path = require('path');
const fs = require('fs');

const runTest = async () => {
    try {
        console.log('Generating Test Certificate...');

        const mockData = {
            fullName: 'Test Student Name',
            programLevel: 'Level 1 – Decode Your Mind',
            date: '2025-12-08',
            city: 'Mumbai, India',
            trainerName: 'Master Trainer',
            certificateId: 'TEST-D2MP-001',
            validationUrl: 'http://localhost:3000/verify/TEST-D2MP-001'
        };

        const outputPath = await generateCertificateImage(mockData);
        console.log('Certificate generated at:', outputPath);

        if (fs.existsSync(outputPath)) {
            console.log('SUCCESS: File created.');
        } else {
            console.error('FAILURE: File not found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

runTest();
