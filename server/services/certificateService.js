const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Generate Unique ID: D2MP150126OF001
const generateCertificatePrefix = (registration) => {
    // 1. Level (e.g. "Level 1" -> "1")
    const levelMatch = registration.programLevel.match(/\d+/);
    const level = levelMatch ? levelMatch[0] : '1';

    // 2. Trainer Code
    let trainerName = registration.referrerName || 'Certified Trainer';
    if (registration.assignedInstructorId && registration.assignedInstructorId.fullName) {
        trainerName = registration.assignedInstructorId.fullName;
    }

    const nameParts = trainerName.trim().split(/\s+/);
    const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : 'X';
    const secondInitial = nameParts.length > 1 ? nameParts[1][0].toUpperCase() : (nameParts[0].length > 1 ? nameParts[0][1].toUpperCase() : 'X');
    const trainerCode = `${firstInitial}${secondInitial}`;

    // 3. Date in DDMMYY format (Issue Date)
    const dateObj = new Date();
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;

    // 4. Mode (ON/OF)
    const modeStr = (registration.mode || 'offline').toLowerCase().startsWith('on') ? 'ON' : 'OF';

    return `D${level}${trainerCode}${dateStr}${modeStr}`;
};

// Generate Unique ID: D<LEVEL><TRAINER_CODE><ddmmyy><MODE><COUNT>
const generateCertificateId = (registration, series = '001') => {
    const prefix = generateCertificatePrefix(registration);
    const seriesStr = String(series).padStart(4, '0');
    return `${prefix}${seriesStr}`;
};

const generateCertificatePdf = async (data) => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    console.log('[CertificateService] Generating PDF using NEW GEORGIA TEMPLATE for:', data.certificateId);

    // Read Logo as base64
    const logoPath = path.join(__dirname, '../certificates/logo_final.png');
    // Fallback to template if logo doesn't exist, or just silence error
    let logoDataUri = '';
    if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
        logoDataUri = `data:image/png;base64,${logoBase64}`;
    }

    // Generate QR Code
    const qrCodeDataUri = await QRCode.toDataURL(data.validationUrl);

    // Parse Program Level for Template: "Level 1 – Decode Your Mind" -> Level="Level 1", Name="Decode Your Mind"
    let levelText = data.programLevel || '';
    let programName = 'DECODE Program';

    if (data.programLevel && data.programLevel.includes('–')) {
        const parts = data.programLevel.split('–');
        levelText = parts[0].trim(); // "Level 1"
        programName = parts[1].trim(); // "Decode Your Mind"
    } else if (data.programLevel) {
        // Fallback if no dash
        levelText = data.programLevel;
    }

    // Using User's New HTML Structure
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <title>DECODE Certificate</title>

        <style>
            @page {
                size: A4;
                margin: 0;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: "Georgia", serif;
                background: #ffffff;
            }

            .certificate {
                width: 794px;
                height: 1123px;
                margin: auto;
                padding: 60px 70px;
                box-sizing: border-box;
                position: relative;
                border-top: 10px solid #7a2a87;
                border-bottom: 10px solid #7a2a87;
            }

            /* Header */
            .header {
                text-align: center;
                margin-bottom: 20px;
            }

            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #7a2a87;
                margin-bottom: 10px;
            }

            .decode-title {
                font-size: 64px;
                font-weight: 800;
                letter-spacing: 3px;
                color: #7a2a87;
                margin: 10px 0;
            }

            .subtitle {
                font-size: 28px;
                color: #7a2a87;
                font-style: italic;
                margin-bottom: 40px;
            }

            /* Body Text */
            .content {
                text-align: center;
                font-size: 20px;
                line-height: 1.8;
                color: #000;
            }

            .student-name {
                font-size: 36px;
                font-weight: bold;
                color: #7a2a87;
                margin: 20px 0 10px;
                border-bottom: 2px solid #7a2a87;
                display: inline-block;
                padding-bottom: 5px;
                min-width: 400px;
            }

            .program-name {
                font-size: 26px;
                font-weight: bold;
                margin-top: 10px;
            }

            /* Trainer */
            .trainer-section {
                margin-top: 80px;
                text-align: center;
            }

            .trainer-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .trainer-title {
                font-size: 14px;
                letter-spacing: 1px;
            }

            /* Footer */
            .footer {
                position: absolute;
                bottom: 30px;
                left: 70px;
                right: 70px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
            }

            .ucid {
                font-weight: bold;
            }

            .seal {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 4px solid #c9a14a;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #c9a14a;
                font-weight: bold;
            }
        </style>
        </head>

        <body>
            <div class="certificate">

                <!-- HEADER -->
                <div class="header">
                    <div class="logo">EKAA</div>
                    <div class="decode-title">DECODE</div>
                    <div class="subtitle">Certificate Of Participation</div>
                </div>

                <!-- CONTENT -->
                <div class="content">
                    <p>This is to certify that</p>

                    <div class="student-name">
                        ${data.fullName}
                    </div>

                    <p>
                        has successfully completed <strong>${levelText}</strong> Program
                    </p>

                    <div class="program-name">
                        ${programName}
                    </div>

                    <p>
                        on <strong>${data.date}</strong> in <strong>${data.city}</strong>
                    </p>
                </div>

                <!-- TRAINER -->
                <div class="trainer-section">
                    <div class="trainer-name">${data.trainerName}</div>
                    <div class="trainer-title">EKAA DECODE TRAINER</div>
                </div>

                <!-- FOOTER -->
                <div class="footer">
                    <div class="ucid">
                        UCID: ${data.certificateId}
                    </div>

                    <div class="seal">
                        <img src="${qrCodeDataUri}" width="70" height="70" style="object-fit:contain;" />
                    </div>
                </div>

            </div>
        </body>
        </html>
    `;

    await page.setContent(htmlContent);
    // Explicitly wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // A4 Size @ 96 DPI is approx 794 x 1123
    // await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 }); // Not needed for PDF

    const outputDir = path.join(__dirname, '../certificates');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const fileName = `CERT-${data.certificateId}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px'
        }
    });

    await browser.close();

    return outputPath;
};

module.exports = { generateCertificateId, generateCertificatePdf, generateCertificatePrefix };