package com.example.electroshop.controller;

import com.example.electroshop.entity.Category;
import com.example.electroshop.service.CategoryService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CategoryController {

    private final CategoryService categoryService;

    // GET ALL

    @GetMapping
    public List<Category> getAllCategories() {

        return categoryService.getAllCategories();
    }

    // CREATE

    @PostMapping
    public Category createCategory(
            @RequestBody Category category
    ) {

        return categoryService.createCategory(category);
    }

    // UPDATE

    @PutMapping("/{id}")
    public Category updateCategory(
            @PathVariable Long id,
            @RequestBody Category category
    ) {

        return categoryService.updateCategory(
                id,
                category
        );
    }

    // DELETE

    @DeleteMapping("/{id}")
    public void deleteCategory(
            @PathVariable Long id
    ) {

        categoryService.deleteCategory(id);
    }
}