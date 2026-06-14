package com.mealmate.admin.controller;

import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.catalog.repository.RecipeRepository;
import com.mealmate.common.dto.ApiResponse;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PerformanceControllerTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FamilyRepository familyRepository;
    @Mock
    private FoodRepository foodRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private PerformanceController performanceController;

    // --- CASE 1: Lấy thống kê hệ thống (getStats) ---

    @Test
    void should_ReturnSystemStatsCorrectly_When_ValidState() {
        // given
        when(userRepository.count()).thenReturn(15L);
        when(familyRepository.count()).thenReturn(5L);
        when(foodRepository.count()).thenReturn(50L);
        when(recipeRepository.count()).thenReturn(30L);

        Category cat1 = new Category();
        cat1.setId(1L);
        cat1.setName("Rau củ");

        Category cat2 = new Category();
        cat2.setId(2L);
        cat2.setName("Thịt");

        when(categoryRepository.findAll()).thenReturn(List.of(cat1, cat2));

        Food food1 = new Food();
        food1.setCategoryId(1L);
        food1.setName("Cải ngọt");

        Food food2 = new Food();
        food2.setCategoryId(2L);
        food2.setName("Thịt heo");

        when(foodRepository.findAll()).thenReturn(List.of(food1, food2));

        // when
        ResponseEntity<ApiResponse<Map<String, Object>>> response = performanceController.getStats();

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();

        Map<String, Object> stats = response.getBody().getData();
        assertThat(stats.get("totalUsers")).isEqualTo(15L);
        assertThat(stats.get("totalFamilies")).isEqualTo(5L);
        assertThat(stats.get("totalFoods")).isEqualTo(50L);
        assertThat(stats.get("totalRecipes")).isEqualTo(30L);

        List<Map<String, Object>> foodStats = (List<Map<String, Object>>) stats.get("foodStats");
        assertThat(foodStats).hasSize(2);
        assertThat(foodStats.get(0).get("name")).isEqualTo("Rau củ");
        assertThat(foodStats.get(0).get("value")).isEqualTo(1L);
        assertThat(foodStats.get(1).get("name")).isEqualTo("Thịt");
        assertThat(foodStats.get(1).get("value")).isEqualTo(1L);

        List<Map<String, Object>> userActivity = (List<Map<String, Object>>) stats.get("userActivity");
        assertThat(userActivity).hasSize(7);
        assertThat(userActivity.get(0).get("name")).isEqualTo("Thứ 2");
        assertThat(userActivity.get(0).get("users")).isEqualTo(40);
    }

    // --- CASE 2: Lấy danh sách thực phẩm chưa định danh (getUnidentifiedItems) ---

    @Test
    void should_ReturnUnidentifiedItemsWithCorrectTypes_When_DatabaseHasRows() {
        // given
        Map<String, Object> row1 = new HashMap<>();
        row1.put("id", 1L);
        row1.put("familyid", 10L);
        row1.put("foodid", 100L);
        row1.put("generalname", "Thịt bò");
        row1.put("actualname", "Thịt thăn bò Úc");
        row1.put("quantity", 1.5);
        row1.put("storagelocation", "Ngăn đông");
        row1.put("submittedby", "Nguyễn Văn A");
        row1.put("submittedat", "2026-06-14");

        Map<String, Object> row2 = new HashMap<>();
        row2.put("id", 2L);
        row2.put("familyid", 10L);
        row2.put("foodid", 101L);
        row2.put("generalname", "Rau xanh");
        row2.put("actualname", "Xà lách");
        row2.put("quantity", 0.5);
        row2.put("storagelocation", "Ngăn mát");
        row2.put("submittedby", "Nguyễn Văn B");
        row2.put("submittedat", null);

        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(row1, row2));

        // when
        ResponseEntity<ApiResponse<List<Map<String, Object>>>> response = performanceController.getUnidentifiedItems();

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();

        List<Map<String, Object>> items = response.getBody().getData();
        assertThat(items).hasSize(2);

        Map<String, Object> item1 = items.get(0);
        assertThat(item1.get("id")).isEqualTo(1L);
        assertThat(item1.get("actualName")).isEqualTo("Thịt thăn bò Úc");
        assertThat(item1.get("generalName")).isEqualTo("Thịt bò");
        assertThat(item1.get("type")).isEqualTo("meat");
        assertThat(item1.get("submittedBy")).isEqualTo("Nguyễn Văn A");
        assertThat(item1.get("submittedAt")).isEqualTo("2026-06-14");

        Map<String, Object> item2 = items.get(1);
        assertThat(item2.get("id")).isEqualTo(2L);
        assertThat(item2.get("actualName")).isEqualTo("Xà lách");
        assertThat(item2.get("generalName")).isEqualTo("Rau xanh");
        assertThat(item2.get("type")).isEqualTo("ingredient");
        assertThat(item2.get("submittedBy")).isEqualTo("Nguyễn Văn B");
        assertThat(item2.get("submittedAt")).isEqualTo("—");
    }

    // --- CASE 3: Ghi nhận xử lý thực phẩm chưa định danh (deleteUnidentifiedItem) ---

    @Test
    void should_ReturnSuccessMessage_When_DeleteUnidentifiedItemIsCalled() {
        // given
        Long itemId = 123L;

        // when
        ResponseEntity<ApiResponse<String>> response = performanceController.deleteUnidentifiedItem(itemId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Đã ghi nhận xử lý (Dữ liệu tủ lạnh được giữ nguyên)!");
    }
}
