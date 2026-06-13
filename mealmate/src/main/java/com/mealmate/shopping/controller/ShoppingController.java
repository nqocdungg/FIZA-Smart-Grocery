package com.mealmate.shopping.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.catalog.repository.FoodProjection;
import com.mealmate.common.dto.ApiResponse;
import com.mealmate.shopping.dto.FrequentItemSuggestionDTO;
import com.mealmate.shopping.dto.DailyPlanSummaryDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.dto.ShoppingListRequestDTO;
import com.mealmate.shopping.dto.WeeklyShoppingAggregateDTO;
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
    public ResponseEntity<ApiResponse<List<FoodProjection>>> searchFoods(@RequestParam String query) {
        return ResponseEntity
                .ok(new ApiResponse<>(true, "Success", foodRepository.searchFoods(query, null)));
    }

    @DeleteMapping("/{listId}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long listId) {
        service.deletePlan(listId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Xóa danh sách thành công", null));
    }

    @PostMapping("/{listId}/import-to-fridge")
    public ResponseEntity<ApiResponse<Void>> importToFridge(@PathVariable Long listId) {
        service.importToFridge(listId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Nhập tủ lạnh thành công", null));
    }

    @PatchMapping("/{listId}/note")
    public ResponseEntity<ApiResponse<Void>> updatePlanNote(
            @PathVariable Long listId,
            @RequestBody java.util.Map<String, String> body) {
        String note = body.get("note");
        service.updatePlanNote(listId, note);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật ghi chú thành công", null));
    }

    @PatchMapping("/items/{itemId}/note")
    public ResponseEntity<ApiResponse<Void>> updateItemNote(
            @PathVariable Long itemId,
            @RequestBody java.util.Map<String, String> body) {
        String note = body.get("note");
        service.updateItemNote(itemId, note);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật ghi chú thực phẩm thành công", null));
    }

    @GetMapping("/frequent")
    public ResponseEntity<ApiResponse<List<FrequentItemSuggestionDTO>>> getFrequent(@RequestParam Long familyId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách thực phẩm thường mua thành công",
                service.getFrequentItems(familyId)));
    }

    @GetMapping("/weekly/aggregate")
    public ResponseEntity<ApiResponse<List<WeeklyShoppingAggregateDTO>>> getWeeklyAggregate(
            @RequestParam Long familyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách gộp tuần thành công",
                service.getWeeklyAggregation(familyId, startDate)));
    }

    @PatchMapping("/weekly/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleWeeklyItem(
            @RequestParam Long familyId,
            @RequestParam Long foodId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam boolean isPurchased) {
        service.toggleWeeklyItemStatus(familyId, foodId, startDate, isPurchased);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật trạng thái thành công", null));
    }
}