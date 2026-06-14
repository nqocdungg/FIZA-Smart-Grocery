package com.mealmate.meal.service;

import com.mealmate.meal.model.Meal;
import com.mealmate.meal.model.Menu;
import com.mealmate.meal.repository.MealRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MealServiceTest {

    @Mock
    private MealRepository mealRepository;

    @InjectMocks
    private MealService mealService;

    @Test
    void should_FindAllMeals_When_Called() {
        // given
        Menu menu = new Menu();
        menu.setId(1L);

        Meal meal1 = new Meal();
        meal1.setId(1L);
        meal1.setMenu(menu);
        meal1.setMealDate(LocalDate.of(2026, 6, 1));
        meal1.setMealType("BREAKFAST");

        Meal meal2 = new Meal();
        meal2.setId(2L);
        meal2.setMenu(menu);
        meal2.setMealDate(LocalDate.of(2026, 6, 1));
        meal2.setMealType("LUNCH");

        when(mealRepository.findAll()).thenReturn(List.of(meal1, meal2));

        // when
        List<Meal> result = mealService.findAll();

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getMealType()).isEqualTo("BREAKFAST");
        assertThat(result.get(1).getMealType()).isEqualTo("LUNCH");
        verify(mealRepository).findAll();
    }

    @Test
    void should_SaveMeal_When_ValidMeal() {
        // given
        Menu menu = new Menu();
        menu.setId(1L);

        Meal meal = new Meal();
        meal.setMenu(menu);
        meal.setMealDate(LocalDate.of(2026, 6, 1));
        meal.setMealType("DINNER");

        Meal savedMeal = new Meal();
        savedMeal.setId(3L);
        savedMeal.setMenu(menu);
        savedMeal.setMealDate(LocalDate.of(2026, 6, 1));
        savedMeal.setMealType("DINNER");

        when(mealRepository.save(meal)).thenReturn(savedMeal);

        // when
        Meal result = mealService.save(meal);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(3L);
        assertThat(result.getMealType()).isEqualTo("DINNER");
        verify(mealRepository).save(meal);
    }
}
