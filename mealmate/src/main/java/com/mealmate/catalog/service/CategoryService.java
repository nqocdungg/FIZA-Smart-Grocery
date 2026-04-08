package com.mealmate.catalog.service;

import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;

    public List<Category> findAll() {
        return repository.findAll();
    }

    public Category save(Category entity) {
        return repository.save(entity);
    }
}
