package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.PreservationMethod;
import com.mealmate.catalog.service.PreservationMethodService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/catalogs/preservationmethods")
@RequiredArgsConstructor
public class PreservationMethodController {

    private final PreservationMethodService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PreservationMethod>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PreservationMethod>> create(@RequestBody PreservationMethod entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
