package com.ekaa.registration.controller;

import com.ekaa.registration.entity.Registration;
import com.ekaa.registration.repository.RegistrationRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private RegistrationRepository registrationRepository;

    @GetMapping("/registrations")
    public String getRegistrations(Model model) {
        List<Registration> registrations = registrationRepository.findAll();
        model.addAttribute("registrations", registrations);
        return "admin";
    }

    // ✅ Excel Export Endpoint
    @GetMapping("/export-excel")
    public void exportToExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=Ekaa_Registrations.xlsx";
        response.setHeader(headerKey, headerValue);

        List<Registration> registrations = registrationRepository.findAll();

        // Create workbook and sheet
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Registrations");

        // --- HEADER ROW ---
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Name", "Email", "Phone", "Connected With", "Selected Trainings"};

        // Header Style
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.VIOLET.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // --- DATA ROWS ---
        int rowCount = 1;
        for (Registration reg : registrations) {
            Row row = sheet.createRow(rowCount++);
            row.createCell(0).setCellValue(reg.getName());
            row.createCell(1).setCellValue(reg.getEmail());
            row.createCell(2).setCellValue(reg.getPhone());
            row.createCell(3).setCellValue(reg.getConnectedWith());
            row.createCell(4).setCellValue(reg.getSelectedTrainings());
        }

        // Auto-size columns for neatness
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // Write to response stream
        workbook.write(response.getOutputStream());
        workbook.close();
    }
}
