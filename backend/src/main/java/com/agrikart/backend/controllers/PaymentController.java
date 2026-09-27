package com.agrikart.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    // Frontend se aane wala payment data
    public static class PaymentRequest {
        public Long orderId;
        public Double amount;
        public String paymentMethod; // UPI, CARD, NETBANKING
    }

    @PostMapping("/pay")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request) {
        
        // Ek unique Transaction ID generate kar rahe hain (Jaise Razorpay "pay_xyz" karta hai)
        String txnId = "TXN_" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        
        // Response data tayar karna
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("transactionId", txnId);
        response.put("message", "Payment of ₹" + request.amount + " received successfully via " + request.paymentMethod);
        response.put("orderId", String.valueOf(request.orderId));

        return ResponseEntity.ok(response);
    }
}