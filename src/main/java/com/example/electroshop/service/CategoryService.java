package com.example.electroshop.service;

import com.example.electroshop.entity.Category;
import com.example.electroshop.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {

        return categoryRepository.findAll();
    }

    public Category createCategory(
            Category category
    ) {

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
                                new RuntimeException(
                                        "Category not found"
                                )
                        );

        existingCategory.setName(
                category.getName()
        );

        existingCategory.setIcon(
                category.getIcon()
        );

        return categoryRepository.save(
                existingCategory
        );
    }

    public void deleteCategory(
            Long id
    ) {

        categoryRepository.deleteById(id);
    }
}