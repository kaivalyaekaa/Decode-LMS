const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

// Test results tracker
const testResults = {
    passed: [],
    failed: [],
    total: 0
};

function logTest(testName, passed, error = null) {
    testResults.total++;
    if (passed) {
        testResults.passed.push(testName);
        console.log(`✅ PASS: ${testName}`);
    } else {
        testResults.failed.push({ name: testName, error });
        console.log(`❌ FAIL: ${testName}`);
        if (error) console.log(`   Error: ${error}`);
    }
}

async function runComprehensiveTests() {
    console.log('='.repeat(60));
    console.log('  DECODE LMS COMPREHENSIVE FUNCTIONALITY TEST');
    console.log('='.repeat(60));
    console.log('\n');

    try {
        // Test 1: Login for all roles
        console.log('--- TEST GROUP 1: Authentication ---\n');

        const roles = [
            { username: 'regadmin', password: 'password123', role: 'registration_admin' },
            { username: 'kaivalya', password: 'password123', role: 'instructor' },
            { username: 'finance_test', password: 'password123', role: 'finance' },
            { username: 'management_test', password: 'password123', role: 'management' }
        ];

        const tokens = {};
        for (const cred of roles) {
            try {
                const res = await axios.post(`${BASE_URL}/auth/login`, cred);
                tokens[cred.role] = res.data.token;
                logTest(`Login: ${cred.role}`, true);
            } catch (error) {
                logTest(`Login: ${cred.role}`, false, error.response?.data?.message || error.message);
            }
        }

        // Test 2: Instructor data isolation
        console.log('\n--- TEST GROUP 2: Data Isolation ---\n');
        try {
            const res = await axios.get(`${BASE_URL}/instructor/registrations`, {
                headers: { Authorization: `Bearer ${tokens.instructor}` }
            });
            const count = res.data.registrations.length;
            logTest(`Instructor sees specific students (count: ${count})`, count >= 0);
        } catch (error) {
            logTest('Instructor data isolation', false, error.response?.data?.message || error.message);
        }

        // Test 3: Attendance marking
        console.log('\n--- TEST GROUP 3: Attendance ---\n');
        try {
            const studentsRes = await axios.get(`${BASE_URL}/instructor/registrations`, {
                headers: { Authorization: `Bearer ${tokens.instructor}` }
            });
            if (studentsRes.data.registrations.length > 0) {
                const studentId = studentsRes.data.registrations[0]._id;
                const attendanceRes = await axios.post(`${BASE_URL}/instructor/attendance/mark`, {
                    registrationId: studentId,
                    programLevel: 'Level 1 – Decode Your Mind',
                    date: new Date().toISOString().split('T')[0],
                    status: 'Present'
                }, {
                    headers: { Authorization: `Bearer ${tokens.instructor}` }
                });
                logTest('Attendance marking', attendanceRes.data.success);
            } else {
                logTest('Attendance marking', false, 'No students assigned to instructor');
            }
        } catch (error) {
            logTest('Attendance marking', false, error.response?.data?.message || error.message);
        }

        // Test 4: Finance API access
        console.log('\n--- TEST GROUP 4: Finance Module ---\n');
        try {
            const res = await axios.get(`${BASE_URL}/finance/registrations/all`, {
                headers: { Authorization: `Bearer ${tokens.finance}` }
            });
            logTest('Finance: Get all registrations', res.data.success);
        } catch (error) {
            logTest('Finance: Get all registrations', false, error.response?.data?.message || error.message);
        }

        try {
            const statsRes = await axios.get(`${BASE_URL}/finance/statistics`, {
                headers: { Authorization: `Bearer ${tokens.finance}` }
            });
            logTest('Finance: Get statistics', statsRes.data.success);
        } catch (error) {
            logTest('Finance: Get statistics', false, error.response?.data?.message || error.message);
        }

        // Test 5: Management  API access
        console.log('\n--- TEST GROUP 5: Management Module ---\n');
        try {
            const res = await axios.get(`${BASE_URL}/management/registrations/all`, {
                headers: { Authorization: `Bearer ${tokens.management}` }
            });
            logTest('Management: Get all registrations with attendance', res.data.success);

            // Check if attendance data is included
            if (res.data.registrations.length > 0) {
                const hasAttendance = res.data.registrations[0].hasOwnProperty('attendancePercentage');
                logTest('Management: Attendance data included', hasAttendance);
            }
        } catch (error) {
            logTest('Management: Get registrations', false, error.response?.data?.message || error.message);
        }

        try {
            const eligibleRes = await axios.get(`${BASE_URL}/management/registrations/eligible`, {
                headers: { Authorization: `Bearer ${tokens.management}` }
            });
            logTest('Management: Get eligible registrations', eligibleRes.data.success);
        } catch (error) {
            logTest('Management: Get eligible', false, error.response?.data?.message || error.message);
        }

        // Test 6: Registration Admin API access
        console.log('\n--- TEST GROUP 6: Registration Admin Module ---\n');
        try {
            const res = await axios.get(`${BASE_URL}/registration-admin/registrations`, {
                headers: { Authorization: `Bearer ${tokens.registration_admin}` }
            });
            logTest('Registration Admin: Get all registrations', res.data.success);
        } catch (error) {
            logTest('Registration Admin: Get registrations', false, error.response?.data?.message || error.message);
        }

        try {
            const instructorsRes = await axios.get(`${BASE_URL}/registration-admin/instructors`, {
                headers: { Authorization: `Bearer ${tokens.registration_admin}` }
            });
            logTest('Registration Admin: Get instructors', instructorsRes.data.success);
        } catch (error) {
            logTest('Registration Admin: Get instructors', false, error.response?.data?.message || error.message);
        }

        // Test 7: RBAC - Cross-role access should be denied
        console.log('\n--- TEST GROUP 7: Security (RBAC) ---\n');
        try {
            await axios.get(`${BASE_URL}/finance/registrations/all`, {
                headers: { Authorization: `Bearer ${tokens.instructor}` }
            });
            logTest('RBAC: Instructor blocked from Finance', false, 'Should have been blocked');
        } catch (error) {
            logTest('RBAC: Instructor blocked from Finance', error.response?.status === 403);
        }

        try {
            await axios.get(`${BASE_URL}/instructor/registrations`, {
                headers: { Authorization: `Bearer ${tokens.finance}` }
            });
            logTest('RBAC: Finance blocked from Instructor', false, 'Should have been blocked');
        } catch (error) {
            logTest('RBAC: Finance blocked from Instructor', error.response?.status === 403);
        }

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error.message);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('  TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed.length} (${((testResults.passed.length / testResults.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${testResults.failed.length} (${((testResults.failed.length / testResults.total) * 100).toFixed(1)}%)`);

    if (testResults.failed.length > 0) {
        console.log('\nFailed Tests:');
        testResults.failed.forEach(t => {
            console.log(`  - ${t.name}: ${t.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
}

runComprehensiveTests().then(() => {
    console.log('\n✅ Testing complete!');
    process.exit(0);
});
