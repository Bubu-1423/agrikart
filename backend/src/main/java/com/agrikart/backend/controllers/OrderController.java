package com.agrikart.backend.controllers;

import com.agrikart.backend.models.Order;
import com.agrikart.backend.models.Product;
import com.agrikart.backend.models.User;
import com.agrikart.backend.repositories.OrderRepository;
import com.agrikart.backend.repositories.ProductRepository;
import com.agrikart.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository; // Customer check karne ke liye

    // 1. Order Placement + Validation
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        // Step A: Customer check karo
        if (order.getCustomer() == null || order.getCustomer().getId() == null) {
            return ResponseEntity.badRequest().body("Customer details missing!");
        }

        Optional<User> customerOpt = userRepository.findById(order.getCustomer().getId());
        if (customerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Customer ID " + order.getCustomer().getId() + " database mein nahi mila! Dobara register/login karein.");
        }

        // Step B: Product check karo
        Optional<Product> productOpt = productRepository.findById(order.getProduct().getId());
        if (productOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Product nahi mila!");
        }

        Product product = productOpt.get();

        // Step C: Stock check aur deduct
        if (product.getStockQuantity() < order.getQuantity()) {
            return ResponseEntity.badRequest().body("Out of stock! Sirf " + product.getStockQuantity() + " bache hain.");
        }

        product.setStockQuantity(product.getStockQuantity() - order.getQuantity());
        productRepository.save(product);

        // Step D: Valid managed Customer aur Product set karo
        order.setCustomer(customerOpt.get());
        order.setProduct(product);
        order.setStatus(Order.Status.PENDING);
        order.setOrderDate(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.ok(savedOrder);
    }

    // 2. All Orders Fetch
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // 3. Customer specific orders
    @GetMapping("/customer/{customerId}")
    public List<Order> getOrdersByCustomer(@PathVariable Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    // 4. Status Update
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId, @RequestParam String status) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();
        try {
            order.setStatus(Order.Status.valueOf(status.toUpperCase()));
            orderRepository.save(order);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid Status. Use: PENDING, SHIPPED, DELIVERED, CANCELLED");
        }
    }
}