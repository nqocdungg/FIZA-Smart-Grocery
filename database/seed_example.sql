-- =====================================================
-- SEED DATA CHUAN CHO MEALMATE
-- Chay sau database/db.sql.
--
-- Script nay reset toan bo du lieu mau va tao lai tu dau:
-- - 2 roles: ADMIN, CUSTOMER
-- - 2 users mau, mat khau deu la: password
-- - 1 family mau
-- - 7 categories da chot
-- - foods khong co icon rieng; UI dung icon_key cua categories
-- - preservation, fridge, shopping, recipes, menu mau
-- =====================================================

BEGIN;

-- =====================================================
-- 0. RESET DU LIEU MAU
-- =====================================================

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
    preservation_methods,
    foods,
    categories,
    families,
    users,
    roles
RESTART IDENTITY CASCADE;

-- =====================================================
-- 1. ROLES
-- =====================================================

INSERT INTO roles (name, description, is_active)
VALUES
    ('ADMIN', 'Quản trị viên hệ thống', TRUE),
    ('CUSTOMER', 'Người dùng gia đình', TRUE);

-- =====================================================
-- 2. USERS
-- Password mau: password
-- BCrypt hash cua "password":
-- $2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2
-- =====================================================

INSERT INTO users (
    family_id,
    role_id,
    email,
    password_hash,
    full_name,
    phone,
    gender,
    avatar_url,
    email_verified
)
SELECT
    NULL,
    r.id,
    'admin@mealmate.local',
    '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2',
    'Admin MealMate',
    '0900000000',
    'OTHER',
    NULL,
    TRUE
FROM roles r
WHERE r.name = 'ADMIN';

INSERT INTO users (
    family_id,
    role_id,
    email,
    password_hash,
    full_name,
    phone,
    gender,
    avatar_url,
    email_verified
)
SELECT
    NULL,
    r.id,
    'user@mealmate.local',
    '$2a$10$yTDXwEpBVd0ri5chsz3FyeiUW2amh5jAlfAJR6DmFjJvD32pNFWK2',
    'Nguyễn Minh Quang',
    '0912345678',
    'MALE',
    NULL,
    TRUE
FROM roles r
WHERE r.name = 'CUSTOMER';

select * from user;
-- =====================================================
-- 3. FAMILY
-- families.housekeeper_id -> users.id
-- users.family_id -> families.id
-- Do 2 bang co quan he vong, tao user truoc, tao family sau, roi update user.
-- =====================================================

INSERT INTO families (name, housekeeper_id)
SELECT
    'Gia đình Minh Quang',
    u.id
FROM users u
WHERE u.email = 'user@mealmate.local';

UPDATE users
SET family_id = (
    SELECT id
    FROM families
    WHERE name = 'Gia đình Minh Quang'
    LIMIT 1
)
WHERE email = 'user@mealmate.local';

-- =====================================================
-- 4. CATEGORIES
-- Chi categories luu icon_key. Foods khong co icon_key rieng.
-- 7 loai da chot: Rau củ, Trái cây, Thịt, Hải sản, Trứng & Sữa, Đồ khô, Gia vị.
-- =====================================================

INSERT INTO categories (name, icon_key, color_code)
VALUES
    ('Rau củ', 'vegetable', '#E8F5E9'),
    ('Trái cây', 'fruit', '#FFF3E0'),
    ('Thịt', 'meat', '#FFEBEE'),
    ('Hải sản', 'seafood', '#E3F2FD'),
    ('Trứng & Sữa', 'dairy', '#FFFDE7'),
    ('Đồ khô', 'dry-food', '#F3E5F5'),
    ('Gia vị', 'spice', '#FBE9E7');

-- =====================================================
-- 5. FOODS
-- UI lay icon tu categories.icon_key thong qua categoryIconKey.
-- =====================================================

INSERT INTO foods (
    category_id,
    name,
    unit,
    synonyms,
    image_url,
    is_system,
    created_by,
    family_id
)
SELECT
    c.id,
    v.food_name,
    v.unit,
    v.synonyms,
    NULL,
    TRUE,
    NULL,
    NULL
FROM (
    VALUES
        ('Rau củ', 'Cà chua', 'g', 'tomato,cà chua bi,cà chua đỏ'),
        ('Rau củ', 'Cà rốt', 'g', 'carrot,củ cà rốt'),
        ('Rau củ', 'Rau muống', 'g', 'rau xanh,rau muống'),
        ('Rau củ', 'Khoai tây', 'g', 'potato,củ khoai tây'),
        ('Rau củ', 'Rau củ khác', 'g', 'rau khác,củ khác,rau củ khác,khác'),

        ('Trái cây', 'Táo', 'quả', 'apple,táo đỏ,táo xanh'),
        ('Trái cây', 'Chuối', 'quả', 'banana,chuối tiêu,chuối tây'),
        ('Trái cây', 'Cam', 'quả', 'orange,cam vàng'),
        ('Trái cây', 'Dưa hấu', 'g', 'watermelon,dưa đỏ'),
        ('Trái cây', 'Trái cây khác', 'g', 'hoa quả khác,trái cây khác,khác'),

        ('Thịt', 'Thịt lợn', 'g', 'thịt heo,heo,lợn,pork'),
        ('Thịt', 'Thịt bò', 'g', 'bò,beef,thịt bò Mỹ'),
        ('Thịt', 'Thịt gà', 'g', 'gà,chicken,ức gà,đùi gà'),
        ('Thịt', 'Xúc xích', 'g', 'sausage,xuc xich'),
        ('Thịt', 'Thịt khác', 'g', 'thịt khác,khác'),

        ('Hải sản', 'Cá hồi', 'g', 'salmon,cá hồi Nauy'),
        ('Hải sản', 'Tôm', 'g', 'shrimp,tôm sú,tôm thẻ'),
        ('Hải sản', 'Mực', 'g', 'squid,mực ống,mực tươi'),
        ('Hải sản', 'Cá thu', 'g', 'mackerel,cá biển'),
        ('Hải sản', 'Hải sản khác', 'g', 'đồ biển khác,hải sản khác,khác'),

        ('Trứng & Sữa', 'Trứng gà', 'quả', 'egg,trứng,trứng gà ta'),
        ('Trứng & Sữa', 'Sữa tươi', 'ml', 'milk,sữa không đường,sữa có đường'),
        ('Trứng & Sữa', 'Sữa chua', 'hộp', 'yogurt,yaourt'),
        ('Trứng & Sữa', 'Phô mai', 'g', 'cheese,pho mai'),
        ('Trứng & Sữa', 'Trứng & Sữa khác', 'g', 'trứng khác,sữa khác,trứng sữa khác,khác'),

        ('Đồ khô', 'Gạo', 'g', 'rice,gạo tẻ,gạo nếp'),
        ('Đồ khô', 'Mì gói', 'gói', 'instant noodle,mì ăn liền'),
        ('Đồ khô', 'Bún khô', 'g', 'bún,miến khô,phở khô'),
        ('Đồ khô', 'Bột mì', 'g', 'flour,bột làm bánh'),
        ('Đồ khô', 'Đồ khô khác', 'g', 'đồ khô khác,khác'),

        ('Gia vị', 'Muối', 'g', 'salt,muối ăn'),
        ('Gia vị', 'Đường', 'g', 'sugar,đường trắng,đường nâu'),
        ('Gia vị', 'Nước mắm', 'ml', 'fish sauce,mắm'),
        ('Gia vị', 'Dầu ăn', 'ml', 'cooking oil,dầu thực vật'),
        ('Gia vị', 'Gia vị khác', 'g', 'gia vị khác,khác')
) AS v(category_name, food_name, unit, synonyms)
JOIN categories c ON c.name = v.category_name;

-- =====================================================
-- 6. PRESERVATION METHODS
-- =====================================================

INSERT INTO preservation_methods (food_id, content, reference_source)
SELECT f.id, v.content, 'MealMate seed'
FROM (
    VALUES
        ('Cà chua', 'Bảo quản trong ngăn mát, tránh để gần thực phẩm có mùi mạnh.'),
        ('Cà rốt', 'Giữ khô ráo, để trong ngăn rau củ hoặc hộp kín.'),
        ('Rau muống', 'Nhặt bỏ lá hỏng, bọc giấy hoặc túi thoáng khí trước khi cho vào ngăn mát.'),
        ('Táo', 'Để trong ngăn trái cây, tránh để chung với thực phẩm có mùi mạnh.'),
        ('Dưa hấu', 'Sau khi cắt nên bọc kín và bảo quản trong ngăn mát.'),
        ('Thịt lợn', 'Bọc kín, bảo quản ngăn đông nếu chưa dùng trong ngày.'),
        ('Thịt bò', 'Chia khẩu phần nhỏ, bọc kín trước khi cấp đông.'),
        ('Thịt gà', 'Bảo quản riêng trong hộp kín, tránh tiếp xúc với thực phẩm ăn liền.'),
        ('Cá hồi', 'Bảo quản lạnh sâu nếu chưa dùng ngay, rã đông trong ngăn mát.'),
        ('Tôm', 'Rửa sạch, để ráo, bọc kín và cấp đông.'),
        ('Trứng gà', 'Để trong khay riêng, không rửa trứng trước khi bảo quản.'),
        ('Sữa tươi', 'Luôn đậy kín nắp, bảo quản ngăn mát sau khi mở.'),
        ('Sữa chua', 'Bảo quản ngăn mát và dùng trước hạn in trên bao bì.'),
        ('Gạo', 'Đậy kín, để nơi khô ráo, thoáng mát.'),
        ('Mì gói', 'Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp.'),
        ('Muối', 'Đậy kín sau khi dùng, tránh nơi ẩm.'),
        ('Nước mắm', 'Đậy kín nắp, để nơi thoáng mát, tránh ánh nắng.')
) AS v(food_name, content)
JOIN foods f ON f.name = v.food_name;

-- Them huong dan bo sung cho mot so thuc pham hien thi nhieu dong tren UI.
INSERT INTO preservation_methods (food_id, content, reference_source)
SELECT f.id, v.content, 'MealMate seed'
FROM (
    VALUES
        ('Cà chua', 'Nên dùng sớm khi quả đã chín mềm.'),
        ('Thịt bò', 'Không cấp đông lại sau khi đã rã đông hoàn toàn.'),
        ('Cá hồi', 'Đóng kín túi hoặc hộp để tránh ám mùi.'),
        ('Trứng gà', 'Tránh đặt ở cánh tủ nếu nhiệt độ thay đổi nhiều.'),
        ('Gạo', 'Kiểm tra định kỳ để tránh ẩm mốc hoặc côn trùng.')
) AS v(food_name, content)
JOIN foods f ON f.name = v.food_name;

-- =====================================================
-- 7. FRIDGE ITEMS
-- =====================================================

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
SELECT
    fam.id,
    f.id,
    v.custom_name,
    v.quantity,
    v.storage_location,
    v.specific_location,
    CURRENT_DATE - v.added_days_ago,
    CURRENT_DATE + v.expiry_days_left,
    'STORED',
    NULL,
    v.note
FROM (
    VALUES
        ('Cà chua', NULL, 500.00, 'COOL', 'VEGETABLE_DRAWER', 2, 2, 'Dùng cho salad hoặc sốt cà chua'),
        ('Sữa tươi', NULL, 1000.00, 'COOL', 'DOOR_SHELF', 1, 3, 'Đã mở nắp'),
        ('Thịt bò', NULL, 300.00, 'FREEZER', NULL, 5, 20, 'Chia sẵn một bữa'),
        ('Táo', NULL, 6.00, 'COOL', 'FRUIT_DRAWER', 3, 7, NULL),
        ('Cá hồi', NULL, 400.00, 'FREEZER', NULL, 2, 14, NULL),
        ('Trứng gà', NULL, 10.00, 'COOL', 'MIDDLE_SHELF', 4, 10, NULL),
        ('Cà rốt', NULL, 300.00, 'COOL', 'VEGETABLE_DRAWER', 3, 4, NULL),
        ('Gạo', NULL, 2000.00, 'DRY', NULL, 10, 120, 'Bao gạo đã mở'),
        ('Dưa hấu', 'Dưa hấu đã cắt', 1.00, 'COOL', 'FRUIT_DRAWER', 1, 1, 'Bọc kín bằng màng bọc')
) AS v(food_name, custom_name, quantity, storage_location, specific_location, added_days_ago, expiry_days_left, note)
JOIN foods f ON f.name = v.food_name
CROSS JOIN families fam
WHERE fam.name = 'Gia đình Minh Quang';

-- =====================================================
-- 8. SHOPPING LIST SAMPLE
-- =====================================================

INSERT INTO shopping_lists (created_by, family_id, created_date, planned_date, note)
SELECT
    u.id,
    fam.id,
    CURRENT_DATE,
    CURRENT_DATE + 1,
    'Danh sách mua bổ sung cho tuần này'
FROM users u
JOIN families fam ON fam.name = 'Gia đình Minh Quang'
WHERE u.email = 'user@mealmate.local';

INSERT INTO shopping_list_items (
    shopping_list_id,
    food_id,
    order_number,
    quantity,
    unit,
    note,
    assigned_to,
    is_purchased
)
SELECT
    sl.id,
    f.id,
    v.order_number,
    v.quantity,
    v.unit,
    v.note,
    u.id,
    v.is_purchased
FROM (
    VALUES
        ('Rau muống', 1, 500.00, 'g', 'Mua bó tươi', FALSE),
        ('Thịt lợn', 2, 500.00, 'g', 'Nạc vai', TRUE),
        ('Cam', 3, 4.00, 'quả', NULL, TRUE),
        ('Dầu ăn', 4, 1000.00, 'ml', NULL, TRUE)
) AS v(food_name, order_number, quantity, unit, note, is_purchased)
JOIN foods f ON f.name = v.food_name
JOIN shopping_lists sl ON sl.note = 'Danh sách mua bổ sung cho tuần này'
JOIN users u ON u.email = 'user@mealmate.local';

-- =====================================================
-- 9. RECIPES + INGREDIENTS
-- =====================================================

INSERT INTO recipes (
    name,
    instructions,
    reference_link,
    author,
    preferred_meal_time,
    display_status,
    image_url
)
VALUES
    ('Bò xào cà rốt', 'Thái mỏng thịt bò, xào nhanh với cà rốt và nêm gia vị vừa ăn.', NULL, 'MealMate', 'DINNER', 'SYSTEM', NULL),
    ('Salad cà chua trứng', 'Luộc trứng, cắt cà chua, trộn cùng gia vị nhẹ.', NULL, 'MealMate', 'BREAKFAST', 'SYSTEM', NULL),
    ('Cơm cá hồi áp chảo', 'Áp chảo cá hồi, ăn kèm cơm và rau củ.', NULL, 'MealMate', 'LUNCH', 'SYSTEM', NULL);

INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit)
SELECT r.id, f.id, v.quantity, v.unit
FROM (
    VALUES
        ('Bò xào cà rốt', 'Thịt bò', 200.00, 'g'),
        ('Bò xào cà rốt', 'Cà rốt', 150.00, 'g'),
        ('Bò xào cà rốt', 'Dầu ăn', 20.00, 'ml'),
        ('Salad cà chua trứng', 'Cà chua', 200.00, 'g'),
        ('Salad cà chua trứng', 'Trứng gà', 2.00, 'quả'),
        ('Cơm cá hồi áp chảo', 'Cá hồi', 200.00, 'g'),
        ('Cơm cá hồi áp chảo', 'Gạo', 150.00, 'g')
) AS v(recipe_name, food_name, quantity, unit)
JOIN recipes r ON r.name = v.recipe_name
JOIN foods f ON f.name = v.food_name;

INSERT INTO user_favorite_recipes (user_id, recipe_id)
SELECT u.id, r.id
FROM users u
JOIN recipes r ON r.name IN ('Bò xào cà rốt', 'Salad cà chua trứng')
WHERE u.email = 'user@mealmate.local';

-- =====================================================
-- 10. MENU SAMPLE
-- =====================================================

INSERT INTO menus (family_id, start_date, end_date)
SELECT id, CURRENT_DATE, CURRENT_DATE + 6
FROM families
WHERE name = 'Gia đình Minh Quang';

INSERT INTO meals (menu_id, meal_date, meal_type)
SELECT m.id, CURRENT_DATE, v.meal_type
FROM menus m
CROSS JOIN (
    VALUES
        ('BREAKFAST'),
        ('LUNCH'),
        ('DINNER')
) AS v(meal_type)
WHERE m.start_date = CURRENT_DATE;

INSERT INTO meal_items (meal_id, recipe_id, status)
SELECT meal.id, recipe.id, 'CONFIRMED'
FROM (
    VALUES
        ('BREAKFAST', 'Salad cà chua trứng'),
        ('LUNCH', 'Cơm cá hồi áp chảo'),
        ('DINNER', 'Bò xào cà rốt')
) AS v(meal_type, recipe_name)
JOIN meals meal ON meal.meal_type = v.meal_type AND meal.meal_date = CURRENT_DATE
JOIN recipes recipe ON recipe.name = v.recipe_name;

COMMIT;

-- =====================================================
-- 11. QUICK CHECK
-- =====================================================

SELECT id, name
FROM roles
ORDER BY id;

SELECT id, email, full_name, family_id, role_id, password_hash
FROM users
ORDER BY id;

SELECT id, name, icon_key, color_code
FROM categories
ORDER BY id;

SELECT f.id, f.name, c.name AS category_name, f.unit, c.icon_key AS category_icon_key
FROM foods f
JOIN categories c ON c.id = f.category_id
ORDER BY c.id, f.id;

SELECT fi.id, fam.name AS family_name, f.name AS food_name, fi.quantity, f.unit, fi.storage_location, fi.expiry_date
FROM fridge_items fi
JOIN families fam ON fam.id = fi.family_id
JOIN foods f ON f.id = fi.food_id
ORDER BY fi.id;

DO $$
BEGIN
    RAISE NOTICE 'Seed data reset and completed successfully. Login: user@mealmate.local / password';
END $$;


--Cập nhật thêm role
INSERT INTO roles (name, description, is_active)
VALUES
    ('BOSS', 'Người nội trợ', TRUE);
--Tạo 1 cột ước lượng mấy người ăn
