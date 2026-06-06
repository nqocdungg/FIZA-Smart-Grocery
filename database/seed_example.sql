-- =====================================================
-- MealMate seed data for recommendation demo
-- Run after database/db.sql
-- =====================================================

BEGIN;

TRUNCATE TABLE
    role_permissions,
    permissions,
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
    invitations,
    preservation_methods,
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

INSERT INTO users (family_id, role_id, email, password_hash, full_name, phone, gender, avatar_url, email_verified)
SELECT NULL, r.id, 'admin@mealmate.local', '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', 'Admin MealMate', '0900000000', 'OTHER', NULL, TRUE
FROM roles r WHERE r.name = 'ADMIN';

INSERT INTO users (family_id, role_id, email, password_hash, full_name, phone, gender, avatar_url, email_verified)
SELECT NULL, r.id, 'user@mealmate.local', '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', 'Nguyen Minh Quang', '0912345678', 'MALE', NULL, TRUE
FROM roles r WHERE r.name = 'CUSTOMER';

INSERT INTO users (family_id, role_id, email, password_hash, full_name, phone, gender, avatar_url, email_verified)
SELECT NULL, r.id, 'member@mealmate.local', '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', 'Tran Thu Ha', '0987654321', 'FEMALE', NULL, TRUE
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

INSERT INTO foods (category_id, name, unit, synonyms, image_url, is_system, created_by, family_id)
SELECT c.id, v.food_name, v.unit, v.synonyms, NULL, TRUE, NULL, NULL
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

INSERT INTO preservation_methods (food_id, content, reference_source)
SELECT f.id, v.content, 'MealMate seed'
FROM (
    VALUES
        ('Tomato', 'Store in the cool compartment and use soon when ripe.'),
        ('Carrot', 'Keep dry in the vegetable drawer or a sealed container.'),
        ('Spinach', 'Remove damaged leaves, wrap loosely, and refrigerate.'),
        ('Beef', 'Portion and freeze if not used within the day.'),
        ('Chicken Breast', 'Store separately in a sealed box and freeze for longer keeping.'),
        ('Salmon', 'Keep frozen if not cooking immediately; thaw in the fridge.'),
        ('Shrimp', 'Clean, drain, seal, and freeze.'),
        ('Egg', 'Keep in a stable cool shelf and avoid washing before storage.'),
        ('Milk', 'Keep closed and refrigerated after opening.'),
        ('Rice', 'Store sealed in a dry, cool place.'),
        ('Noodle', 'Store in a dry place away from direct sunlight.'),
        ('Fish Sauce', 'Close the cap and keep in a cool place.'),
        ('Cooking Oil', 'Keep sealed and away from heat.'),
        ('Salt', 'Keep dry and tightly closed.')
) AS v(food_name, content)
JOIN foods f ON f.name = v.food_name;

INSERT INTO recipes (
    name,
    instructions,
    reference_link,
    author,
    preferred_meal_time,
    cooking_time_minutes,
    display_status,
    image_url
)
VALUES
    ('Beef Stir Fry Spinach', 'Stir fry beef with spinach and garlic.', NULL, 'MealMate', 'DINNER', 25, 'SYSTEM', NULL),
    ('Tomato Egg Salad', 'Boil eggs and mix with tomato.', NULL, 'MealMate', 'BREAKFAST', 12, 'SYSTEM', NULL),
    ('Salmon Rice Bowl', 'Pan-sear salmon and serve with rice.', NULL, 'MealMate', 'LUNCH', 30, 'SYSTEM', NULL),
    ('Chicken Garlic Noodle', 'Cook noodle and toss with chicken and garlic.', NULL, 'MealMate', 'DINNER', 28, 'SYSTEM', NULL),
    ('Shrimp Fried Rice', 'Fry rice with shrimp, egg and fish sauce.', NULL, 'MealMate', 'LUNCH', 20, 'SYSTEM', NULL),
    ('Potato Beef Soup', 'Simmer beef with potato and onion.', NULL, 'MealMate', 'DINNER', 45, 'SYSTEM', NULL),
    ('Milk Banana Smoothie', 'Blend milk and banana.', NULL, 'MealMate', 'BREAKFAST', 8, 'SYSTEM', NULL),
    ('Spinach Omelette', 'Cook egg omelette with spinach.', NULL, 'MealMate', 'BREAKFAST', 15, 'SYSTEM', NULL);

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
    custom_name,
    quantity,
    storage_location,
    specific_location,
    added_date,
    expiry_date,
    status,
    image_url,
    note
)
SELECT fam.id, f.id, v.custom_name, v.qty, v.storage_location, v.specific_location, CURRENT_DATE - v.added_days, CURRENT_DATE + v.expiry_days, v.status, NULL, v.note
FROM (
    VALUES
        ('Beef', NULL, 500, 'FREEZER', NULL, 2, 10, 'STORED', 'enough for stir-fry'),
        ('Spinach', NULL, 250, 'COOL', 'VEGETABLE_DRAWER', 1, 1, 'STORED', 'expiring soon'),
        ('Garlic', NULL, 10, 'COOL', 'DOOR_SHELF', 3, 20, 'STORED', 'not enough for some recipes'),
        ('Cooking Oil', NULL, 300, 'DRY', NULL, 10, 120, 'STORED', NULL),
        ('Tomato', NULL, 300, 'COOL', 'VEGETABLE_DRAWER', 2, 2, 'STORED', NULL),
        ('Egg', NULL, 8, 'COOL', 'MIDDLE_SHELF', 4, 5, 'STORED', NULL),
        ('Milk', NULL, 700, 'COOL', 'DOOR_SHELF', 1, 3, 'STORED', NULL),
        ('Banana', NULL, 4, 'COOL', 'FRUIT_DRAWER', 1, 2, 'STORED', NULL),
        ('Salmon', NULL, 100, 'FREEZER', NULL, 5, 15, 'STORED', 'insufficient for recipe'),
        ('Rice', NULL, 1500, 'DRY', NULL, 20, 180, 'STORED', NULL),
        ('Noodle', NULL, 300, 'DRY', NULL, 7, 60, 'STORED', NULL),
        ('Shrimp', NULL, 100, 'FREEZER', NULL, 2, 7, 'STORED', 'insufficient for fried rice'),
        ('Potato', NULL, 180, 'COOL', 'VEGETABLE_DRAWER', 3, 6, 'STORED', 'insufficient for soup'),
        ('Onion', NULL, 80, 'COOL', 'VEGETABLE_DRAWER', 2, 8, 'STORED', 'insufficient for soup'),
        ('Fish Sauce', NULL, 120, 'DRY', NULL, 30, 365, 'STORED', NULL),
        ('Salt', NULL, 200, 'DRY', NULL, 30, 365, 'STORED', NULL),
        ('Pork', NULL, 300, 'FREEZER', NULL, 10, 0, 'EXPIRED', 'must not be used in recommendation'),
        ('Apple', NULL, 3, 'COOL', 'FRUIT_DRAWER', 6, 0, 'USED', 'already consumed')
) AS v(food_name, custom_name, qty, storage_location, specific_location, added_days, expiry_days, status, note)
JOIN foods f ON f.name = v.food_name
CROSS JOIN families fam
WHERE fam.name = 'Family Quang';

INSERT INTO user_favorite_recipes (user_id, recipe_id)
SELECT u.id, r.id
FROM users u
JOIN recipes r ON r.name IN ('Beef Stir Fry Spinach', 'Milk Banana Smoothie')
WHERE u.email = 'user@mealmate.local';





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

INSERT INTO shopping_list_items (shopping_list_id, food_id, custom_name, order_number, quantity, unit, note, assigned_to, is_purchased, imported_to_fridge_at, fridge_item_id)
SELECT sl.id, f.id, v.custom_name, v.order_number, v.qty, v.unit, v.note, u.id, v.is_purchased, NULL, NULL
FROM (
    VALUES
        ('Garlic', NULL, 1, 100, 'g', 'top-up', FALSE),
        ('Shrimp', NULL, 2, 300, 'g', 'for weekend', FALSE),
        ('Apple', NULL, 3, 5, 'piece', 'kids snack', TRUE)
) AS v(food_name, custom_name, order_number, qty, unit, note, is_purchased)
JOIN shopping_lists sl ON sl.note = 'Weekly refill list'
JOIN foods f ON f.name = v.food_name
JOIN users u ON u.email = 'user@mealmate.local';

-- =====================================================
-- 11. REMOTE DEMO ADDITIONS
-- =====================================================

INSERT INTO roles (name, description, is_active)
VALUES
    ('BOSS', 'NgÆ°á»i ná»™i trá»£', TRUE)
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- 12. FAMILY QUANG MINH - RECOMMENDATION TEST DATA
-- Adds family favorites and recent meals for rule-based scoring demos.
-- =====================================================

INSERT INTO users (family_id, role_id, email, password_hash, full_name, phone, gender, avatar_url, email_verified)
SELECT fam.id, r.id, v.email, '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2', v.full_name, v.phone, v.gender, NULL, TRUE
FROM (
    VALUES
        ('child@mealmate.local', 'Nguyen Bao An', '0933333333', 'OTHER'),
        ('elder@mealmate.local', 'Pham Minh Duc', '0944444444', 'MALE')
) AS v(email, full_name, phone, gender)
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


-- Extra stored fridge items to create clear scoring scenarios:
-- - Chicken becomes fully matchable for Chicken Garlic Noodle.
-- - Carrot has no current recipe usage, proving unused fridge foods do not affect candidate score.
-- - Expired/USED rows must be ignored by recommendation stock aggregation.
INSERT INTO fridge_items (
    family_id,
    food_id,
    custom_name,
    quantity,
    storage_location,
    specific_location,
    added_date,
    expiry_date,
    status,
    image_url,
    note
)
SELECT fam.id, f.id, NULL, v.qty, v.storage_location, v.specific_location, CURRENT_DATE - v.added_days, CURRENT_DATE + v.expiry_days, v.status, NULL, v.note
FROM (
    VALUES
        ('Chicken Breast', 350, 'FREEZER', NULL, 1, 12, 'STORED', 'recommendation test: enough for chicken noodle'),
        ('Garlic', 40, 'COOL', 'DOOR_SHELF', 1, 4, 'STORED', 'recommendation test: top-up garlic, near expiry'),
        ('Carrot', 500, 'COOL', 'VEGETABLE_DRAWER', 1, 3, 'STORED', 'recommendation test: unused ingredient'),
        ('Shrimp', 300, 'FREEZER', NULL, 1, 2, 'EXPIRED', 'recommendation test: expired shrimp ignored'),
        ('Milk', 200, 'COOL', 'DOOR_SHELF', 4, -1, 'STORED', 'recommendation test: past expiry ignored even if status stored'),
        ('Banana', 2, 'COOL', 'FRUIT_DRAWER', 2, 1, 'USED', 'recommendation test: used banana ignored')
) AS v(food_name, qty, storage_location, specific_location, added_days, expiry_days, status, note)
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


COMMIT;
