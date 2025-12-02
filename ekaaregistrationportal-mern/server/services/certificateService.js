const puppeteer = require('puppeteer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const CertificateTemplate = require('../models/CertificateTemplate');

// Generate digital signature hash
const generateDigitalSignature = (data) => {
    const signature = crypto
        .createHash('sha256')
        .update(JSON.stringify(data) + process.env.SIGNATURE_SECRET)
        .digest('hex');
    return signature;
};

// Verify digital signature
const verifyDigitalSignature = (data, signature) => {
    const expectedSignature = generateDigitalSignature(data);
    return expectedSignature === signature;
};

// Generate certificate PDF
const generateCertificatePDF = async (studentData, batch, certificateNumber) => {
    let browser;
    try {
        // Ensure certificates directory exists
        const certificatesDir = path.join(__dirname, '../certificates');
        try {
            await fs.access(certificatesDir);
        } catch {
            await fs.mkdir(certificatesDir, { recursive: true });
        }

        const achievementHtml = `
            For successfully completing the program<br>
            <span class="program-name">${batch.programLevel}</span><br>
            in batch ${batch.batchCode}.
        `;

        // Fetch active template
        const activeTemplate = await CertificateTemplate.findOne({ isActive: true });

        let certificateHTML;

        if (activeTemplate) {
            let templateContent = activeTemplate.htmlContent;
            certificateHTML = templateContent
                .replace(/{{studentName}}/g, studentData.fullName)
                .replace(/{{achievementHtml}}/g, achievementHtml)
                .replace(/{{certificateNumber}}/g, certificateNumber)
                .replace(/{{issueDate}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        } else {
            // Default Template
            certificateHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            width: 297mm; height: 210mm; margin: 0; padding: 0;
            font-family: 'Montserrat', sans-serif;
            background: #fff;
            display: flex; justify-content: center; align-items: center;
        }
        
        .certificate {
            width: 280mm; height: 195mm; background: white;
            position: relative;
            padding: 40px;
            text-align: center;
            color: #333;
        }

        .certificate::before {
            content: ''; position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px;
            border: 2px solid #7A2A87; border-radius: 10px; pointer-events: none; opacity: 0.3;
        }
        
        .header { margin-bottom: 20px; position: relative; }
        
        .ekaa-logo {
            position: absolute; right: 20px; top: 0;
            font-size: 24px; font-weight: bold; color: #7A2A87;
            text-transform: uppercase; letter-spacing: 2px;
        }
        
        .main-title {
            font-family: 'Great Vibes', cursive;
            font-size: 100px;
            color: #7A2A87; /* Purple */
            margin-bottom: 10px;
            line-height: 1.2;
            transform: rotate(-5deg);
            display: inline-block;
        }
        
        .certify-text {
            font-size: 16px; color: #555; margin: 30px 0 10px;
            text-transform: uppercase; letter-spacing: 1px;
        }
        
        .student-name {
            font-size: 52px;
            font-weight: 700;
            color: #7A2A87;
            margin: 10px 0 30px;
            text-transform: capitalize;
        }
        
        .body-text {
            font-size: 18px;
            line-height: 1.6;
            color: #444;
            max-width: 800px;
            margin: 0 auto 40px;
        }
        
        .program-name {
            font-weight: 700;
            color: #333;
        }
        
        .footer {
            margin-top: 60px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 100px;
        }
        
        .signature-block { text-align: center; }
        .sig-name { font-weight: 700; font-size: 18px; color: #333; margin-bottom: 5px; }
        .sig-title { font-size: 14px; color: #666; }
        
        .bottom-decoration {
            position: absolute; bottom: 30px; left: 0; right: 0;
            text-align: center; font-size: 12px; color: #7A2A87;
            border-top: 1px solid #eee; padding-top: 10px;
        }

        .digital-badge {
            position: absolute; top: 30px; left: 30px;
            font-size: 10px; color: #aaa; border: 1px solid #ddd;
            padding: 5px 10px; border-radius: 20px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="digital-badge">Digitally Signed ID: ${certificateNumber}</div>
        <div class="header">
            <div class="ekaa-logo">EKAA</div>
            <h1 class="main-title">Decode</h1>
        </div>
        
        <p class="certify-text">This is to certify that</p>
        
        <h2 class="student-name">${studentData.fullName}</h2>
        
        <div class="body-text">
            ${achievementHtml}
            <br>
            demonstrating commitment to personal growth and self-discovery.
        </div>
        
        <div class="footer">
            <div class="signature-block">
                <div class="sig-name">Yuvraj Kapadia</div>
                <div class="sig-title">Program Facilitator<br>Founder and CEO, EKAA</div>
            </div>
        </div>
        
        <div class="bottom-decoration">
            EKAA Training Institute of Hypnotherapy • Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>
</body>
</html>`;
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(certificateHTML, { waitUntil: 'networkidle0' });

        const pdfFileName = `certificate_${certificateNumber}_${Date.now()}.pdf`;
        const pdfPath = path.join(certificatesDir, pdfFileName);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            landscape: true,
            printBackground: true
        });

        await browser.close();

        return {
            success: true,
            fileName: pdfFileName,
            filePath: pdfPath
        };
    } catch (error) {
        if (browser) await browser.close();
        console.error('Error generating certificate PDF:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateDigitalSignature,
    verifyDigitalSignature,
    generateCertificatePDF
};