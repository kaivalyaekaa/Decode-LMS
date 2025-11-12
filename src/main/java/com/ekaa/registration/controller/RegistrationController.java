package com.ekaa.registration.controller;

import com.ekaa.registration.entity.Registration;
import com.ekaa.registration.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class RegistrationController {

    @Autowired
    private RegistrationRepository registrationRepository;

    /**
     * Private class/record to correctly model the incoming JSON payload from the frontend.
     * This is necessary because the frontend sends 'selectedTrainings' as a List<String> (JSON array),
     * but the JPA entity 'Registration' stores it as a single String.
     */
    private record RegistrationRequest(
            String name,
            String email,
            String phone,
            String connectedWith,
            List<String> selectedTrainings // Correctly handles the incoming JSON array
    ) {}

    @GetMapping("/")
    public String redirectToRegistration() {
        return "redirect:/registration";
    }

    /**
     * Serves the registration form page and adds an empty Registration object to the model.
     */
    @GetMapping("/registration")
    public String showRegistrationForm(Model model) {
        model.addAttribute("registration", new Registration());
        return "registration";
    }

    /**
     * Handles the AJAX POST request with an application/json payload to save registration data.
     * @param request The object populated from the JSON body (DTO).
     * @return A ResponseEntity containing a success or error message (JSON response).
     */
    @PostMapping("/registration")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegistrationRequest request) {
        Map<String, String> response = new HashMap<>();

        // 1. Validation check
        if (request.name() == null || request.name().isEmpty() ||
                request.email() == null || request.email().isEmpty() ||
                request.phone() == null || request.phone().isEmpty()) {

            response.put("message", "Name, email, and phone are required.");
            // Return 400 Bad Request if validation fails
            return ResponseEntity.badRequest().body(response);
        }

        // 2. Create the Entity from the Request DTO
        Registration registration = new Registration();
        registration.setName(request.name());
        registration.setEmail(request.email());
        registration.setPhone(request.phone());
        registration.setConnectedWith(request.connectedWith());

        // 3. Process selectedTrainings (from List<String> in DTO to comma-separated String for DB entity)
        List<String> selectedTrainingsList = request.selectedTrainings();

        if (selectedTrainingsList != null && !selectedTrainingsList.isEmpty()) {
            String trainingsString = selectedTrainingsList.stream()
                    .collect(Collectors.joining(", "));

            // Set the final String field in the JPA Entity using the setter you provided
            registration.setSelectedTrainings(trainingsString);
        } else {
            // Ensure the field is explicitly set to null/empty string if no training is selected
            registration.setSelectedTrainings("");
        }

        // 4. Save the entity
        registrationRepository.save(registration);

        // 5. Return success response
        response.put("message", "Registration successful! One of our team from EKAA will contact you within 48 hours.");
        return ResponseEntity.ok(response);

    }
}
