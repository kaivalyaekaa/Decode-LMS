package com.ekaa.registration.controller;

import com.ekaa.registration.entity.Registration;
import com.ekaa.registration.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

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
}