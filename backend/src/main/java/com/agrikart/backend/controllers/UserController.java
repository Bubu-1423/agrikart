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

    // Login Request receive karne ke liye format
    public static class LoginRequest {
        public String phoneNumber;
        public String password;
    }

    // 1. Login API
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByPhoneNumber(request.phoneNumber);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Password match check
            if (user.getPassword() != null && user.getPassword().equals(request.password)) {
                return ResponseEntity.ok(user); // Login Success
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Phone Number or Password");
    }

    // 2. Signup API
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    // 3. Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}