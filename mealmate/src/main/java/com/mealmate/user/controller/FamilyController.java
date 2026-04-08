package com.mealmate.user.controller;

import com.mealmate.user.model.Family;
import com.mealmate.user.service.FamilyService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users/familys")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Family>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Family>> create(@RequestBody Family entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
