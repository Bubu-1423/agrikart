package com.agrikart.backend.repositories;

import com.agrikart.backend.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Kisi specific farmer ke saare products dhoondhne ke liye
    List<Product> findByFarmerId(Long farmerId);
}