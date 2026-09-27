package com.agrikart.backend.config;

import com.agrikart.backend.models.Product;
import com.agrikart.backend.models.User;
import com.agrikart.backend.repositories.ProductRepository;
import com.agrikart.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        // Agar database khali hai, tabhi data daalo
        if (userRepository.count() == 0) {
            
            // 1. Farmer (ID 1 banega)
            User ramesh = new User();
            ramesh.setFullName("Ramesh Kumar (Farmer)");
            ramesh.setPhoneNumber("9876543210");
            ramesh.setPassword("farmer123");
            ramesh.setRole(User.Role.FARMER);
            userRepository.save(ramesh);

            // 2. Customer - Suresh (ID 2 banega)
            User suresh = new User();
            suresh.setFullName("Suresh (Customer)");
            suresh.setPhoneNumber("1234567890");
            suresh.setPassword("customer123"); 
            suresh.setRole(User.Role.CUSTOMER);
            userRepository.save(suresh);

            // 3. Products
            Product aalu = new Product();
            aalu.setProductName("Desi Aalu (Potatoes)");
            aalu.setDescription("Freshly harvested organic potatoes from Punjab");
            aalu.setPrice(35.0);
            aalu.setStockQuantity(100);
            aalu.setFarmer(ramesh);
            productRepository.save(aalu);

            Product gehu = new Product();
            gehu.setProductName("Sharbati Gehu (Wheat)");
            gehu.setDescription("Premium quality wheat grains");
            gehu.setPrice(45.0);
            gehu.setStockQuantity(500);
            gehu.setFarmer(ramesh);
            productRepository.save(gehu);

            System.out.println("✅ Dummy Data Successfully Added with Suresh and Passwords!");
        }
    }
}