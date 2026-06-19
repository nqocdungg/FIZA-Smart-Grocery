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
import com.mealmate.shopping.dto.FrequentItemSuggestionDTO;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.dto.ShoppingListRequestDTO;
import com.mealmate.shopping.dto.WeeklyShoppingAggregateDTO;
import com.mealmate.shopping.mapper.ShoppingMapper;
import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.FridgeItemStatus;
import com.mealmate.fridge.repository.FridgeItemRepository;
import java.time.LocalDateTime;

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
    private final FridgeItemRepository fridgeItemRepository;

    @Transactional
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
            if (item.getNote() != null) {
                dto.setNote(item.getNote());
            }

            return dto;
        }).collect(Collectors.toList());
    }

    public List<ShoppingList> findAll() {
        return repository.findAll();
    }

    @Transactional
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
                    .assigneeNames(new ArrayList<>())
                    .listId(null)
                    .note(null);

            if (listOnDate != null) {
                List<Long> assigneeIds = listOnDate.getItems().stream()
                        .map(ShoppingListItem::getAssignedTo)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());

                List<String> names = assigneeIds.stream()
                        .map(id -> userRepository.findById(id)
                                .map(com.mealmate.user.model.User::getFullName)
                                .orElse("Ẩn danh"))
                        .collect(Collectors.toList());

                long purchased = listOnDate.getItems().stream().filter(ShoppingListItem::getIsPurchased).count();
                builder.totalItems(listOnDate.getItems().size())
                        .purchasedItems((int) purchased)
                        .assigneeNames(names)
                        .listId(listOnDate.getId())
                        .note(listOnDate.getNote());
            } else {
                builder.totalItems(0).purchasedItems(0);
            }
            summary.add(builder.build());
        }
        return summary;
    }

    private String getVietnameseDayOfWeek(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.MONDAY) return "Thứ 2";
        if (dayOfWeek == DayOfWeek.TUESDAY) return "Thứ 3";
        if (dayOfWeek == DayOfWeek.WEDNESDAY) return "Thứ 4";
        if (dayOfWeek == DayOfWeek.THURSDAY) return "Thứ 5";
        if (dayOfWeek == DayOfWeek.FRIDAY) return "Thứ 6";
        if (dayOfWeek == DayOfWeek.SATURDAY) return "Thứ 7";
        return "CN";
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

        List<ShoppingListItem> existingItems = new ArrayList<>(list.getItems());
        list.getItems().clear();

        if (request.getItems() != null) {
            for (var dto : request.getItems()) {
                ShoppingListItem item = null;
                if (dto.getId() != null && dto.getId() < 1000000000000L) {
                    item = existingItems.stream()
                            .filter(ei -> ei.getId().equals(dto.getId()))
                            .findFirst()
                            .orElse(null);
                }

                if (item == null) {
                    item = new ShoppingListItem();
                    item.setShoppingList(list);
                    item.setIsPurchased(false);
                }

                var food = foodRepository.findById(dto.getFoodId())
                        .orElseThrow(() -> new RuntimeException("Thực phẩm không tồn tại"));
                item.setFood(food);

                item.setQuantity(dto.getQuantity());
                item.setUnit(dto.getUnit());
                item.setNote(dto.getNote());
                
                item.setCustomName(dto.getCustomName());

                if (food.getName().toLowerCase().contains("khác")) {
                    if (dto.getCustomName() == null || dto.getCustomName().trim().isEmpty()) {
                        throw new IllegalArgumentException("Thực phẩm loại '" + food.getName() + "' bắt buộc phải có tên gợi nhớ (customName).");
                    }
                }

                if (dto.getAssignedTo() != null) {
                    item.setAssignedTo(dto.getAssignedTo());
                } else {
                    item.setAssignedTo((Long) null);
                }

                item.setIsPurchased(dto.getIsPurchased() != null ? dto.getIsPurchased() : false);
                list.getItems().add(item);
            }
        }
        repository.save(list);
        // return list;
    }

    @Transactional
    public void deletePlan(Long listId) {
        if (!repository.existsById(listId)) {
            throw new RuntimeException("Không tìm thấy danh sách cần xóa.");
        }
        repository.deleteById(listId);
    }

    @Transactional
    public void updatePlanNote(Long listId, String note) {
        ShoppingList list = repository.findById(listId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh sách cần cập nhật ghi chú."));
        list.setNote(note);
        repository.save(list);
    }

    @Transactional
    public void updateItemNote(Long itemId, String note) {
        ShoppingListItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thực phẩm cần cập nhật ghi chú."));
        item.setNote(note);
        itemRepository.save(item);
    }

    @Transactional
    public List<WeeklyShoppingAggregateDTO> getWeeklyAggregation(Long familyId, LocalDate startDate) {
        LocalDate monday = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        List<ShoppingList> lists = repository.findByFamilyIdAndPlannedDateBetween(familyId, monday, sunday);

        // Group by foodId and customName (case-insensitive, trimmed)
        java.util.Map<String, List<ShoppingListItem>> groupedByFood = lists.stream()
                .flatMap(list -> list.getItems().stream())
                .collect(Collectors.groupingBy(item -> {
                    String custom = item.getCustomName() != null ? item.getCustomName().trim().toLowerCase() : "";
                    return item.getFood().getId() + "_" + custom;
                }));

        List<WeeklyShoppingAggregateDTO> result = new ArrayList<>();

        for (java.util.Map.Entry<String, List<ShoppingListItem>> entry : groupedByFood.entrySet()) {
            List<ShoppingListItem> items = entry.getValue();

            ShoppingListItem firstItem = items.get(0);
            Long foodId = firstItem.getFood().getId();
            String foodName = firstItem.getCustomName() != null ? firstItem.getCustomName() : firstItem.getFood().getName();
            String unit = firstItem.getUnit();

            // Find Category
            final String[] categoryName = {"Khác"};
            final String[] foodIcon = {"📦"};
            Long catId = firstItem.getFood().getCategoryId();
            categoryRepository.findById(catId).ifPresent(cat -> {
                categoryName[0] = cat.getName();
                foodIcon[0] = cat.getIconKey();
            });

            double totalQuantity = items.stream().mapToDouble(ShoppingListItem::getQuantity).sum();
            boolean isAllPurchased = items.stream().allMatch(ShoppingListItem::getIsPurchased);

            List<Long> itemIds = items.stream().map(ShoppingListItem::getId).collect(Collectors.toList());

            // Collect neededDays based on plannedDate of the shopping list
            List<String> neededDays = items.stream()
                    .map(item -> item.getShoppingList().getPlannedDate())
                    .distinct()
                    .sorted()
                    .map(this::getVietnameseDayOfWeek)
                    .collect(Collectors.toList());

            result.add(WeeklyShoppingAggregateDTO.builder()
                    .foodId(foodId)
                    .foodName(foodName)
                    .customName(firstItem.getCustomName())
                    .categoryName(categoryName[0])
                    .foodIcon(foodIcon[0])
                    .totalQuantity(totalQuantity)
                    .unit(unit)
                    .neededDays(neededDays)
                    .isPurchased(isAllPurchased)
                    .itemIds(itemIds)
                    .build());
        }

        return result;
    }

    @Transactional
    public void toggleWeeklyItemStatus(Long familyId, Long foodId, LocalDate startDate, boolean isPurchased, String customName) {
        LocalDate monday = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        List<ShoppingList> lists = repository.findByFamilyIdAndPlannedDateBetween(familyId, monday, sunday);

        List<ShoppingListItem> itemsToUpdate = lists.stream()
                .flatMap(list -> list.getItems().stream())
                .filter(item -> item.getFood().getId().equals(foodId))
                .filter(item -> {
                    if (customName == null || customName.trim().isEmpty()) {
                        return item.getCustomName() == null;
                    }
                    return customName.equalsIgnoreCase(item.getCustomName());
                })
                .collect(Collectors.toList());

        for (ShoppingListItem item : itemsToUpdate) {
            item.setIsPurchased(isPurchased);
        }
        itemRepository.saveAll(itemsToUpdate);
    }

    @Transactional
    public void importToFridge(Long listId) {
        ShoppingList list = repository.findById(listId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh sách đi chợ."));

        List<ShoppingListItem> itemsToImport = list.getItems().stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsPurchased()) && item.getImportedToFridgeAt() == null)
                .collect(Collectors.toList());

        for (ShoppingListItem item : itemsToImport) {
            FridgeItem fridgeItem = new FridgeItem();
            fridgeItem.setFamilyId(list.getFamilyId());
            fridgeItem.setFoodId(item.getFood().getId());
            fridgeItem.setQuantity(java.math.BigDecimal.valueOf(item.getQuantity()));
            fridgeItem.setCustomName(item.getCustomName() != null ? item.getCustomName() : item.getFood().getName());
            fridgeItem.setStatus(FridgeItemStatus.STORED);
            fridgeItem.setAddedDate(LocalDate.now());
            fridgeItem.setUnit(item.getUnit());

            FridgeItem savedFridgeItem = fridgeItemRepository.save(fridgeItem);

            item.setImportedToFridgeAt(LocalDateTime.now());
            item.setFridgeItem(savedFridgeItem);
        }

        itemRepository.saveAll(itemsToImport);
    }

    public List<FrequentItemSuggestionDTO> getFrequentItems(Long familyId) {
        return itemRepository.findFrequentItems(familyId).stream()
                .map(p -> new FrequentItemSuggestionDTO(p.getId(), p.getFoodName(), p.getUnit()))
                .collect(Collectors.toList());
    }
}
