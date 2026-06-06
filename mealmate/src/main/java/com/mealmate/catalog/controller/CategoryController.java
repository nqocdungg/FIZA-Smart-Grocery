package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.dto.CategoryRequest;
import com.mealmate.catalog.model.dto.CategoryResponse;
import com.mealmate.catalog.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService
    ) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> getAll() {
        return categoryService.getAll();
    }

    @GetMapping("/{id}")
    public CategoryResponse getById(
            @PathVariable Long id
    ) {
        return categoryService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse create(
            @Valid @RequestBody CategoryRequest request
    ) {
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request
    ) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(
            @PathVariable Long id
    ) {
        categoryService.delete(id);
    }
}
