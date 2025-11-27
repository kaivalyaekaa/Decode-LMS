const Registration = require('../models/Registration');
const excel = require('exceljs');

// Create a new registration
exports.createRegistration = async (req, res) => {
    try {
        const { name, email, phone, countryCity, connectedWith, selectedTrainings } = req.body;

        // Validation
        if (!name || !email || !phone || !countryCity) {
            return res.status(400).json({ message: "Name, email, phone, and country/city are required." });
        }

        // Process selectedTrainings (if array, join to string)
        let trainingsString = "";
        if (Array.isArray(selectedTrainings)) {
            trainingsString = selectedTrainings.join(", ");
        } else if (typeof selectedTrainings === 'string') {
            trainingsString = selectedTrainings;
        }

        const newRegistration = new Registration({
            name,
            email,
            phone,
            countryCity,
            connectedWith,
            selectedTrainings: trainingsString
        });

        await newRegistration.save();

        const successMessage = `Thank you for registering with us.<br>Click below to connect with us on Call/WhatsApp:<br> <br><a href='https://wa.me/919833402655' target='_blank' style='color:#800080; font-weight:bold;'>Nirmal Kaur : +91 98334 02655</a><br><a href='https://wa.me/919792250000' target='_blank' style='color:#800080; font-weight:bold;'>Amitanshu Nath: +91 97922 50000</a><br><br><a href='https://www.ekaa.co.in/schedule/' target='_blank' style='color:#800080; font-weight:bold;'>Click here to view the schedule</a>`;

        res.status(200).json({ message: successMessage });

    } catch (error) {
        console.error("Error creating registration:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get all registrations
exports.getRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ _id: -1 }); // Newest first
        res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Delete a registration
exports.deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Registration.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Registration not found" });
        }

        res.status(200).json({ message: "Registration deleted successfully" });
    } catch (error) {
        console.error("Error deleting registration:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Export to Excel
exports.exportRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ _id: -1 });

        const workbook = new excel.Workbook();
        const sheet = workbook.addWorksheet('Registrations');

        // Headers
        sheet.columns = [
            { header: 'Sl No', key: 'slNo', width: 10 },
            { header: 'Submitted On', key: 'createdAt', width: 20 },
            { header: 'Program', key: 'selectedTrainings', width: 40 },
            { header: 'Country / City', key: 'countryCity', width: 20 },
            { header: 'Connected With', key: 'connectedWith', width: 20 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Phone No', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 25 }
        ];

        // Style Headers
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF800080' }
        };

        // Add Data
        registrations.forEach((reg, index) => {
            sheet.addRow({
                slNo: index + 1,
                createdAt: reg.createdAt,
                selectedTrainings: reg.selectedTrainings,
                countryCity: reg.countryCity,
                connectedWith: reg.connectedWith,
                name: reg.name,
                phone: reg.phone,
                email: reg.email
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Ekaa_Registrations.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error exporting excel:", error);
        res.status(500).send("Error exporting excel");
    }
};
