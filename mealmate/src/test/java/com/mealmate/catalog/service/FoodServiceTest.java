package com.mealmate.catalog.service;

import com.mealmate.catalog.mapper.FoodMapper;
import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.model.dto.FoodRequest;
import com.mealmate.catalog.model.dto.FoodResponse;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock
    private FoodRepository foodRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private FoodMapper foodMapper;

    @InjectMocks
    private FoodService foodService;

    // --- CASE 1: Thêm thực phẩm (create) ---

    @Test
    void should_CreateFoodSuccessfully_When_ValidRequest() {
        // given
        FoodRequest request = new FoodRequest();
        request.setCategoryId(1L);
        request.setName("Thịt bò");
        request.setUnit("kg");

        when(categoryRepository.existsById(1L)).thenReturn(true);
        when(foodRepository.existsByNameIgnoreCase("Thịt bò")).thenReturn(false);

        Food food = new Food();
        food.setCategoryId(1L);
        food.setName("Thịt bò");
        food.setUnit("kg");

        Food savedFood = new Food();
        savedFood.setId(10L);
        savedFood.setCategoryId(1L);
        savedFood.setName("Thịt bò");
        savedFood.setUnit("kg");
        savedFood.setIsSystem(true);

        FoodResponse responseDto = new FoodResponse();
        responseDto.setId(10L);
        responseDto.setCategoryId(1L);
        responseDto.setName("Thịt bò");
        responseDto.setUnit("kg");

        when(foodMapper.toEntity(request)).thenReturn(food);
        when(foodRepository.save(food)).thenReturn(savedFood);
        when(foodMapper.toResponse(savedFood)).thenReturn(responseDto);

        // when
        FoodResponse result = foodService.create(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("Thịt bò");
        verify(foodRepository).save(food);
    }

    @Test
    void should_ThrowException_When_FoodNameAlreadyExists() {
        // given
        FoodRequest request = new FoodRequest();
        request.setCategoryId(1L);
        request.setName("Thịt bò");

        when(categoryRepository.existsById(1L)).thenReturn(true);
        when(foodRepository.existsByNameIgnoreCase("Thịt bò")).thenReturn(true);

        // when / then
        assertThatThrownBy(() -> foodService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Food already exists");
    }

    @Test
    void should_ThrowException_When_CategoryIdIsNull() {
        // given
        FoodRequest request = new FoodRequest();
        request.setName("Thịt bò");

        // when / then
        assertThatThrownBy(() -> foodService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("categoryId is required");
    }

    @Test
    void should_ThrowException_When_CategoryNotFound() {
        // given
        FoodRequest request = new FoodRequest();
        request.setCategoryId(999L);
        request.setName("Thịt bò");

        when(categoryRepository.existsById(999L)).thenReturn(false);

        // when / then
        assertThatThrownBy(() -> foodService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Category not found");
    }

    // --- CASE 2: Xóa thực phẩm (delete) ---

    @Test
    void should_DeleteFoodSuccessfully_When_FoodExists() {
        // given
        Long foodId = 10L;
        Food food = new Food();
        food.setId(foodId);
        food.setName("Thịt bò");

        when(foodRepository.findById(foodId)).thenReturn(Optional.of(food));

        // when
        foodService.delete(foodId);

        // then
        verify(foodRepository).delete(food);
    }

    @Test
    void should_ThrowException_When_DeletingNonExistentFood() {
        // given
        Long foodId = 999L;
        when(foodRepository.findById(foodId)).thenReturn(Optional.empty());

        // when / then
        assertThatThrownBy(() -> foodService.delete(foodId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Food not found");
    }
}
