package com.mealmate.fridge.service;

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
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FridgeItemService {

    private final FridgeItemRepository fridgeItemRepository;
    private final FridgeItemMapper fridgeItemMapper;

    public FridgeItemService(
            FridgeItemRepository fridgeItemRepository,
            FridgeItemMapper fridgeItemMapper
    ) {
        this.fridgeItemRepository = fridgeItemRepository;
        this.fridgeItemMapper = fridgeItemMapper;
    }

    public List<FridgeItemResponse> getStoredItems(Long familyId) {
        return fridgeItemRepository
                .findByFamilyIdAndStatusWithFoodName(familyId, FridgeItemStatus.STORED)
                .stream()
                .map(fridgeItemMapper::toResponse)
                .toList();
    }

    public List<FridgeItemResponse> searchStoredItems(Long familyId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getStoredItems(familyId);
        }

        List<FridgeItemProjection> items = fridgeItemRepository.searchStoredItems(
                familyId,
                FridgeItemStatus.STORED,
                keyword.trim()
        );

        return items.stream()
                .map(fridgeItemMapper::toResponse)
                .toList();
    }

    @Transactional
    public FridgeItemResponse create(CreateFridgeItemRequest request) {
        validateCreateRequest(request);

        FridgeItem item = fridgeItemMapper.toEntity(request);
        item.setStatus(FridgeItemStatus.STORED);

        FridgeItem saved = fridgeItemRepository.save(item);
        return fridgeItemMapper.toResponse(saved);
    }

    @Transactional
    public FridgeItemResponse update(Long id, UpdateFridgeItemRequest request) {
        FridgeItem item = fridgeItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fridge item not found"));

        if (FridgeItemStatus.REMOVED.equals(item.getStatus())) {
            throw new IllegalStateException("Removed fridge item cannot be updated");
        }

        if (request.getFoodId() != null) {
            item.setFoodId(request.getFoodId());
        }
        if (request.getCustomName() != null) {
            item.setCustomName(normalizeBlank(request.getCustomName()));
        }
        if (request.getQuantity() != null) {
            item.setQuantity(request.getQuantity());
        }
        if (request.getStorageLocation() != null) {
            item.setStorageLocation(normalizeBlank(request.getStorageLocation()));
        }
        if (request.getSpecificLocation() != null) {
            item.setSpecificLocation(normalizeBlank(request.getSpecificLocation()));
        }
        if (request.getAddedDate() != null) {
            item.setAddedDate(request.getAddedDate());
        }
        if (request.getExpiryDate() != null) {
            item.setExpiryDate(request.getExpiryDate());
        }
        if (request.getImageUrl() != null) {
            item.setImageUrl(normalizeBlank(request.getImageUrl()));
        }
        if (request.getNote() != null) {
            item.setNote(normalizeBlank(request.getNote()));
        }

        FridgeItem saved = fridgeItemRepository.save(item);
        return fridgeItemMapper.toResponse(saved);
    }

    @Transactional
    public FridgeItemResponse remove(Long id, RemoveFridgeItemRequest request) {
        validateRemoveRequest(request);

        FridgeItem item = fridgeItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fridge item not found"));

        if (FridgeItemStatus.REMOVED.equals(item.getStatus())) {
            return fridgeItemMapper.toResponse(item);
        }

        item.setStatus(FridgeItemStatus.REMOVED);
        item.setRemovedReason(request.getRemovedReason());
        item.setRemovedReasonNote(normalizeBlank(request.getRemovedReasonNote()));
        item.setRemovedBy(request.getRemovedBy());
        item.setRemovedAt(LocalDateTime.now());

        FridgeItem saved = fridgeItemRepository.save(item);
        return fridgeItemMapper.toResponse(saved);
    }

    public long countStoredItems(Long familyId) {
        return fridgeItemRepository.countStoredByFamilyId(familyId);
    }

    private void validateCreateRequest(CreateFridgeItemRequest request) {
        if (request.getFamilyId() == null) {
            throw new IllegalArgumentException("familyId is required");
        }

        if (request.getFoodId() == null) {
            throw new IllegalArgumentException("foodId is required");
        }

        if (request.getQuantity() == null || request.getQuantity().signum() <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }
    }

    private void validateRemoveRequest(RemoveFridgeItemRequest request) {
        if (request.getRemovedReason() == null || request.getRemovedReason().trim().isEmpty()) {
            throw new IllegalArgumentException("removedReason is required");
        }

        if (RemoveReason.OTHER.equals(request.getRemovedReason())
                && (request.getRemovedReasonNote() == null || request.getRemovedReasonNote().trim().isEmpty())) {
            throw new IllegalArgumentException("removedReasonNote is required when removedReason is OTHER");
        }

        if (request.getRemovedBy() == null) {
            throw new IllegalArgumentException("removedBy is required");
        }
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}