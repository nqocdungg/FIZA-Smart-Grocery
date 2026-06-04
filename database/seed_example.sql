-- =====================================================
-- MealMate seed data for recommendation demo
-- Run after database/db.sql
-- =====================================================

BEGIN;

TRUNCATE TABLE
    role_permissions,
    permissions,
    recipe_tag_items,
    recipe_tags,
    user_recipe_history,
    user_favorite_recipes,
    custom_recipes,
    meal_items,
    meals,
    menus,
    recipe_ingredients,
    recipes,
    shopping_list_items,
    shopping_lists,
    fridge_items,
    preservation_methods,
    unit_conversions,
    foods,
    categories,
    families,
    users,
    roles
RESTART IDENTITY CASCADE;

INSERT INTO roles (name, description, is_active)
VALUES
    ('ADMIN', 'System administrator', TRUE),
    ('CUSTOMER', 'Family user', TRUE);

INSERT INTO users (family_id, role_id, email, password_hash, full_name, email_verified)
SELECT NULL, r.id, 'admin@mealmate.local', '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', 'Admin MealMate', TRUE
FROM roles r WHERE r.name = 'ADMIN';

INSERT INTO users (family_id, role_id, email, password_hash, full_name, email_verified)
SELECT NULL, r.id, 'user@mealmate.local', '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', 'Nguyen Minh Quang', TRUE
FROM roles r WHERE r.name = 'CUSTOMER';

INSERT INTO users (family_id, role_id, email, password_hash, full_name, email_verified)
SELECT NULL, r.id, 'member@mealmate.local', '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', 'Tran Thu Ha', TRUE
FROM roles r WHERE r.name = 'CUSTOMER';

INSERT INTO families (name, housekeeper_id)
SELECT 'Family Quang', u.id
FROM users u
WHERE u.email = 'user@mealmate.local';

UPDATE users
SET family_id = (SELECT id FROM families WHERE name = 'Family Quang')
WHERE email IN ('user@mealmate.local', 'member@mealmate.local');

INSERT INTO categories (name, icon_key, color_code)
VALUES
    ('Vegetables', 'vegetable', '#E8F5E9'),
    ('Fruits', 'fruit', '#FFF3E0'),
    ('Meat', 'meat', '#FFEBEE'),
    ('Seafood', 'seafood', '#E3F2FD'),
    ('Egg and Dairy', 'dairy', '#FFFDE7'),
    ('Dry food', 'dry-food', '#F3E5F5'),
    ('Spice', 'spice', '#FBE9E7');

INSERT INTO foods (category_id, name, unit, synonyms, is_system)
SELECT c.id, v.food_name, v.unit, v.synonyms, TRUE
FROM (
    VALUES
        ('Vegetables', 'Tomato', 'g', 'ca chua'),
        ('Vegetables', 'Carrot', 'g', 'ca rot'),
        ('Vegetables', 'Spinach', 'g', 'rau cai'),
        ('Vegetables', 'Garlic', 'g', 'toi'),
        ('Vegetables', 'Onion', 'g', 'hanh tay'),
        ('Vegetables', 'Potato', 'g', 'khoai tay'),
        ('Fruits', 'Apple', 'piece', 'tao'),
        ('Fruits', 'Banana', 'piece', 'chuoi'),
        ('Meat', 'Beef', 'g', 'thit bo'),
        ('Meat', 'Chicken Breast', 'g', 'thit ga'),
        ('Meat', 'Pork', 'g', 'thit lon'),
        ('Seafood', 'Salmon', 'g', 'ca hoi'),
        ('Seafood', 'Shrimp', 'g', 'tom'),
        ('Egg and Dairy', 'Egg', 'piece', 'trung ga'),
        ('Egg and Dairy', 'Milk', 'ml', 'sua tuoi'),
        ('Dry food', 'Rice', 'g', 'gao'),
        ('Dry food', 'Noodle', 'g', 'mi soi'),
        ('Spice', 'Fish Sauce', 'ml', 'nuoc mam'),
        ('Spice', 'Cooking Oil', 'ml', 'dau an'),
        ('Spice', 'Salt', 'g', 'muoi')
) AS v(category_name, food_name, unit, synonyms)
JOIN categories c ON c.name = v.category_name;

INSERT INTO recipes (
    name,
    instructions,
    preferred_meal_time,
    display_status,
    image_url,
    cooking_time_minutes,
    difficulty,
    calories,
    protein,
    fat,
    carbs,
    serving_size
)
VALUES
    ('Beef Stir Fry Spinach', 'Stir fry beef with spinach and garlic.', 'DINNER', 'SYSTEM', NULL, 20, 'EASY', 420, 32.5, 18.0, 20.0, 2),
    ('Tomato Egg Salad', 'Boil eggs and mix with tomato.', 'BREAKFAST', 'SYSTEM', NULL, 10, 'EASY', 220, 11.0, 12.0, 10.0, 1),
    ('Salmon Rice Bowl', 'Pan-sear salmon and serve with rice.', 'LUNCH', 'SYSTEM', NULL, 25, 'MEDIUM', 560, 34.0, 22.0, 48.0, 2),
    ('Chicken Garlic Noodle', 'Cook noodle and toss with chicken and garlic.', 'DINNER', 'SYSTEM', NULL, 30, 'MEDIUM', 510, 30.0, 14.0, 60.0, 2),
    ('Shrimp Fried Rice', 'Fry rice with shrimp, egg and fish sauce.', 'LUNCH', 'SYSTEM', NULL, 25, 'MEDIUM', 540, 26.0, 16.0, 68.0, 2),
    ('Potato Beef Soup', 'Simmer beef with potato and onion.', 'DINNER', 'SYSTEM', NULL, 45, 'MEDIUM', 480, 28.0, 20.0, 34.0, 3),
    ('Milk Banana Smoothie', 'Blend milk and banana.', 'BREAKFAST', 'SYSTEM', NULL, 5, 'EASY', 180, 6.0, 4.0, 30.0, 1),
    ('Spinach Omelette', 'Cook egg omelette with spinach.', 'BREAKFAST', 'SYSTEM', NULL, 12, 'EASY', 250, 14.0, 16.0, 8.0, 1);

INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit)
SELECT r.id, f.id, v.qty, v.unit
FROM (
    VALUES
        ('Beef Stir Fry Spinach', 'Beef', 300, 'g'),
        ('Beef Stir Fry Spinach', 'Spinach', 200, 'g'),
        ('Beef Stir Fry Spinach', 'Garlic', 20, 'g'),
        ('Beef Stir Fry Spinach', 'Cooking Oil', 15, 'ml'),

        ('Tomato Egg Salad', 'Tomato', 200, 'g'),
        ('Tomato Egg Salad', 'Egg', 2, 'piece'),
        ('Tomato Egg Salad', 'Salt', 2, 'g'),

        ('Salmon Rice Bowl', 'Salmon', 220, 'g'),
        ('Salmon Rice Bowl', 'Rice', 180, 'g'),
        ('Salmon Rice Bowl', 'Cooking Oil', 10, 'ml'),

        ('Chicken Garlic Noodle', 'Chicken Breast', 250, 'g'),
        ('Chicken Garlic Noodle', 'Noodle', 180, 'g'),
        ('Chicken Garlic Noodle', 'Garlic', 15, 'g'),
        ('Chicken Garlic Noodle', 'Cooking Oil', 10, 'ml'),

        ('Shrimp Fried Rice', 'Shrimp', 200, 'g'),
        ('Shrimp Fried Rice', 'Rice', 200, 'g'),
        ('Shrimp Fried Rice', 'Egg', 1, 'piece'),
        ('Shrimp Fried Rice', 'Fish Sauce', 10, 'ml'),

        ('Potato Beef Soup', 'Beef', 250, 'g'),
        ('Potato Beef Soup', 'Potato', 250, 'g'),
        ('Potato Beef Soup', 'Onion', 100, 'g'),
        ('Potato Beef Soup', 'Salt', 4, 'g'),

        ('Milk Banana Smoothie', 'Milk', 250, 'ml'),
        ('Milk Banana Smoothie', 'Banana', 2, 'piece'),

        ('Spinach Omelette', 'Egg', 2, 'piece'),
        ('Spinach Omelette', 'Spinach', 120, 'g'),
        ('Spinach Omelette', 'Cooking Oil', 8, 'ml')
) AS v(recipe_name, food_name, qty, unit)
JOIN recipes r ON r.name = v.recipe_name
JOIN foods f ON f.name = v.food_name;

INSERT INTO fridge_items (
    family_id,
    food_id,
    quantity,
    storage_location,
    added_date,
    expiry_date,
    status,
    note
)
SELECT fam.id, f.id, v.qty, v.storage_location, CURRENT_DATE - v.added_days, CURRENT_DATE + v.expiry_days, v.status, v.note
FROM (
    VALUES
        ('Beef', 500, 'FREEZER', 2, 10, 'STORED', 'enough for stir-fry'),
        ('Spinach', 250, 'COOL', 1, 1, 'STORED', 'expiring soon'),
        ('Garlic', 10, 'COOL', 3, 20, 'STORED', 'not enough for some recipes'),
        ('Cooking Oil', 300, 'DRY', 10, 120, 'STORED', NULL),
        ('Tomato', 300, 'COOL', 2, 2, 'STORED', NULL),
        ('Egg', 8, 'COOL', 4, 5, 'STORED', NULL),
        ('Milk', 700, 'COOL', 1, 3, 'STORED', NULL),
        ('Banana', 4, 'COOL', 1, 2, 'STORED', NULL),
        ('Salmon', 100, 'FREEZER', 5, 15, 'STORED', 'insufficient for recipe'),
        ('Rice', 1500, 'DRY', 20, 180, 'STORED', NULL),
        ('Noodle', 300, 'DRY', 7, 60, 'STORED', NULL),
        ('Shrimp', 100, 'FREEZER', 2, 7, 'STORED', 'insufficient for fried rice'),
        ('Potato', 180, 'COOL', 3, 6, 'STORED', 'insufficient for soup'),
        ('Onion', 80, 'COOL', 2, 8, 'STORED', 'insufficient for soup'),
        ('Fish Sauce', 120, 'DRY', 30, 365, 'STORED', NULL),
        ('Salt', 200, 'DRY', 30, 365, 'STORED', NULL),
        ('Pork', 300, 'FREEZER', 10, 0, 'EXPIRED', 'must not be used in recommendation'),
        ('Apple', 3, 'COOL', 6, 0, 'USED', 'already consumed')
) AS v(food_name, qty, storage_location, added_days, expiry_days, status, note)
JOIN foods f ON f.name = v.food_name
CROSS JOIN families fam
WHERE fam.name = 'Family Quang';

INSERT INTO user_favorite_recipes (user_id, recipe_id)
SELECT u.id, r.id
FROM users u
JOIN recipes r ON r.name IN ('Beef Stir Fry Spinach', 'Milk Banana Smoothie')
WHERE u.email = 'user@mealmate.local';

INSERT INTO recipe_tags (name)
VALUES
    ('QUICK'),
    ('HEALTHY'),
    ('HIGH_PROTEIN'),
    ('LOW_CALORIE'),
    ('VEGETARIAN'),
    ('SOUP'),
    ('MAIN_DISH'),
    ('SIDE_DISH'),
    ('BREAKFAST_FRIENDLY')
ON CONFLICT (name) DO NOTHING;

INSERT INTO recipe_tag_items (recipe_id, tag_id)
SELECT r.id, t.id
FROM (
    VALUES
        ('Beef Stir Fry Spinach', 'HIGH_PROTEIN'),
        ('Beef Stir Fry Spinach', 'MAIN_DISH'),
        ('Tomato Egg Salad', 'LOW_CALORIE'),
        ('Tomato Egg Salad', 'BREAKFAST_FRIENDLY'),
        ('Salmon Rice Bowl', 'HIGH_PROTEIN'),
        ('Chicken Garlic Noodle', 'MAIN_DISH'),
        ('Potato Beef Soup', 'SOUP'),
        ('Milk Banana Smoothie', 'QUICK'),
        ('Spinach Omelette', 'BREAKFAST_FRIENDLY')
) AS v(recipe_name, tag_name)
JOIN recipes r ON r.name = v.recipe_name
JOIN recipe_tags t ON t.name = v.tag_name
ON CONFLICT ON CONSTRAINT uq_recipe_tag_items_recipe_tag DO NOTHING;

INSERT INTO user_recipe_history (user_id, recipe_id, action)
SELECT u.id, r.id, v.action
FROM (
    VALUES
        ('user@mealmate.local', 'Beef Stir Fry Spinach', 'LIKED'),
        ('user@mealmate.local', 'Shrimp Fried Rice', 'SKIPPED'),
        ('user@mealmate.local', 'Milk Banana Smoothie', 'COOKED'),
        ('member@mealmate.local', 'Tomato Egg Salad', 'VIEWED')
) AS v(user_email, recipe_name, action)
JOIN users u ON u.email = v.user_email
JOIN recipes r ON r.name = v.recipe_name;

INSERT INTO unit_conversions (from_unit, to_unit, multiplier, is_bidirectional)
VALUES
    ('kg', 'g', 1000.000000, TRUE),
    ('l', 'ml', 1000.000000, TRUE),
    ('piece', 'piece', 1.000000, TRUE),
    ('g', 'g', 1.000000, TRUE),
    ('ml', 'ml', 1.000000, TRUE)
ON CONFLICT (from_unit, to_unit) DO NOTHING;

INSERT INTO menus (family_id, start_date, end_date)
SELECT fam.id, CURRENT_DATE - 7, CURRENT_DATE + 7
FROM families fam
WHERE fam.name = 'Family Quang';

INSERT INTO meals (menu_id, meal_date, meal_type)
SELECT m.id, v.meal_date, v.meal_type
FROM menus m
CROSS JOIN (
    VALUES
        (CURRENT_DATE - 1, 'DINNER'),
        (CURRENT_DATE - 2, 'LUNCH'),
        (CURRENT_DATE - 5, 'BREAKFAST'),
        (CURRENT_DATE, 'BREAKFAST'),
        (CURRENT_DATE, 'LUNCH'),
        (CURRENT_DATE, 'DINNER')
) AS v(meal_date, meal_type)
WHERE m.start_date = CURRENT_DATE - 7;

INSERT INTO meal_items (meal_id, recipe_id, status)
SELECT me.id, r.id, 'CONFIRMED'
FROM (
    VALUES
        (CURRENT_DATE - 1, 'DINNER', 'Beef Stir Fry Spinach'),
        (CURRENT_DATE - 2, 'LUNCH', 'Salmon Rice Bowl'),
        (CURRENT_DATE - 5, 'BREAKFAST', 'Milk Banana Smoothie'),
        (CURRENT_DATE, 'BREAKFAST', 'Tomato Egg Salad'),
        (CURRENT_DATE, 'LUNCH', 'Shrimp Fried Rice')
) AS v(meal_date, meal_type, recipe_name)
JOIN meals me ON me.meal_date = v.meal_date AND me.meal_type = v.meal_type
JOIN recipes r ON r.name = v.recipe_name;

INSERT INTO shopping_lists (created_by, family_id, created_date, planned_date, note)
SELECT u.id, fam.id, CURRENT_DATE, CURRENT_DATE + 1, 'Weekly refill list'
FROM users u
JOIN families fam ON fam.name = 'Family Quang'
WHERE u.email = 'user@mealmate.local';

INSERT INTO shopping_list_items (shopping_list_id, food_id, order_number, quantity, unit, note, assigned_to, is_purchased)
SELECT sl.id, f.id, v.order_number, v.qty, v.unit, v.note, u.id, v.is_purchased
FROM (
    VALUES
        ('Garlic', 1, 100, 'g', 'top-up', FALSE),
        ('Shrimp', 2, 300, 'g', 'for weekend', FALSE),
        ('Apple', 3, 5, 'piece', 'kids snack', TRUE)
) AS v(food_name, order_number, qty, unit, note, is_purchased)
JOIN shopping_lists sl ON sl.note = 'Weekly refill list'
JOIN foods f ON f.name = v.food_name
JOIN users u ON u.email = 'user@mealmate.local';

-- =====================================================
-- 11. REMOTE DEMO ADDITIONS
-- =====================================================

INSERT INTO roles (name, description, is_active)
VALUES
    ('BOSS', 'Người nội trợ', TRUE)
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- 12. FAMILY QUANG MINH - RECOMMENDATION TEST DATA
-- Adds richer favorites and behavior history for rule-based scoring demos.
-- =====================================================

INSERT INTO users (family_id, role_id, email, password_hash, full_name, email_verified)
SELECT fam.id, r.id, v.email, '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', v.full_name, TRUE
FROM (
    VALUES
        ('child@mealmate.local', 'Nguyen Bao An'),
        ('elder@mealmate.local', 'Pham Minh Duc')
) AS v(email, full_name)
JOIN roles r ON r.name = 'CUSTOMER'
JOIN families fam ON fam.name = 'Family Quang'
ON CONFLICT (email) DO NOTHING;

UPDATE users
SET family_id = (SELECT id FROM families WHERE name = 'Family Quang')
WHERE email IN (
    'user@mealmate.local',
    'member@mealmate.local',
    'child@mealmate.local',
    'elder@mealmate.local'
);

INSERT INTO user_favorite_recipes (user_id, recipe_id)
SELECT u.id, r.id
FROM (
    VALUES
        ('user@mealmate.local', 'Beef Stir Fry Spinach'),
        ('user@mealmate.local', 'Milk Banana Smoothie'),
        ('member@mealmate.local', 'Salmon Rice Bowl'),
        ('member@mealmate.local', 'Tomato Egg Salad'),
        ('child@mealmate.local', 'Milk Banana Smoothie'),
        ('child@mealmate.local', 'Chicken Garlic Noodle'),
        ('elder@mealmate.local', 'Potato Beef Soup'),
        ('elder@mealmate.local', 'Salmon Rice Bowl')
) AS v(user_email, recipe_name)
JOIN users u ON u.email = v.user_email
JOIN recipes r ON r.name = v.recipe_name
ON CONFLICT DO NOTHING;

INSERT INTO user_recipe_history (user_id, recipe_id, action, created_at)
SELECT u.id, r.id, v.action, CURRENT_TIMESTAMP - (v.days_ago * INTERVAL '1 day')
FROM (
    VALUES
        ('user@mealmate.local', 'Beef Stir Fry Spinach', 'COOKED', 1),
        ('user@mealmate.local', 'Salmon Rice Bowl', 'VIEWED', 2),
        ('user@mealmate.local', 'Shrimp Fried Rice', 'SKIPPED', 3),
        ('member@mealmate.local', 'Tomato Egg Salad', 'DISLIKED', 1),
        ('member@mealmate.local', 'Salmon Rice Bowl', 'LIKED', 2),
        ('child@mealmate.local', 'Milk Banana Smoothie', 'LIKED', 1),
        ('child@mealmate.local', 'Spinach Omelette', 'SKIPPED', 4),
        ('elder@mealmate.local', 'Potato Beef Soup', 'LIKED', 1),
        ('elder@mealmate.local', 'Shrimp Fried Rice', 'DISLIKED', 5)
) AS v(user_email, recipe_name, action, days_ago)
JOIN users u ON u.email = v.user_email
JOIN recipes r ON r.name = v.recipe_name;

-- Extra stored fridge items to create clear scoring scenarios:
-- - Chicken becomes fully matchable for Chicken Garlic Noodle.
-- - Carrot has no current recipe usage, proving unused fridge foods do not affect candidate score.
-- - Expired/USED rows must be ignored by recommendation stock aggregation.
INSERT INTO fridge_items (
    family_id,
    food_id,
    quantity,
    storage_location,
    added_date,
    expiry_date,
    status,
    note
)
SELECT fam.id, f.id, v.qty, v.storage_location, CURRENT_DATE - v.added_days, CURRENT_DATE + v.expiry_days, v.status, v.note
FROM (
    VALUES
        ('Chicken Breast', 350, 'FREEZER', 1, 12, 'STORED', 'recommendation test: enough for chicken noodle'),
        ('Garlic', 40, 'COOL', 1, 4, 'STORED', 'recommendation test: top-up garlic, near expiry'),
        ('Carrot', 500, 'COOL', 1, 3, 'STORED', 'recommendation test: unused ingredient'),
        ('Shrimp', 300, 'FREEZER', 1, 2, 'EXPIRED', 'recommendation test: expired shrimp ignored'),
        ('Milk', 200, 'COOL', 4, -1, 'STORED', 'recommendation test: past expiry ignored even if status stored'),
        ('Banana', 2, 'COOL', 2, 1, 'USED', 'recommendation test: used banana ignored')
) AS v(food_name, qty, storage_location, added_days, expiry_days, status, note)
JOIN foods f ON f.name = v.food_name
JOIN families fam ON fam.name = 'Family Quang';

-- Add more recent meals to exercise recent penalty tiers:
-- yesterday = -20, within 3 days = -15, within 7 days = -10.
INSERT INTO meals (menu_id, meal_date, meal_type)
SELECT m.id, v.meal_date, v.meal_type
FROM menus m
CROSS JOIN (
    VALUES
        (CURRENT_DATE - 3, 'DINNER'),
        (CURRENT_DATE - 6, 'DINNER')
) AS v(meal_date, meal_type)
WHERE m.family_id = (SELECT id FROM families WHERE name = 'Family Quang')
  AND m.start_date <= v.meal_date
  AND m.end_date >= v.meal_date
  AND NOT EXISTS (
      SELECT 1
      FROM meals existing
      WHERE existing.menu_id = m.id
        AND existing.meal_date = v.meal_date
        AND existing.meal_type = v.meal_type
  );

INSERT INTO meal_items (meal_id, recipe_id, status)
SELECT me.id, r.id, 'CONFIRMED'
FROM (
    VALUES
        (CURRENT_DATE - 3, 'DINNER', 'Chicken Garlic Noodle'),
        (CURRENT_DATE - 6, 'DINNER', 'Potato Beef Soup')
) AS v(meal_date, meal_type, recipe_name)
JOIN meals me ON me.meal_date = v.meal_date AND me.meal_type = v.meal_type
JOIN menus m ON m.id = me.menu_id AND m.family_id = (SELECT id FROM families WHERE name = 'Family Quang')
JOIN recipes r ON r.name = v.recipe_name
ON CONFLICT ON CONSTRAINT uq_meal_recipe DO NOTHING;

INSERT INTO unit_conversions (from_unit, to_unit, multiplier, is_bidirectional)
VALUES
    ('kg', 'g', 1000.000000, TRUE),
    ('l', 'ml', 1000.000000, TRUE),
    ('piece', 'piece', 1.000000, TRUE),
    ('g', 'g', 1.000000, TRUE),
    ('ml', 'ml', 1.000000, TRUE)
ON CONFLICT (from_unit, to_unit) DO NOTHING;

COMMIT;
