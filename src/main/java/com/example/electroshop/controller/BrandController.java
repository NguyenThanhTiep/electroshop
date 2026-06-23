package com.example.electroshop.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.electroshop.entity.Brand;
import com.example.electroshop.repository.BrandRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/brands")
@CrossOrigin("*")
@RequiredArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public List<Brand> getAllBrands() {

        return brandRepository.findAll();
    }

    @PostMapping
    public Brand createBrand(
            @RequestBody Brand brand
    ) {

        return brandRepository.save(brand);
    }

    @PutMapping("/{id}")
    public Brand updateBrand(
            @PathVariable Long id,
            @RequestBody Brand brand
    ) {

        Brand existingBrand =
                brandRepository.findById(id)
                        .orElseThrow();

        existingBrand.setName(
                brand.getName()
        );

        return brandRepository.save(existingBrand);
    }

    @DeleteMapping("/{id}")
    public void deleteBrand(
            @PathVariable Long id
    ) {

        brandRepository.deleteById(id);
    }
}