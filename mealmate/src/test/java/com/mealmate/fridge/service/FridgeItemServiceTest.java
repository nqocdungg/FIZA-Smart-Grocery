package com.mealmate.fridge.service;

import com.mealmate.catalog.repository.RecipeIngredientRepository;
import com.mealmate.catalog.repository.UserFavoriteRecipeRepository;
import com.mealmate.fridge.mapper.FridgeItemMapper;
import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.FridgeItemStatus;
import com.mealmate.fridge.model.RemoveReason;
import com.mealmate.fridge.model.dto.CreateFridgeItemRequest;
import com.mealmate.fridge.model.dto.FridgeItemResponse;
import com.mealmate.fridge.model.dto.FridgeOverviewResponse;
import com.mealmate.fridge.model.dto.RemoveFridgeItemRequest;
import com.mealmate.fridge.repository.FridgeItemProjection;
import com.mealmate.fridge.repository.FridgeItemRepository;
import com.mealmate.notification.service.NotificationService;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FridgeItemServiceTest {

    @Mock
    private FridgeItemRepository fridgeItemRepository;
    @Mock
    private FridgeItemMapper fridgeItemMapper;
    @Mock
    private ShoppingListItemRepository shoppingListItemRepository;
    @Mock
    private RecipeIngredientRepository recipeIngredientRepository;
    @Mock
    private UserFavoriteRecipeRepository userFavoriteRecipeRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FridgeItemService fridgeItemService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockCurrentUser(Long userId, Long familyId, String fullName) {
        User user = new User();
        user.setId(userId);
        user.setFamilyId(familyId);
        user.setFullName(fullName);

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.lenient().when(authentication.isAuthenticated()).thenReturn(true);
        Mockito.lenient().when(authentication.getPrincipal()).thenReturn(user);

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);

        SecurityContextHolder.setContext(securityContext);
    }

    // --- CASE 1: Thêm đồ vào tủ (create) ---

    @Test
    void should_CreateFridgeItemSuccessfully_When_ValidRequest() {
        // given
        mockCurrentUser(1L, 10L, "John Doe");
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFoodId(100L);
        request.setQuantity(BigDecimal.valueOf(2.5));
        request.setCustomName("Sữa tươi");

        FridgeItem item = new FridgeItem();
        item.setFoodId(100L);
        item.setQuantity(BigDecimal.valueOf(2.5));
        item.setCustomName("Sữa tươi");

        FridgeItem savedItem = new FridgeItem();
        savedItem.setId(123L);
        savedItem.setFamilyId(10L);
        savedItem.setFoodId(100L);
        savedItem.setQuantity(BigDecimal.valueOf(2.5));
        savedItem.setCustomName("Sữa tươi");
        savedItem.setStatus(FridgeItemStatus.STORED);

        FridgeItemResponse responseDto = new FridgeItemResponse();
        responseDto.setId(123L);
        responseDto.setFoodId(100L);
        responseDto.setQuantity(BigDecimal.valueOf(2.5));
        responseDto.setDisplayName("Sữa tươi");

        when(fridgeItemMapper.toEntity(request)).thenReturn(item);
        when(fridgeItemRepository.save(item)).thenReturn(savedItem);
        when(userRepository.findByFamily_IdOrderByIdAsc(10L)).thenReturn(List.of());
        when(fridgeItemRepository.findDetailedById(123L)).thenReturn(Optional.empty());
        when(fridgeItemMapper.toResponse(savedItem)).thenReturn(responseDto);

        // when
        FridgeItemResponse result = fridgeItemService.create(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(123L);
        assertThat(result.getDisplayName()).isEqualTo("Sữa tươi");
        verify(fridgeItemRepository).save(item);
    }

    @Test
    void should_ThrowException_When_FoodIdIsNull() {
        // given
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setQuantity(BigDecimal.valueOf(2.5));

        // when / then
        assertThatThrownBy(() -> fridgeItemService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("foodId is required");
    }

    @Test
    void should_ThrowException_When_QuantityIsZeroOrNegative() {
        // given
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFoodId(100L);
        request.setQuantity(BigDecimal.ZERO);

        // when / then
        assertThatThrownBy(() -> fridgeItemService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("quantity must be greater than 0");
    }

    @Test
    void should_ThrowException_When_UserHasNoFamily() {
        // given
        mockCurrentUser(1L, null, "John Doe");
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFoodId(100L);
        request.setQuantity(BigDecimal.valueOf(1.0));

        // when / then
        assertThatThrownBy(() -> fridgeItemService.create(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).isEqualTo("No family");
                });
    }

    // --- CASE 2: Kiểm tra đồ hết hạn (getOverview) ---

    @Test
    void should_ReturnOverviewWithExpiredAndAlmostOutCounts_When_StoredItemsExist() {
        // given
        mockCurrentUser(1L, 10L, "John Doe");
        LocalDate today = LocalDate.now();

        FridgeItemProjection expiredItem = Mockito.mock(FridgeItemProjection.class);
        when(expiredItem.getExpiryDate()).thenReturn(today.minusDays(1));
        when(expiredItem.getQuantity()).thenReturn(BigDecimal.valueOf(5));
        when(expiredItem.getUnit()).thenReturn("quả");

        FridgeItemProjection expiringSoonItem = Mockito.mock(FridgeItemProjection.class);
        when(expiringSoonItem.getExpiryDate()).thenReturn(today.plusDays(2));
        when(expiringSoonItem.getQuantity()).thenReturn(BigDecimal.valueOf(10));
        when(expiringSoonItem.getUnit()).thenReturn("quả");

        FridgeItemProjection almostOutItem = Mockito.mock(FridgeItemProjection.class);
        when(almostOutItem.getExpiryDate()).thenReturn(today.plusDays(10));
        when(almostOutItem.getQuantity()).thenReturn(BigDecimal.valueOf(1));
        when(almostOutItem.getUnit()).thenReturn("quả");

        when(fridgeItemRepository.findByFamilyIdAndStatusWithFoodName(10L, FridgeItemStatus.STORED))
                .thenReturn(List.of(expiredItem, expiringSoonItem, almostOutItem));

        // when
        FridgeOverviewResponse overview = fridgeItemService.getOverview();

        // then
        assertThat(overview).isNotNull();
        assertThat(overview.getTotalStored()).isEqualTo(3);
        assertThat(overview.getExpiredCount()).isEqualTo(1);
        assertThat(overview.getExpiringSoonCount()).isEqualTo(1);
        assertThat(overview.getAlmostOutCount()).isEqualTo(1);
        assertThat(overview.getStatus()).isEqualTo("NEEDS_ATTENTION");
    }

    @Test
    void should_ReturnOverviewWithEmptyStatus_When_NoStoredItems() {
        // given
        mockCurrentUser(1L, 10L, "John Doe");
        when(fridgeItemRepository.findByFamilyIdAndStatusWithFoodName(10L, FridgeItemStatus.STORED))
                .thenReturn(List.of());

        // when
        FridgeOverviewResponse overview = fridgeItemService.getOverview();

        // then
        assertThat(overview).isNotNull();
        assertThat(overview.getTotalStored()).isEqualTo(0);
        assertThat(overview.getExpiredCount()).isEqualTo(0);
        assertThat(overview.getStatus()).isEqualTo("EMPTY");
    }

    // --- CASE 3: Xóa đồ khỏi tủ (remove) ---

    @Test
    void should_RemoveFridgeItemSuccessfully_When_ValidRequest() {
        // given
        mockCurrentUser(1L, 10L, "John Doe");
        Long itemId = 123L;
        RemoveFridgeItemRequest request = new RemoveFridgeItemRequest();
        request.setRemovedReason(RemoveReason.USED_UP);

        FridgeItem item = new FridgeItem();
        item.setId(itemId);
        item.setFamilyId(10L);
        item.setStatus(FridgeItemStatus.STORED);
        item.setCustomName("Thịt gà");

        FridgeItem savedItem = new FridgeItem();
        savedItem.setId(itemId);
        savedItem.setFamilyId(10L);
        savedItem.setStatus(FridgeItemStatus.REMOVED);
        savedItem.setRemovedReason(RemoveReason.USED_UP);
        savedItem.setCustomName("Thịt gà");

        FridgeItemResponse responseDto = new FridgeItemResponse();
        responseDto.setId(itemId);
        responseDto.setStatus(FridgeItemStatus.REMOVED);
        responseDto.setRemovedReason(RemoveReason.USED_UP);

        when(fridgeItemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(fridgeItemRepository.save(item)).thenReturn(savedItem);
        when(userRepository.findByFamily_IdOrderByIdAsc(10L)).thenReturn(List.of());
        when(fridgeItemRepository.findDetailedById(itemId)).thenReturn(Optional.empty());
        when(fridgeItemMapper.toResponse(savedItem)).thenReturn(responseDto);

        // when
        FridgeItemResponse result = fridgeItemService.remove(itemId, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(FridgeItemStatus.REMOVED);
        assertThat(result.getRemovedReason()).isEqualTo(RemoveReason.USED_UP);
        verify(fridgeItemRepository).save(item);
    }

    @Test
    void should_ThrowException_When_ItemNotFound() {
        // given
        mockCurrentUser(1L, 10L, "John Doe");
        Long itemId = 123L;
        RemoveFridgeItemRequest request = new RemoveFridgeItemRequest();
        request.setRemovedReason(RemoveReason.USED_UP);

        when(fridgeItemRepository.findById(itemId)).thenReturn(Optional.empty());

        // when / then
        assertThatThrownBy(() -> fridgeItemService.remove(itemId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Fridge item not found");
    }

    @Test
    void should_ThrowException_When_ItemDoesNotBelongToFamily() {
        // given
        mockCurrentUser(1L, 10L, "John Doe");
        Long itemId = 123L;
        RemoveFridgeItemRequest request = new RemoveFridgeItemRequest();
        request.setRemovedReason(RemoveReason.USED_UP);

        FridgeItem item = new FridgeItem();
        item.setId(itemId);
        item.setFamilyId(999L);

        when(fridgeItemRepository.findById(itemId)).thenReturn(Optional.of(item));

        // when / then
        assertThatThrownBy(() -> fridgeItemService.remove(itemId, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(rse.getReason()).isEqualTo("Fridge item not found");
                });
    }

    @Test
    void should_ThrowException_When_RemovedReasonIsOtherAndNoteIsEmpty() {
        // given
        Long itemId = 123L;
        RemoveFridgeItemRequest request = new RemoveFridgeItemRequest();
        request.setRemovedReason(RemoveReason.OTHER);
        request.setRemovedReasonNote("   ");

        // when / then
        assertThatThrownBy(() -> fridgeItemService.remove(itemId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("removedReasonNote is required when removedReason is OTHER");
    }
}
