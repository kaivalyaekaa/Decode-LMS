const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');
const dotenv = require('dotenv');

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        const users = [
            {
                username: 'instructor',
                password: 'password123',
                role: 'instructor',
                fullName: 'John Instructor',
                email: 'instructor@decode.com'
            },
            {
                username: 'finance',
                password: 'password123',
                role: 'finance',
                fullName: 'Jane Finance',
                email: 'finance@decode.com'
            },
            {
                username: 'management',
                password: 'password123',
                role: 'management',
                fullName: 'Boss Management',
                email: 'management@decode.com'
            },
            {
                username: 'regadmin',
                password: 'password123',
                role: 'registration_admin',
                fullName: 'Registration Admin',
                email: 'regadmin@decode.com'
            }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({
                ...user,
                password: hashedPassword
            });
        }

        console.log('Created users: instructor, finance, management, regadmin (password: password123)');

        // Create a dummy student for testing if none exist
        const studentCount = await Student.countDocuments();
        if (studentCount === 0) {
            const student = new Student({
                name: "Test Student",
                email: "student@test.com",
                phone: "1234567890",
                countryCity: "India/Mumbai",
                connectedWith: "Website",
                selectedTrainings: "DECODE Masterclasses",
                enrolledPrograms: [{
                    programName: "DECODE Masterclasses",
                    levels: [
                        { levelNumber: 1, status: 'not_started', attendancePercentage: 0 },
                        { levelNumber: 2, status: 'not_started', attendancePercentage: 0 },
                        { levelNumber: 3, status: 'not_started', attendancePercentage: 0 },
                        { levelNumber: 4, status: 'not_started', attendancePercentage: 0 }
                    ]
                }],
                paymentStatus: {
                    isPaid: false,
                    amount: 0
                },
                certificateStatus: {
                    isApproved: false,
                    emailSent: false
                }
            });
            await student.save();
            console.log('Created dummy student');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedUsers();
