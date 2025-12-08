const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    // Configure with your legitimate SMTP or use Ethereal for testing
    // For now using a placeholder logging mock if ENV not set
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.SMTP_USER || 'test',
        pass: process.env.SMTP_PASS || 'test'
    }
});

const sendCertificateEmail = async (toEmail, fullName, attachmentPath) => {
    try {
        const info = await transporter.sendMail({
            from: '"Ekaa Decode LMS" <no-reply@ekaaportal.com>',
            to: toEmail,
            subject: 'Your Course Completion Certificate - DECODE LMS',
            text: `Dear ${fullName},\n\nCongratulations on completing your course! Please find your certificate attached.\n\nBest Regards,\nEkaa Team`,
            html: `
                <h3>Congratulations, ${fullName}!</h3>
                <p>We are pleased to certify that you have successfully completed your program.</p>
                <p>Your official certificate is attached to this email.</p>
                <br>
                <p>Best Regards,<br>Ekaa Team</p>
            `,
            attachments: [
                {
                    filename: 'Certificate.png',
                    path: attachmentPath
                }
            ]
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendOtpEmail = async (toEmail, otp) => {
    // For Development/Testing only - Log OTP to console
    console.log('---------------------------------------------------');
    console.log(`DEV MODE: Your Login OTP is: ${otp}`);
    console.log('---------------------------------------------------');

    try {
        const info = await transporter.sendMail({
            from: '"Ekaa Security" <no-reply@ekaaportal.com>',
            to: toEmail,
            subject: 'Your Login OTP - Ekaa Portal',
            text: `Your One-Time Password (OTP) for login is: ${otp}\n\nThis code expires in 10 minutes.`,
            html: `
                <h3>Login Verification</h3>
                <p>Your One-Time Password (OTP) is:</p>
                <h2 style="color: #581c87; letter-spacing: 5px;">${otp}</h2>
                <p>This code expires in 10 minutes.</p>
            `
        });
        console.log('OTP sent: %s', info.messageId);

        // For Development/Testing only - Log OTP to console
        console.log('---------------------------------------------------');
        console.log(`DEV MODE: Your Login OTP is: ${otp}`);
        console.log('---------------------------------------------------');

        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
};

module.exports = { sendCertificateEmail, sendOtpEmail };
