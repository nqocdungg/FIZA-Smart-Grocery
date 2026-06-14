package com.mealmate.meal.service;

import com.mealmate.meal.model.Menu;
import com.mealmate.meal.repository.MenuRepository;
import com.mealmate.user.model.Family;
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
class MenuServiceTest {

    @Mock
    private MenuRepository menuRepository;

    @InjectMocks
    private MenuService menuService;

    @Test
    void should_FindAllMenus_When_Called() {
        // given
        Family family = new Family();
        family.setId(10L);
        family.setName("Gia đình A");

        Menu menu1 = new Menu();
        menu1.setId(1L);
        menu1.setFamily(family);
        menu1.setStartDate(LocalDate.of(2026, 6, 1));
        menu1.setEndDate(LocalDate.of(2026, 6, 7));

        Menu menu2 = new Menu();
        menu2.setId(2L);
        menu2.setFamily(family);
        menu2.setStartDate(LocalDate.of(2026, 6, 8));
        menu2.setEndDate(LocalDate.of(2026, 6, 14));

        when(menuRepository.findAll()).thenReturn(List.of(menu1, menu2));

        // when
        List<Menu> result = menuService.findAll();

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getStartDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(result.get(1).getStartDate()).isEqualTo(LocalDate.of(2026, 6, 8));
        verify(menuRepository).findAll();
    }

    @Test
    void should_SaveMenu_When_ValidMenu() {
        // given
        Family family = new Family();
        family.setId(10L);

        Menu menu = new Menu();
        menu.setFamily(family);
        menu.setStartDate(LocalDate.of(2026, 6, 15));
        menu.setEndDate(LocalDate.of(2026, 6, 21));

        Menu savedMenu = new Menu();
        savedMenu.setId(3L);
        savedMenu.setFamily(family);
        savedMenu.setStartDate(LocalDate.of(2026, 6, 15));
        savedMenu.setEndDate(LocalDate.of(2026, 6, 21));

        when(menuRepository.save(menu)).thenReturn(savedMenu);

        // when
        Menu result = menuService.save(menu);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(3L);
        assertThat(result.getStartDate()).isEqualTo(LocalDate.of(2026, 6, 15));
        verify(menuRepository).save(menu);
    }
}
