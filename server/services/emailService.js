const nodemailer = require("nodemailer");
const { SESClient } = require("@aws-sdk/client-ses");


// ---------------------------------------------------------------------------
// PLACEHOLDER / SAFETY CHECK
// ---------------------------------------------------------------------------
const isPlaceholder =
    !process.env.AWS_SES_ACCESS_KEY ||
    !process.env.AWS_SES_SECRET_KEY;


// ---------------------------------------------------------------------------
// TRANSPORTER DECLARATION
// ---------------------------------------------------------------------------
let transporter;


// ---------------------------------------------------------------------------
// MOCK TRANSPORTER (DEV / NO CREDENTIALS)
// ---------------------------------------------------------------------------
if (isPlaceholder) {
    console.warn("⚠️ EMAIL WARNING: AWS SES not configured. Emails will NOT be sent.");

    transporter = {
        sendMail: async (mailOptions) => {
            console.log("---------------------------------------------------");
            console.log("MOCK EMAIL SEND (AWS SES NOT CONFIGURED)");
            console.log("To:", mailOptions.to);
            console.log("Subject:", mailOptions.subject);
            console.log("---------------------------------------------------");
            return { messageId: "MOCK-AWS-SES-ID" };
        },
    };
}


// ---------------------------------------------------------------------------
// AWS SES REAL TRANSPORTER (PRODUCTION)
// ---------------------------------------------------------------------------
else {
    const ses = new SESClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_SES_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SES_SECRET_KEY,
        },
    });

    transporter = nodemailer.createTransport({
        SES: { ses },
    });
}


// ---------------------------------------------------------------------------
// SEND CERTIFICATE EMAIL FUNCTION
// ---------------------------------------------------------------------------
const sendCertificateEmail = async (toEmail, fullName, attachmentPath) => {
    try {
        const info = await transporter.sendMail({
            from: `"Ekaa Decode LMS" <${process.env.EMAIL_FROM}>`,
            to: toEmail,
            subject: "Your Course Completion Certificate – DECODE LMS",
            text: `Dear ${fullName},

Congratulations on completing your program.
Your certificate is attached.

Regards,
Ekaa Team`,
            html: `
        <h3>Congratulations, ${fullName}!</h3>
        <p>You have successfully completed your program.</p>
        <p>Your certificate is attached.</p>
        <br />
        <p>Regards,<br />Ekaa Team</p>
      `,
            attachments: [
                {
                    filename: "Certificate.pdf",
                    path: attachmentPath,
                },
            ],
        });

        console.log("Certificate email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Certificate email error:", error);
        return false;
    }
};


// ---------------------------------------------------------------------------
// SEND OTP EMAIL FUNCTION
// ---------------------------------------------------------------------------
const sendOtpEmail = async (toEmail, otp) => {
    try {
        const info = await transporter.sendMail({
            from: `"Ekaa Security" <${process.env.EMAIL_FROM}>`,
            to: toEmail,
            subject: "Your Login OTP – Ekaa Portal",
            text: `Your OTP is ${otp}. It expires in 10 minutes.`,
            html: `
        <h3>Login Verification</h3>
        <p>Your OTP:</p>
        <h2 style="color:#581c87; letter-spacing:5px;">${otp}</h2>
        <p>Valid for 10 minutes.</p>
      `,
        });

        console.log("OTP email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("OTP email error:", error);
        return false;
    }
};


// ---------------------------------------------------------------------------
// MODULE EXPORTS
// ---------------------------------------------------------------------------
module.exports = {
    sendCertificateEmail,
    sendOtpEmail,
};
