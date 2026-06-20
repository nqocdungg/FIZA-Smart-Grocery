package com.mealmate.shopping.service;

import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.auth.model.Role;
import com.mealmate.fridge.repository.FridgeItemRepository;
import com.mealmate.shopping.dto.DailyPlanSummaryDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.dto.ShoppingListRequestDTO;
import com.mealmate.shopping.mapper.ShoppingMapper;
import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceTest {

    @Mock
    private ShoppingListRepository repository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ShoppingMapper mapper;
    @Mock
    private ShoppingListItemRepository itemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FoodRepository foodRepository;
    @Mock
    private FamilyRepository familyRepository;
    @Mock
    private FridgeItemRepository fridgeItemRepository;

    @InjectMocks
    private ShoppingListService service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void should_GetPlanDetail_When_PlanExists() {
        // given
        Long familyId = 1L;
        LocalDate date = LocalDate.of(2026, 6, 1);
        ShoppingList shoppingList = new ShoppingList();
        shoppingList.setId(10L);

        Food food = new Food();
        food.setId(5L);
        food.setCategoryId(2L);

        ShoppingListItem item = new ShoppingListItem();
        item.setFood(food);
        item.setAssignedTo(3L);
        item.setNote("Mua loại tươi");
        shoppingList.setItems(List.of(item));

        Category category = new Category();
        category.setId(2L);
        category.setName("Rau củ");
        category.setIconKey("vegetable_icon");

        User user = new User();
        user.setId(3L);
        user.setFullName("Nguyễn Văn A");

        ShoppingItemDTO dto = new ShoppingItemDTO();

        when(repository.findByFamilyIdAndPlannedDate(familyId, date)).thenReturn(Optional.of(shoppingList));
        when(mapper.toItemDto(item)).thenReturn(dto);
        when(categoryRepository.findAllById(List.of(2L))).thenReturn(List.of(category));
        when(userRepository.findAllById(List.of(3L))).thenReturn(List.of(user));

        // when
        List<ShoppingItemDTO> result = service.getPlanDetail(familyId, date);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategoryName()).isEqualTo("Rau củ");
        assertThat(result.get(0).getAssigneeName()).isEqualTo("Nguyễn Văn A");
        verify(categoryRepository).findAllById(List.of(2L));
        verify(userRepository).findAllById(List.of(3L));
    }

    @Test
    void should_GetWeeklySummary_When_Called() {
        // given
        Long familyId = 1L;
        LocalDate selectedDate = LocalDate.of(2026, 6, 1); // Monday

        when(repository.findByFamilyIdAndPlannedDateBetween(eq(familyId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        // when
        List<DailyPlanSummaryDTO> summary = service.getWeeklySummary(familyId, selectedDate);

        // then
        assertThat(summary).hasSize(7);
        assertThat(summary.get(0).getDayOfWeek()).isEqualTo("Thứ 2");
        assertThat(summary.get(0).getTotalItems()).isEqualTo(0);
    }

    @Test
    void should_ToggleItemStatus_When_ItemExists() {
        // given
        Long itemId = 1L;
        ShoppingListItem item = new ShoppingListItem();
        item.setIsPurchased(false);

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

        // when
        service.toggleItemStatus(itemId);

        // then
        assertThat(item.getIsPurchased()).isTrue();
    }

    @Test
    void should_SavePlan_When_Called() {
        // given
        ShoppingListRequestDTO request = new ShoppingListRequestDTO();
        request.setFamilyId(1L);
        request.setPlannedDate(LocalDate.of(2026, 6, 1));
        request.setNote("Ghi chú");
        request.setItems(new ArrayList<>());

        Family family = new Family();
        family.setId(1L);

        User currentUser = new User();
        currentUser.setId(2L);
        currentUser.setFamilyId(1L);
        Role housekeeperRole = new Role();
        housekeeperRole.setName("HOUSEKEEPER");
        currentUser.setRole(housekeeperRole);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(currentUser, null, currentUser.getAuthorities()));

        ShoppingList shoppingList = new ShoppingList();
        shoppingList.setId(10L);

        when(repository.findByFamilyIdAndPlannedDate(1L, LocalDate.of(2026, 6, 1))).thenReturn(Optional.empty());
        when(familyRepository.findById(1L)).thenReturn(Optional.of(family));
        when(userRepository.findById(2L)).thenReturn(Optional.of(currentUser));
        when(repository.save(any(ShoppingList.class))).thenReturn(shoppingList);

        // when
        service.savePlan(request);

        // then
        verify(repository).save(argThat(saved -> saved.getCreatedBy() == currentUser));
    }

    @Test
    void should_RejectNewPlan_When_CurrentUserIsNotHousekeeper() {
        ShoppingListRequestDTO request = new ShoppingListRequestDTO();
        request.setFamilyId(1L);
        request.setPlannedDate(LocalDate.of(2026, 6, 2));
        request.setItems(new ArrayList<>());

        User currentUser = new User();
        currentUser.setId(3L);
        currentUser.setFamilyId(1L);
        Role customerRole = new Role();
        customerRole.setName("CUSTOMER");
        currentUser.setRole(customerRole);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(currentUser, null, currentUser.getAuthorities()));

        when(userRepository.findById(3L)).thenReturn(Optional.of(currentUser));
        when(repository.findByFamilyIdAndPlannedDate(1L, LocalDate.of(2026, 6, 2)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.savePlan(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
        verify(repository, never()).save(any(ShoppingList.class));
    }

    @Test
    void should_DeletePlan_When_PlanExists() {
        // given
        Long listId = 1L;
        when(repository.existsById(listId)).thenReturn(true);

        // when
        service.deletePlan(listId);

        // then
        InOrder deleteOrder = inOrder(itemRepository, repository);
        deleteOrder.verify(itemRepository).deleteByShoppingListId(listId);
        deleteOrder.verify(repository).deleteById(listId);
    }

    @Test
    void should_ImportToFridge_When_Called() {
        // given
        Long listId = 1L;
        ShoppingList list = new ShoppingList();
        list.setFamilyId(10L);

        Food food = new Food();
        food.setId(5L);
        food.setName("Thịt heo");

        ShoppingListItem item = new ShoppingListItem();
        item.setFood(food);
        item.setIsPurchased(true);
        item.setImportedToFridgeAt(null);
        item.setQuantity(2.0);

        list.setItems(List.of(item));

        when(repository.findById(listId)).thenReturn(Optional.of(list));

        // when
        service.importToFridge(listId);

        // then
        verify(fridgeItemRepository).save(any());
        verify(itemRepository).saveAll(any());
    }
}
