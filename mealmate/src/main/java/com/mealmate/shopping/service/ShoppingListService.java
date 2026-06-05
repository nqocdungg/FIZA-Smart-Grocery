package com.mealmate.shopping.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.shopping.dto.DailyPlanSummaryDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.dto.ShoppingListRequestDTO;
import com.mealmate.shopping.mapper.ShoppingMapper;
import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShoppingListService {
    private final ShoppingListRepository repository;
    private final CategoryRepository categoryRepository;
    private final ShoppingMapper mapper;
    private final ShoppingListItemRepository itemRepository;
    private final UserRepository userRepository;
    private final FoodRepository foodRepository;
    private final FamilyRepository familyRepository;

    public List<ShoppingItemDTO> getPlanDetail(Long familyId, LocalDate date) {
        ShoppingList list = repository.findByFamilyIdAndPlannedDate(familyId, date).orElse(null);
        if (list == null)
            return Collections.emptyList();
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

    public List<DailyPlanSummaryDTO> getWeeklySummary(Long familyId, LocalDate selectedDate) {
        LocalDate monday = selectedDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        List<ShoppingList> lists = repository.findByFamilyIdAndPlannedDateBetween(familyId, monday, sunday);

        List<DailyPlanSummaryDTO> summary = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate current = monday.plusDays(i);
            String dayOfWeekStr = getVietnameseDayOfWeek(current);
            String displayDateStr = current.getDayOfMonth() + "/" + current.getMonthValue();

            ShoppingList listOnDate = lists.stream()
                    .filter(l -> l.getPlannedDate().equals(current))
                    .findFirst().orElse(null);

            DailyPlanSummaryDTO.DailyPlanSummaryDTOBuilder builder = DailyPlanSummaryDTO.builder()
                    .plannedDate(current.toString())
                    .dayOfWeek(dayOfWeekStr)
                    .displayDate(displayDateStr)
                    .assigneeNames(new ArrayList<>());

            if (listOnDate != null) {
                long purchased = listOnDate.getItems().stream().filter(ShoppingListItem::getIsPurchased).count();
                builder.totalItems(listOnDate.getItems().size())
                        .purchasedItems((int) purchased)
                        .listId(listOnDate.getId());
            } else {
                builder.totalItems(0).purchasedItems(0);
            }
            summary.add(builder.build());
        }
        return summary;
    }

    private String getVietnameseDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "CN";
        };
    }

    @Transactional
    public void toggleItemStatus(Long itemId) { // check đã mua
        ShoppingListItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setIsPurchased(!item.getIsPurchased());
    }

    @Transactional
    public void savePlan(ShoppingListRequestDTO request) { // lưu kế hoạch đi chợ
        ShoppingList list = repository.findByFamilyIdAndPlannedDate(request.getFamilyId(), request.getPlannedDate())
                .orElse(new ShoppingList());

        var family = familyRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new RuntimeException("Family không tồn tại"));

        list.setFamilyId(request.getFamilyId());
        list.setPlannedDate(request.getPlannedDate());
        list.setNote(request.getNote());

        if (list.getCreatedBy() == null) {
            list.setCreatedBy(1L); // neu k tim thay, cho la admin tao
        }

        ShoppingList savedList = repository.save(list);

        itemRepository.deleteByShoppingListId(savedList.getId());
        if (request.getItems() != null) {
            List<ShoppingListItem> newItems = request.getItems().stream().map(dto -> {
                ShoppingListItem item = new ShoppingListItem();
                item.setShoppingList(savedList);

                var food = foodRepository.findById(dto.getFoodId())
                        .orElseThrow(() -> new RuntimeException("Thực phẩm không tồn tại"));
                item.setFood(food);

                item.setQuantity(dto.getQuantity());
                item.setUnit(dto.getUnit());
                item.setNote(dto.getNote());

                // Tìm Người phụ trách
                if (dto.getAssignedTo() != null) {
                    item.setAssignedTo(dto.getAssignedTo());
                }

                item.setIsPurchased(false);
                return item;
            }).collect(Collectors.toList());

            itemRepository.saveAll(newItems);
        }
        // return savedList;
    }

    @Transactional
    public void deletePlan(Long listId) {
        if (!repository.existsById(listId)) {
            throw new RuntimeException("Không tìm thấy danh sách cần xóa.");
        }
        repository.deleteById(listId);
    }

}