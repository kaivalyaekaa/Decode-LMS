const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send certificate email
const sendCertificateEmail = async (recipientEmail, recipientName, certificateUrl, programName, certificateNumber) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"DECODE LMS" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `🎓 Your DECODE LMS Certificate - ${programName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Inter', Arial, sans-serif;
                            background-color: #f3f4f6;
                            margin: 0;
                            padding: 0;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #800080 0%, #6a0dad 100%);
                            padding: 40px 20px;
                            text-align: center;
                            color: #ffffff;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                            font-weight: 700;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .content h2 {
                            color: #800080;
                            margin-top: 0;
                        }
                        .content p {
                            color: #374151;
                            line-height: 1.6;
                            margin: 15px 0;
                        }
                        .certificate-info {
                            background-color: #f3e8ff;
                            border-left: 4px solid #800080;
                            padding: 20px;
                            margin: 25px 0;
                            border-radius: 5px;
                        }
                        .certificate-info p {
                            margin: 8px 0;
                            color: #1f2937;
                        }
                        .certificate-info strong {
                            color: #800080;
                        }
                        .download-btn {
                            display: inline-block;
                            background-color: #800080;
                            color: #ffffff;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            margin: 20px 0;
                            transition: background-color 0.3s;
                        }
                        .download-btn:hover {
                            background-color: #6a0dad;
                        }
                        .footer {
                            background-color: #1f2937;
                            color: #9ca3af;
                            text-align: center;
                            padding: 20px;
                            font-size: 14px;
                        }
                        .certificate-icon {
                            font-size: 50px;
                            margin-bottom: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <div class="certificate-icon">🎓</div>
                            <h1>Congratulations!</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${recipientName},</h2>
                            <p>We are delighted to inform you that your certificate has been approved and is now ready for download!</p>
                            
                            <div class="certificate-info">
                                <p><strong>Program:</strong> ${programName}</p>
                                <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
                                <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>

                            <p>Your certificate has been digitally signed with long-term validation (LTV) to ensure its authenticity and integrity.</p>
                            
                            <center>
                                <a href="${certificateUrl}" class="download-btn">📥 Download Your Certificate</a>
                            </center>

                            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                                <strong>Note:</strong> This certificate is digitally signed and can be verified at any time. 
                                Please keep this email for your records.
                            </p>

                            <p style="margin-top: 30px;">
                                Best regards,<br>
                                <strong>DECODE LMS Team</strong>
                            </p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} DECODE LMS. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Certificate email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending certificate email:', error);
        return { success: false, error: error.message };
    }
};

// Send notification email (for instructors/finance/management)
const sendNotificationEmail = async (recipientEmail, subject, message) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"DECODE LMS" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Inter', Arial, sans-serif;
                            background-color: #f3f4f6;
                            margin: 0;
                            padding: 0;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background-color: #800080;
                            padding: 30px 20px;
                            text-align: center;
                            color: #ffffff;
                        }
                        .content {
                            padding: 30px;
                        }
                        .footer {
                            background-color: #1f2937;
                            color: #9ca3af;
                            text-align: center;
                            padding: 20px;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1>DECODE LMS Notification</h1>
                        </div>
                        <div class="content">
                            ${message}
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} DECODE LMS. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending notification email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendCertificateEmail,
    sendNotificationEmail
};
