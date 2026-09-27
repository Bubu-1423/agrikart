package com.agrikart.backend.repositories;

import com.agrikart.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // OTP/Login check karne ke liye custom function
    Optional<User> findByPhoneNumber(String phoneNumber);
}