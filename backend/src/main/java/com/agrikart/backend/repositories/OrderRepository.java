package com.agrikart.backend.repositories;

import com.agrikart.backend.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Kisi specific customer ke saare orders dekhne ke liye
    List<Order> findByCustomerId(Long customerId);
}