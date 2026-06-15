package com.mealmate.fridge.mapper;

import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.dto.CreateFridgeItemRequest;
import com.mealmate.fridge.model.dto.FridgeItemResponse;
import com.mealmate.fridge.repository.FridgeItemProjection;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
public class FridgeItemMapper {

    public FridgeItem toEntity(CreateFridgeItemRequest request) {
        FridgeItem item = new FridgeItem();

        item.setFoodId(request.getFoodId());
        item.setCustomName(normalizeBlank(request.getCustomName()));
        item.setQuantity(request.getQuantity());
        item.setStorageLocation(normalizeBlank(request.getStorageLocation()));
        item.setSpecificLocation(normalizeBlank(request.getSpecificLocation()));
        item.setAddedDate(request.getAddedDate() == null ? LocalDate.now() : request.getAddedDate());
        item.setExpiryDate(request.getExpiryDate());
        item.setImageUrl(normalizeBlank(request.getImageUrl()));
        item.setNote(normalizeBlank(request.getNote()));
        item.setUnit(normalizeBlank(request.getUnit()));

        return item;
    }

    public FridgeItemResponse toResponse(FridgeItem item) {
        FridgeItemResponse response = new FridgeItemResponse();

        response.setId(item.getId());
        response.setFamilyId(item.getFamilyId());
        response.setFoodId(item.getFoodId());
        response.setCustomName(item.getCustomName());
        response.setDisplayName(item.getCustomName());
        response.setUnit(item.getUnit());
        response.setPreservationMethods(List.of());
        response.setQuantity(item.getQuantity());
        response.setStorageLocation(item.getStorageLocation());
        response.setSpecificLocation(item.getSpecificLocation());
        response.setAddedDate(item.getAddedDate());
        response.setExpiryDate(item.getExpiryDate());
        response.setStatus(item.getStatus());
        response.setImageUrl(item.getImageUrl());
        response.setNote(item.getNote());
        response.setRemovedReason(item.getRemovedReason());
        response.setRemovedReasonNote(item.getRemovedReasonNote());
        response.setRemovedAt(item.getRemovedAt());
        response.setRemovedBy(item.getRemovedBy());
        response.setCreatedAt(item.getCreatedAt());
        response.setUpdatedAt(item.getUpdatedAt());

        return response;
    }

    public FridgeItemResponse toResponse(FridgeItemProjection projection) {
        FridgeItemResponse response = new FridgeItemResponse();

        response.setId(projection.getId());
        response.setFamilyId(projection.getFamilyId());
        response.setFoodId(projection.getFoodId());
        response.setStandardFoodName(projection.getStandardFoodName());
        response.setCustomName(projection.getCustomName());
        response.setDisplayName(projection.getDisplayName());
        response.setUnit(projection.getUnit());
        response.setCategoryId(projection.getCategoryId());
        response.setCategoryName(projection.getCategoryName());
        response.setCategoryIconKey(projection.getCategoryIconKey());
        response.setCategoryColorCode(projection.getCategoryColorCode());
        response.setPreservationMethods(toPreservationMethods(projection.getPreservationMethodContents()));
        response.setQuantity(projection.getQuantity());
        response.setStorageLocation(projection.getStorageLocation());
        response.setSpecificLocation(projection.getSpecificLocation());
        response.setAddedDate(projection.getAddedDate());
        response.setExpiryDate(projection.getExpiryDate());
        response.setStatus(projection.getStatus());
        response.setImageUrl(projection.getImageUrl());
        response.setNote(projection.getNote());
        response.setRemovedReason(projection.getRemovedReason());
        response.setRemovedReasonNote(projection.getRemovedReasonNote());
        response.setRemovedAt(projection.getRemovedAt());
        response.setRemovedBy(projection.getRemovedBy());
        response.setCreatedAt(projection.getCreatedAt());
        response.setUpdatedAt(projection.getUpdatedAt());

        return response;
    }

    private List<String> toPreservationMethods(String value) {
        if (value == null || value.trim().isEmpty()) {
            return List.of();
        }

        return Arrays.stream(value.split("\\|\\|"))
                .map(String::trim)
                .filter(method -> !method.isEmpty())
                .toList();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
