package com.mealmate.shopping.service;

import com.mealmate.shopping.dto.DailyPlanSummaryDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.mapper.ShoppingMapper;
import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository repository;
    private final ShoppingListItemRepository itemRepository;
    private final ShoppingMapper mapper;

    public List<ShoppingList> findAll() {
        return repository.findAll();
    }
    public List<DailyPlanSummaryDTO> getWeeklySummary(Long familyId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        List<ShoppingList> lists = repository.findByFamilyIdAndPlannedDateBetween(familyId, startDate, endDate);
        return lists.stream().map(list -> {
            long purchased = list.getItems().stream().filter(ShoppingListItem::getIsPurchased).count();
            List<String> names = list.getItems().stream()
                    .filter(i -> i.getAssignedTo() != null)
                    .map(i -> i.getAssignedTo().getFullName())
                    .distinct().collect(Collectors.toList());

            return DailyPlanSummaryDTO.builder()
                    .plannedDate(list.getPlannedDate().toString())
                    .totalItems(list.getItems().size())
                    .purchasedItems((int) purchased)
                    .assigneeNames(names)
                    .listId(list.getId())
                    .build();
        }).collect(Collectors.toList());
    }

    public List<ShoppingItemDTO> getPlanDetail(Long familyId, LocalDate date) {
        return repository.findByFamilyIdAndPlannedDate(familyId, date)
                .map(list -> list.getItems().stream()
                        .map(mapper::toItemDto)
                        .collect(Collectors.toList()))
                .orElse(Collections.emptyList());
    }

    @Transactional
    public void toggleItemStatus(Long itemId) {
        ShoppingListItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món đồ"));
        item.setIsPurchased(!item.getIsPurchased());
        itemRepository.save(item);
    }
}
