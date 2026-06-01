package com.mealmate.shopping.service;

import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.shopping.dto.DailyPlanSummaryDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.mapper.ShoppingMapper;
import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import com.mealmate.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class ShoppingListService {
    private final ShoppingListRepository repository;
    private final CategoryRepository categoryRepository;
    private final ShoppingMapper mapper;
    private final ShoppingListItemRepository itemRepository;
    private final UserRepository userRepository;

    public List<ShoppingItemDTO> getPlanDetail(Long familyId, LocalDate date) {
        ShoppingList list = repository.findByFamilyIdAndPlannedDate(familyId, date).orElse(null);
        if (list == null) return Collections.emptyList();
        return list.getItems().stream().map(item -> {
            ShoppingItemDTO dto = mapper.toItemDto(item);
            // Tìm tên Category từ categoryId trong Food
            Long catId = item.getFood().getCategoryId();
            categoryRepository.findById(catId).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
                dto.setFoodIcon(cat.getIconKey());
            });

            if (item.getAssignedTo() != null) {
                userRepository.findById(item.getAssignedTo()).ifPresent(u -> {
                    dto.setAssigneeName(u.getFullName());
                });
            }

            return dto;
        }).collect(Collectors.toList());
    }

    public List<ShoppingList> findAll() {
        return repository.findAll();
    }
    public List<DailyPlanSummaryDTO> getWeeklySummary(Long familyId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        List<ShoppingList> lists = repository.findByFamilyIdAndPlannedDateBetween(familyId, startDate, endDate);

        List<DailyPlanSummaryDTO> summary = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate current = startDate.plusDays(i);
            ShoppingList listOnDate = lists.stream()
                    .filter(l -> l.getPlannedDate().equals(current))
                    .findFirst().orElse(null);
            if (listOnDate != null) {
                long purchased = listOnDate.getItems().stream().filter(ShoppingListItem::getIsPurchased).count();
                summary.add(DailyPlanSummaryDTO.builder()
                        .plannedDate(current.toString())
                        .totalItems(listOnDate.getItems().size())
                        .purchasedItems((int) purchased)
                        .listId(listOnDate.getId())
                        .build());
            } else {
                summary.add(DailyPlanSummaryDTO.builder()
                        .plannedDate(current.toString())
                        .totalItems(0)
                        .purchasedItems(0)
                        .build());
            }
        }
        return summary;
    }

    @Transactional
    public void toggleItemStatus(Long itemId) { // check đã mua
        ShoppingListItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setIsPurchased(!item.getIsPurchased());
    }
}