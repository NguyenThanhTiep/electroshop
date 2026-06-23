package com.example.electroshop.controller;

import com.example.electroshop.entity.Product;
import com.example.electroshop.service.ProductService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")

@RequiredArgsConstructor

@CrossOrigin("*")

public class ProductController {

    private final ProductService productService;

    // GET ALL
    @GetMapping
    public List<Product> getAllProducts() {

        return productService.getAllProducts();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public Product getProductById(
            @PathVariable Long id
    ) {

        return productService.getProductById(id);
    }

    // CREATE
    @PostMapping
    public Product createProduct(
            @RequestBody Product product
    ) {

        return productService.createProduct(product);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Long id,
            @RequestBody Product product
    ) {

        return productService.updateProduct(id, product);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public String deleteProduct(
            @PathVariable Long id
    ) {

        productService.deleteProduct(id);

        return "Deleted successfully";
    }
}