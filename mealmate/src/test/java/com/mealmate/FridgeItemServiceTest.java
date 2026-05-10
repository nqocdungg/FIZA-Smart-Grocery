package com.mealmate;

import com.mealmate.fridge.mapper.FridgeItemMapper;
import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.FridgeItemStatus;
import com.mealmate.fridge.model.RemoveReason;
import com.mealmate.fridge.model.dto.CreateFridgeItemRequest;
import com.mealmate.fridge.model.dto.FridgeItemResponse;
import com.mealmate.fridge.model.dto.RemoveFridgeItemRequest;
import com.mealmate.fridge.model.dto.UpdateFridgeItemRequest;
import com.mealmate.fridge.repository.FridgeItemProjection;
import com.mealmate.fridge.repository.FridgeItemRepository;
import com.mealmate.fridge.service.FridgeItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FridgeItemServiceTest {

    @Mock
    private FridgeItemRepository fridgeItemRepository;

    @Mock
    private FridgeItemMapper fridgeItemMapper;

    @InjectMocks
    private FridgeItemService fridgeItemService;

    private FridgeItem mockFridgeItem;
    private FridgeItemResponse mockFridgeItemResponse;

    @BeforeEach
    void setUp() {
        mockFridgeItem = new FridgeItem();
        mockFridgeItem.setId(1L);
        mockFridgeItem.setFamilyId(1L);
        mockFridgeItem.setFoodId(10L);
        mockFridgeItem.setQuantity(new BigDecimal("500"));
        mockFridgeItem.setStatus(FridgeItemStatus.STORED);

        mockFridgeItemResponse = new FridgeItemResponse();
        mockFridgeItemResponse.setId(1L);
        mockFridgeItemResponse.setFamilyId(1L);
        mockFridgeItemResponse.setFoodId(10L);
        mockFridgeItemResponse.setQuantity(new BigDecimal("500"));
        mockFridgeItemResponse.setStatus(FridgeItemStatus.STORED);
    }

    @Test
    void getStoredItems_ShouldReturnListOfItems() {
        FridgeItemProjection mockProjection = mock(FridgeItemProjection.class);

        when(fridgeItemRepository.findByFamilyIdAndStatusWithFoodName(1L, FridgeItemStatus.STORED))
                .thenReturn(List.of(mockProjection));
        when(fridgeItemMapper.toResponse(mockProjection)).thenReturn(mockFridgeItemResponse);

        List<FridgeItemResponse> result = fridgeItemService.getStoredItems(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        verify(fridgeItemRepository).findByFamilyIdAndStatusWithFoodName(1L, FridgeItemStatus.STORED);
    }

    @Test
    void searchStoredItems_WithBlankKeyword_ShouldReturnAllStoredItems() {
        FridgeItemProjection mockProjection = mock(FridgeItemProjection.class);

        when(fridgeItemRepository.findByFamilyIdAndStatusWithFoodName(1L, FridgeItemStatus.STORED))
                .thenReturn(List.of(mockProjection));
        when(fridgeItemMapper.toResponse(mockProjection)).thenReturn(mockFridgeItemResponse);

        List<FridgeItemResponse> result = fridgeItemService.searchStoredItems(1L, "   ");

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(fridgeItemRepository).findByFamilyIdAndStatusWithFoodName(1L, FridgeItemStatus.STORED);
        verify(fridgeItemRepository, never()).searchStoredItems(anyLong(), anyString(), anyString());
    }

    @Test
    void searchStoredItems_WithKeyword_ShouldReturnMatchingItems() {
        FridgeItemProjection mockProjection = mock(FridgeItemProjection.class);

        when(fridgeItemRepository.searchStoredItems(1L, FridgeItemStatus.STORED, "apple"))
                .thenReturn(List.of(mockProjection));
        when(fridgeItemMapper.toResponse(mockProjection)).thenReturn(mockFridgeItemResponse);

        List<FridgeItemResponse> result = fridgeItemService.searchStoredItems(1L, " apple ");

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(fridgeItemRepository).searchStoredItems(1L, FridgeItemStatus.STORED, "apple");
    }

    @Test
    void create_ShouldSaveAndReturnItem() {
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFamilyId(1L);
        request.setFoodId(10L);
        request.setQuantity(new BigDecimal("500"));

        when(fridgeItemMapper.toEntity(request)).thenReturn(mockFridgeItem);
        when(fridgeItemRepository.save(any(FridgeItem.class))).thenReturn(mockFridgeItem);
        when(fridgeItemMapper.toResponse(mockFridgeItem)).thenReturn(mockFridgeItemResponse);

        FridgeItemResponse result = fridgeItemService.create(request);

        assertNotNull(result);
        assertEquals(FridgeItemStatus.STORED, mockFridgeItem.getStatus());
        verify(fridgeItemRepository).save(mockFridgeItem);
    }

    @Test
    void create_WithoutFoodId_ShouldThrowException() {
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFamilyId(1L);
        request.setQuantity(new BigDecimal("500"));

        assertThrows(IllegalArgumentException.class, () -> fridgeItemService.create(request));
        verify(fridgeItemRepository, never()).save(any());
    }

    @Test
    void create_WithoutFamilyId_ShouldThrowException() {
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFoodId(10L);
        request.setQuantity(new BigDecimal("500"));

        assertThrows(IllegalArgumentException.class, () -> fridgeItemService.create(request));
        verify(fridgeItemRepository, never()).save(any());
    }

    @Test
    void create_WithInvalidQuantity_ShouldThrowException() {
        CreateFridgeItemRequest request = new CreateFridgeItemRequest();
        request.setFamilyId(1L);
        request.setFoodId(10L);
        request.setQuantity(new BigDecimal("-5"));

        assertThrows(IllegalArgumentException.class, () -> fridgeItemService.create(request));
        verify(fridgeItemRepository, never()).save(any());
    }

    @Test
    void update_ShouldUpdateAndReturnItem() {
        UpdateFridgeItemRequest request = new UpdateFridgeItemRequest();
        request.setQuantity(new BigDecimal("200"));
        request.setCustomName("Updated Name");

        when(fridgeItemRepository.findById(1L)).thenReturn(Optional.of(mockFridgeItem));
        when(fridgeItemRepository.save(any(FridgeItem.class))).thenReturn(mockFridgeItem);
        when(fridgeItemMapper.toResponse(mockFridgeItem)).thenReturn(mockFridgeItemResponse);

        FridgeItemResponse result = fridgeItemService.update(1L, request);

        assertNotNull(result);
        assertEquals(new BigDecimal("200"), mockFridgeItem.getQuantity());
        assertEquals("Updated Name", mockFridgeItem.getCustomName());
        verify(fridgeItemRepository).save(mockFridgeItem);
    }

    @Test
    void update_RemovedItem_ShouldThrowException() {
        UpdateFridgeItemRequest request = new UpdateFridgeItemRequest();
        mockFridgeItem.setStatus(FridgeItemStatus.REMOVED);

        when(fridgeItemRepository.findById(1L)).thenReturn(Optional.of(mockFridgeItem));

        assertThrows(IllegalStateException.class, () -> fridgeItemService.update(1L, request));
        verify(fridgeItemRepository, never()).save(any());
    }

    @Test
    void remove_ShouldMarkAsRemovedAndReturnItem() {
        RemoveFridgeItemRequest request = new RemoveFridgeItemRequest();
        request.setRemovedReason(RemoveReason.USED_UP);
        request.setRemovedBy(99L);

        when(fridgeItemRepository.findById(1L)).thenReturn(Optional.of(mockFridgeItem));
        when(fridgeItemRepository.save(any(FridgeItem.class))).thenReturn(mockFridgeItem);
        when(fridgeItemMapper.toResponse(mockFridgeItem)).thenReturn(mockFridgeItemResponse);

        FridgeItemResponse result = fridgeItemService.remove(1L, request);

        assertNotNull(result);
        assertEquals(FridgeItemStatus.REMOVED, mockFridgeItem.getStatus());
        assertEquals(RemoveReason.USED_UP, mockFridgeItem.getRemovedReason());
        assertEquals(99L, mockFridgeItem.getRemovedBy());
        assertNotNull(mockFridgeItem.getRemovedAt());
        verify(fridgeItemRepository).save(mockFridgeItem);
    }

    @Test
    void remove_WithOtherReasonButNoNote_ShouldThrowException() {
        RemoveFridgeItemRequest request = new RemoveFridgeItemRequest();
        request.setRemovedReason(RemoveReason.OTHER);
        request.setRemovedBy(99L);

        assertThrows(IllegalArgumentException.class, () -> fridgeItemService.remove(1L, request));
        verify(fridgeItemRepository, never()).save(any());
    }

    @Test
    void countStoredItems_ShouldReturnCount() {
        when(fridgeItemRepository.countStoredByFamilyId(1L)).thenReturn(5L);

        long count = fridgeItemService.countStoredItems(1L);

        assertEquals(5L, count);
        verify(fridgeItemRepository).countStoredByFamilyId(1L);
    }
}