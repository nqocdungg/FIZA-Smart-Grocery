package com.mealmate.shopping.controller;

import java.time.LocalDate;
import java.util.List;

import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.shopping.dto.ShoppingListRequestDTO;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mealmate.common.dto.ApiResponse;
import com.mealmate.shopping.dto.DailyPlanSummaryDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.service.ShoppingListService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/shopping")
@RequiredArgsConstructor
public class ShoppingController {
    private final ShoppingListService service;
    private final FoodRepository foodRepository;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<DailyPlanSummaryDTO>>> getSummary(
            @RequestParam Long familyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy tóm tắt thành công",
                service.getWeeklySummary(familyId, startDate)));
    }

    @GetMapping("/detail")
    public ResponseEntity<ApiResponse<List<ShoppingItemDTO>>> getDetail(
            @RequestParam Long familyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy chi tiết thành công",
                service.getPlanDetail(familyId, date)));
    }

    @PatchMapping("/items/{itemId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleItem(@PathVariable Long itemId) {
        service.toggleItemStatus(itemId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật trạng thái thành công", null));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Void>> savePlan(@RequestBody ShoppingListRequestDTO request) {
        service.savePlan(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Lưu kế hoạch thành công", null));
    }

    @GetMapping("/foods/search")
    public ResponseEntity<ApiResponse<List<Food>>> searchFoods(@RequestParam String query) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", foodRepository.findByNameContainingIgnoreCase(query)));
    }
}