package com.example.electroshop.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        Path uploadDir = Paths.get(
                System.getProperty("user.dir"),
                "uploads"
        ).toAbsolutePath().normalize();

        String uploadLocation =
                uploadDir.toUri().toString();

        registry
                .addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);

        System.out.println(
                "Thư mục ảnh được công khai: "
                        + uploadLocation
        );
    }
}