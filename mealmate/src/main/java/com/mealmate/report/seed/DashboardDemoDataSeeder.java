package com.mealmate.report.seed;

import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.math.RoundingMode;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed-dashboard", name = "enabled", havingValue = "true")
public class DashboardDemoDataSeeder implements CommandLineRunner {

    private static final String SEED_NOTE = "[DASHBOARD_SEED]";
    private static final String STATUS_STORED = "STORED";
    private static final String STATUS_USED = "USED";
    private static final String STATUS_EXPIRED = "EXPIRED";

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final FoodRepository foodRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.seed-dashboard.days:90}")
    private int seedDays;

    @Override
    public void run(String... args) {
        Long familyId = resolveFamilyId();
        if (familyId == null) {
            log.warn("Skip dashboard seed: no user with family found.");
            return;
        }

        List<Long> foodIds = ensureSeedFoods();
        if (foodIds.isEmpty()) {
            log.warn("Skip dashboard seed: no foods available.");
            return;
        }

        clearOldSeedData(familyId);
        int inserted = insertFridgeTimeline(familyId, foodIds);
        log.info("Dashboard demo data seeded for familyId={} with {} fridge items.", familyId, inserted);
    }

    private Long resolveFamilyId() {
        for (User user : userRepository.findAll()) {
            if (user.getFamily() != null && user.getFamily().getId() != null) {
                return user.getFamily().getId();
            }
        }
        return null;
    }

    private List<Long> ensureSeedFoods() {
        Long vegetable = ensureCategory("Rau cu", "vegetable", "#B2EBD9");
        Long fruit = ensureCategory("Trai cay", "fruit", "#FFE1A8");
        Long meat = ensureCategory("Thit", "meat", "#FFD6D6");
        Long seafood = ensureCategory("Hai san", "seafood", "#D7ECFF");
        Long dairy = ensureCategory("Sua", "dairy", "#F3E8FF");

        List<Long> ids = new ArrayList<>();
        ids.add(ensureFood("Ca chua", "qua", vegetable));
        ids.add(ensureFood("Rau cai", "bo", vegetable));
        ids.add(ensureFood("Tao", "qua", fruit));
        ids.add(ensureFood("Chuoi", "qua", fruit));
        ids.add(ensureFood("Thit bo", "g", meat));
        ids.add(ensureFood("Thit ga", "g", meat));
        ids.add(ensureFood("Ca hoi", "g", seafood));
        ids.add(ensureFood("Tom", "g", seafood));
        ids.add(ensureFood("Sua tuoi", "ml", dairy));
        ids.add(ensureFood("Sua chua", "hop", dairy));
        return ids;
    }

    private Long ensureCategory(String name, String iconKey, String colorCode) {
        return categoryRepository.findByNameIgnoreCase(name)
                .map(existing -> {
                    boolean changed = false;
                    if (existing.getIconKey() == null || existing.getIconKey().isBlank()) {
                        existing.setIconKey(iconKey);
                        changed = true;
                    }
                    if (existing.getColorCode() == null || existing.getColorCode().isBlank()) {
                        existing.setColorCode(colorCode);
                        changed = true;
                    }
                    if (changed) {
                        return categoryRepository.save(existing).getId();
                    }
                    return existing.getId();
                })
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(name);
                    category.setIconKey(iconKey);
                    category.setColorCode(colorCode);
                    return categoryRepository.save(category).getId();
                });
    }

    private Long ensureFood(String name, String unit, Long categoryId) {
        return foodRepository.findByNameIgnoreCase(name)
                .map(existing -> {
                    boolean changed = false;
                    if (existing.getCategoryId() == null || !existing.getCategoryId().equals(categoryId)) {
                        existing.setCategoryId(categoryId);
                        changed = true;
                    }
                    if (existing.getUnit() == null || existing.getUnit().isBlank()) {
                        existing.setUnit(unit);
                        changed = true;
                    }
                    if (changed) {
                        return foodRepository.save(existing).getId();
                    }
                    return existing.getId();
                })
                .orElseGet(() -> {
                    Food food = new Food();
                    food.setName(name);
                    food.setUnit(unit);
                    food.setCategoryId(categoryId);
                    food.setIsSystem(Boolean.TRUE);
                    return foodRepository.save(food).getId();
                });
    }

    private void clearOldSeedData(Long familyId) {
        jdbcTemplate.update(
                "delete from fridge_items where family_id = ? and note = ?",
                familyId,
                SEED_NOTE
        );
    }

    private int insertFridgeTimeline(Long familyId, List<Long> foodIds) {
        Random random = new Random();
        LocalDate today = LocalDate.now();
        int total = 0;
        int days = Math.max(seedDays, 14);

        for (int offset = days - 1; offset >= 0; offset--) {
            LocalDate addedDate = today.minusDays(offset);
            int itemsPerDay = 1 + random.nextInt(3);

            for (int i = 0; i < itemsPerDay; i++) {
                Long foodId = foodIds.get(random.nextInt(foodIds.size()));
                BigDecimal quantity = BigDecimal.valueOf(0.2 + (4.8 * random.nextDouble()))
                        .setScale(2, RoundingMode.HALF_UP);

                String storageLocation = switch (random.nextInt(3)) {
                    case 0 -> "COOL";
                    case 1 -> "FREEZER";
                    default -> "DRY";
                };

                int daysAgo = (int) (today.toEpochDay() - addedDate.toEpochDay());
                String status = pickStatus(daysAgo, random);

                LocalDate expiryDate = addedDate.plusDays(2 + random.nextInt(18));
                LocalDateTime createdAt = addedDate.atTime(7 + random.nextInt(4), random.nextInt(60));
                LocalDateTime updatedAt = deriveUpdatedAt(status, addedDate, expiryDate, today, random);
                if (updatedAt.isBefore(createdAt)) {
                    updatedAt = createdAt.plusHours(1);
                }

                String removedReason = null;
                LocalDateTime removedAt = null;
                if (STATUS_EXPIRED.equals(status)) {
                    removedReason = "EXPIRED_DISCARDED";
                    removedAt = updatedAt;
                } else if (STATUS_USED.equals(status)) {
                    removedReason = "USED_UP";
                    removedAt = updatedAt;
                }

                jdbcTemplate.update("""
                        insert into fridge_items
                        (family_id, food_id, quantity, storage_location, specific_location, added_date, expiry_date,
                         status, note, removed_reason, removed_at, created_at, updated_at)
                        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        familyId,
                        foodId,
                        quantity,
                        storageLocation,
                        null,
                        Date.valueOf(addedDate),
                        Date.valueOf(expiryDate),
                        status,
                        SEED_NOTE,
                        removedReason,
                        removedAt == null ? null : Timestamp.valueOf(removedAt),
                        Timestamp.valueOf(createdAt),
                        Timestamp.valueOf(updatedAt)
                );
                total++;
            }
        }
        return total;
    }

    private String pickStatus(int daysAgo, Random random) {
        double roll = random.nextDouble();
        if (daysAgo > 20) {
            if (roll < 0.65) return STATUS_USED;
            if (roll < 0.85) return STATUS_EXPIRED;
            return STATUS_STORED;
        }
        if (daysAgo > 7) {
            if (roll < 0.45) return STATUS_USED;
            if (roll < 0.60) return STATUS_EXPIRED;
            return STATUS_STORED;
        }
        if (roll < 0.20) return STATUS_USED;
        if (roll < 0.25) return STATUS_EXPIRED;
        return STATUS_STORED;
    }

    private LocalDateTime deriveUpdatedAt(
            String status,
            LocalDate addedDate,
            LocalDate expiryDate,
            LocalDate today,
            Random random
    ) {
        if (STATUS_USED.equals(status)) {
            LocalDate usedDate = addedDate.plusDays(1 + random.nextInt(10));
            if (usedDate.isAfter(today)) usedDate = today;
            return usedDate.atTime(9 + random.nextInt(10), random.nextInt(60));
        }
        if (STATUS_EXPIRED.equals(status)) {
            LocalDate expiredDate = expiryDate.plusDays(random.nextInt(3));
            if (expiredDate.isAfter(today)) expiredDate = today;
            return expiredDate.atTime(8 + random.nextInt(10), random.nextInt(60));
        }
        LocalDate touchedDate = today.minusDays(random.nextInt(3));
        if (touchedDate.isBefore(addedDate)) touchedDate = addedDate;
        return touchedDate.atTime(8 + random.nextInt(10), random.nextInt(60));
    }
}
