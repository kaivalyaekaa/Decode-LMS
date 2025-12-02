const ExcelJS = require('exceljs');

async function createTestExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
        { header: 'Full Name', key: 'fullName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'Program Level', key: 'programLevel', width: 25 },
        { header: 'Mode', key: 'mode', width: 10 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 }
    ];

    worksheet.addRow({
        fullName: 'Excel Test Student',
        email: 'excel.test@example.com',
        phone: '1234567890',
        city: 'Test City',
        programLevel: 'Level 1 – Decode Your Mind',
        mode: 'Online',
        paymentStatus: 'Paid'
    });

    await workbook.xlsx.writeFile('test_registrations.xlsx');
    console.log('Test Excel file created: test_registrations.xlsx');
}

createTestExcel();
