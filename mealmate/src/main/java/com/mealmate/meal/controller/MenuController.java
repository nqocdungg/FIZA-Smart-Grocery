package com.mealmate.meal.controller;

import com.mealmate.meal.model.Menu;
import com.mealmate.meal.service.MenuService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/meals/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Menu>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Menu>> create(@RequestBody Menu entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
