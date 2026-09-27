package com.agrikart.backend.controllers;

import com.agrikart.backend.models.User;
import com.agrikart.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Login Request class - phone aur phoneNumber dono support karega
    public static class LoginRequest {
        private String phoneNumber;
        private String phone;
        private String password;

        public LoginRequest() {}

        public String getPhoneNumber() {
            return (phoneNumber != null && !phoneNumber.trim().isEmpty()) ? phoneNumber : phone;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    // 1. Login API
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        try {
            String targetPhone = request.getPhoneNumber();
            if (targetPhone == null || targetPhone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Phone number is required");
            }

            Optional<User> userOpt = userRepository.findByPhoneNumber(targetPhone);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getPassword() != null && user.getPassword().equals(request.getPassword())) {
                    return ResponseEntity.ok(user); // Login Success
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Phone Number or Password");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login error: " + e.getMessage());
        }
    }

    // 2. Signup API
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            // Check if phone number already registered
            if (user.getPhoneNumber() != null) {
                Optional<User> existing = userRepository.findByPhoneNumber(user.getPhoneNumber());
                if (existing.isPresent()) {
                    return ResponseEntity.badRequest().body("Phone number already registered. Please login.");
                }
            }
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration error: " + e.getMessage());
        }
    }

    // 3. Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}