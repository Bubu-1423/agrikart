package com.agrikart.backend.controllers;

import com.agrikart.backend.models.Product;
import com.agrikart.backend.models.User;
import com.agrikart.backend.repositories.ProductRepository;
import com.agrikart.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Saare products fetch karna (Market grid ke liye)
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // 2. Naya product add karna + Farmer validation
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        // Validation: Farmer detail check
        if (product.getFarmer() == null || product.getFarmer().getId() == null) {
            return ResponseEntity.badRequest().body("Farmer profile missing!");
        }

        // Database se actual registered farmer verify karo
        Optional<User> farmerOpt = userRepository.findById(product.getFarmer().getId());
        if (farmerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Farmer ID database mein nahi mila!");
        }

        User farmer = farmerOpt.get();
        if (farmer.getRole() != User.Role.FARMER) {
            return ResponseEntity.badRequest().body("Sirf registered Farmer hi fasal list kar sakte hain!");
        }

        // Managed farmer entity attach karo taaki foreign key theek se bind ho
        product.setFarmer(farmer);

        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(savedProduct);
    }

    // 3. Fasal delete karna (Agar stock khatam ho jaye)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        return ResponseEntity.ok("Product successfully removed from market.");
    }
}