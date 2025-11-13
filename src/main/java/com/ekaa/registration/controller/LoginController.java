package com.ekaa.registration.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
    public class LoginController {

        @GetMapping("/admin-login")
        public String loginPage() {
            return "admin-login";
        }
    }


