package com.example.electroshop.service;

import com.example.electroshop.entity.Brand;
import com.example.electroshop.repository.BrandRepository;
import com.example.electroshop.repository.CategoryRepository;
import com.example.electroshop.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<Brand> getAllBrands() {
        return brandRepository.findAll();
    }

    public Brand createBrand(Brand brand) {
        String name =
                requireText(
                        brand.getName(),
                        "Tên thương hiệu không được để trống"
                );

        String category =
                requireText(
                        brand.getCategory(),
                        "Danh mục của thương hiệu không được để trống"
                );

        validateCategoryExists(category);

        if (
                brandRepository
                        .existsByNameIgnoreCaseAndCategoryIgnoreCase(
                                name,
                                category
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Thương hiệu đã tồn tại trong danh mục này"
            );
        }

        brand.setName(name);
        brand.setCategory(category);

        return brandRepository.save(brand);
    }

    public Brand updateBrand(
            Long id,
            Brand brand
    ) {
        Brand existingBrand =
                brandRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy thương hiệu"
                                )
                        );

        String newName =
                requireText(
                        brand.getName(),
                        "Tên thương hiệu không được để trống"
                );

        String newCategory =
                requireText(
                        brand.getCategory(),
                        "Danh mục của thương hiệu không được để trống"
                );

        validateCategoryExists(newCategory);

        if (
                brandRepository
                        .existsByNameIgnoreCaseAndCategoryIgnoreCaseAndIdNot(
                                newName,
                                newCategory,
                                id
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Thương hiệu đã tồn tại trong danh mục này"
            );
        }

        boolean changed =
                !existingBrand.getName().equalsIgnoreCase(newName)
                        ||
                !existingBrand.getCategory().equalsIgnoreCase(newCategory);

        if (
                changed &&
                productRepository
                        .existsByBrandIgnoreCaseAndCategoryIgnoreCase(
                                existingBrand.getName(),
                                existingBrand.getCategory()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể sửa thương hiệu vì đang có sản phẩm sử dụng"
            );
        }

        existingBrand.setName(newName);
        existingBrand.setCategory(newCategory);

        return brandRepository.save(existingBrand);
    }

    public void deleteBrand(Long id) {
        Brand existingBrand =
                brandRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy thương hiệu"
                                )
                        );

        if (
                productRepository
                        .existsByBrandIgnoreCaseAndCategoryIgnoreCase(
                                existingBrand.getName(),
                                existingBrand.getCategory()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa thương hiệu vì đang có sản phẩm sử dụng"
            );
        }

        brandRepository.delete(existingBrand);
    }

    private void validateCategoryExists(String category) {
        if (
                !categoryRepository
                        .existsByNameIgnoreCase(category)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh mục của thương hiệu không tồn tại"
            );
        }
    }

    private String requireText(
            String value,
            String message
    ) {
        if (
                value == null ||
                value.trim().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    message
            );
        }

        return value.trim();
    }
}