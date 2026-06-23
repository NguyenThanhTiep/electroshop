package com.example.electroshop.config;

import com.example.electroshop.entity.User;
import com.example.electroshop.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner createDefaultAdmin(
            UserRepository userRepository
    ) {

        return args -> {

            BCryptPasswordEncoder encoder =
                    new BCryptPasswordEncoder();

            boolean adminExists =
                    userRepository
                            .findByEmail(
                                    "admin@gmail.com"
                            )
                            .isPresent();

            if (!adminExists) {

                User admin = new User();

                admin.setLastName(
                        "Admin"
                );

                admin.setFirstName(
                        "ElectroShop"
                );

                admin.setFullName(
                        "Admin ElectroShop"
                );

                admin.setEmail(
                        "admin@gmail.com"
                );

                admin.setPhone(
                        "0000000000"
                );

                admin.setPassword(
                        encoder.encode(
                                "admin"
                        )
                );

                admin.setRole(
                        "admin"
                );

                userRepository.save(admin);
            }
        };
    }
}