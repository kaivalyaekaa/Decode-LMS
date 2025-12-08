const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Generate Unique ID: D2MP150126OF001
const generateCertificateId = (registration) => {
    // Level Map
    const levelMap = {
        'A Level': 'A', 'B Level': 'B', 'C Level': 'C', 'D Level': 'D'
    };
    const levelCode = levelMap[registration.programLevel] || 'X';

    // Program Code (assuming "Decode" is the main program, used 'D' but user showed '2M' likely for 'Level 2'?)
    // Aligning with user example: "D2MP..." 
    // Let's assume user example "D2MP150126OF001" breaks down as:
    // D2M (User said "Code", likely Level/Module) + P (Program) + Date + Mode + Seq
    // I will use a simple mapping for now based on available data.

    // Using a simplified robust format if exact mapping unknown:
    // [Level 1char] + [Program 1char] + [Date 6char] + [Mode 2char] + [Seq 3char]
    // Example: A (Level) + D (Decode) + 241208 (Date) + OF (Offline) + 001

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const modeCode = registration.mode.toLowerCase().includes('online') ? 'ON' : 'OF';

    // Sequence (Random 3 digits for now, ideal is DB counter)
    const sequence = Math.floor(Math.random() * 900) + 100;

    return `${levelCode}D${dateStr}${modeCode}${sequence}`;
};

const generateCertificateImage = async (data) => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

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

    // Using User's Exact HTML Structure
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Certificate of Participation</title>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    font-family: 'Poppins', sans-serif;
                }
                .container {
                    padding: 30px 50px;
                    text-align: center;
                    position: relative; /* For absolute positioning of elements like QR */
                }
                .logo {
                    margin-top: 20px;
                    /* height: 120px; Remove fixed height to let img scale or set max-height */
                }
                .decode-bg {
                    font-size: 140px;
                    font-weight: 700;
                    color: rgba(150, 75, 150, 0.18);
                    letter-spacing: 8px;
                    margin-top: -40px;
                    position: relative; 
                    z-index: 0;
                }
                .decode-text {
                    font-size: 65px;
                    font-weight: 700;
                    color: #7A2A87;
                    letter-spacing: 4px;
                    margin-top: -140px; /* Overlap effect */
                    position: relative;
                    z-index: 1;
                }
                h1.title {
                    font-family: 'Playfair Display', serif;
                    font-size: 38px;
                    font-weight: 400;
                    color: #7A2A87;
                    margin-top: 10px;
                    margin-bottom: 20px;
                }
                .subtitle {
                    font-size: 18px;
                    margin-top: 20px;
                }
                .name {
                    font-size: 42px;
                    font-weight: 700;
                    color: #7A2A87;
                    margin: 20px 0;
                }
                .line {
                    width: 60%;
                    height: 2px;
                    background: #7A2A87;
                    margin: 10px auto 25px auto;
                }
                .program {
                    font-size: 32px;
                    font-weight: 700;
                    color: #000;
                    margin: 10px 0;
                }
                .footer {
                    margin-top: 40px;
                    font-size: 18px;
                    font-weight: 600;
                }
                .trainer-role {
                    font-size: 16px;
                    margin-top: 5px;
                }
                .bottom-bar {
                    margin-top: 40px;
                    width: 100%;
                    height: 12px;
                    background: #7A2A87;
                    border-bottom: 6px solid #CFAF4E;
                }
                .ucid {
                    font-size: 14px;
                    margin-top: 20px;
                    text-align: left;
                }
                .seal {
                    margin-top: -60px;
                    float: right;
                    margin-right: 20px;
                }
                 .qr-code-container {
                    position: absolute;
                    bottom: 120px;
                    right: 50px;
                }
                .signature-block {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- LOGO -->
                <div class="logo">
                     <img src="${logoDataUri}" width="120" /> 
                </div>

                <!-- BACKGROUND WORDS -->
                <div class="decode-bg">DECODE</div>
                <div class="decode-text">DECODE</div>

                <!-- TITLE -->
                <h1 class="title">Certificate Of Participation</h1>

                <div class="subtitle">This is to certify that</div>

                <!-- FULL NAME -->
                <div class="name">${data.fullName}</div>

                <div class="line"></div>

                <!-- LEVEL + PROGRAM -->
                <div class="subtitle">
                    has successfully completed ${data.programLevel} Program
                </div>

                <div class="program">
                    DECODE
                </div>

                <div class="subtitle">
                    on ${data.date} &nbsp; &nbsp; in ${data.city}
                </div>

                <!-- TRAINER -->
                <div class="footer">
                    ${data.trainerName}
                </div>
                <div class="trainer-role">
                    EKAA DECODE TRAINER
                </div>

                <!-- UCID + SEAL -->
                <div class="bottom-bar"></div>

                <div class="ucid">
                    UCID: ${data.certificateId}
                </div>

                <div class="seal">
                    <!-- QR Code as Seal/Verification -->
                    <img src="${qrCodeDataUri}" width="100" />
                </div>

                <div class="signature-block">
                    Signed by ABCDEF <br>
                    Date: ${new Date().toISOString().split('T')[0].replace(/-/g, '.')} &nbsp; ${new Date().toLocaleTimeString()}
                </div>
            </div>
        </body>
        </html>
    `;

    await page.setContent(htmlContent);
    // Explicitly wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // A4 Size @ 96 DPI is approx 794 x 1123
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const outputDir = path.join(__dirname, '../certificates');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const fileName = `CERT-${data.certificateId}.png`;
    const outputPath = path.join(outputDir, fileName);

    await page.screenshot({ path: outputPath, fullPage: true });
    await browser.close();

    return outputPath;
};

module.exports = { generateCertificateId, generateCertificateImage };