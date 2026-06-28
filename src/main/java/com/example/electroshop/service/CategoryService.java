package com.example.electroshop.service;

import com.example.electroshop.entity.Category;
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
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(Category category) {
        String name =
                requireText(
                        category.getName(),
                        "Tên danh mục không được để trống"
                );

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên danh mục đã tồn tại"
            );
        }

        category.setName(name);
        category.setIcon(normalize(category.getIcon()));

        return categoryRepository.save(category);
    }

    public Category updateCategory(
            Long id,
            Category category
    ) {
        Category existingCategory =
                categoryRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy danh mục"
                                )
                        );

        String newName =
                requireText(
                        category.getName(),
                        "Tên danh mục không được để trống"
                );

        if (
                categoryRepository
                        .existsByNameIgnoreCaseAndIdNot(
                                newName,
                                id
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên danh mục đã tồn tại"
            );
        }

        boolean nameChanged =
                !existingCategory
                        .getName()
                        .equalsIgnoreCase(newName);

        if (
                nameChanged &&
                (
                        productRepository
                                .existsByCategoryIgnoreCase(
                                        existingCategory.getName()
                                )
                                ||
                        brandRepository
                                .existsByCategoryIgnoreCase(
                                        existingCategory.getName()
                                )
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể đổi tên danh mục vì đang có sản phẩm hoặc thương hiệu sử dụng"
            );
        }

        existingCategory.setName(newName);
        existingCategory.setIcon(normalize(category.getIcon()));

        return categoryRepository.save(existingCategory);
    }

    public void deleteCategory(Long id) {
        Category existingCategory =
                categoryRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy danh mục"
                                )
                        );

        String categoryName =
                existingCategory.getName();

        if (
                productRepository
                        .existsByCategoryIgnoreCase(categoryName)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa danh mục vì đang có sản phẩm sử dụng"
            );
        }

        if (
                brandRepository
                        .existsByCategoryIgnoreCase(categoryName)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa danh mục vì đang có thương hiệu sử dụng"
            );
        }

        categoryRepository.delete(existingCategory);
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

    private String normalize(String value) {
        return value == null
                ? null
                : value.trim();
    }
}