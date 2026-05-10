-- =====================================================
-- SEED DATA NHỎ CHO MEALMATE
-- Gồm:
-- 1 admin
-- 1 user thường
-- 1 family
-- đầy đủ category
-- mỗi category vài food + "[category] khác"
-- =====================================================

-- =====================================================
-- 1. ROLES
-- Nếu db.sql đã insert ADMIN/CUSTOMER rồi thì đoạn này không insert lại
-- =====================================================

INSERT INTO roles (name, description)
SELECT 'ADMIN', 'Quản trị viên hệ thống - toàn quyền truy cập'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'ADMIN'
);

INSERT INTO roles (name, description)
SELECT 'CUSTOMER', 'Khách hàng / thành viên gia đình'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'CUSTOMER'
);

-- =====================================================
-- 2. USERS
-- Password mẫu cho cả 2 tài khoản: password
-- BCrypt hash: password
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
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Admin MealMate',
    '0900000000',
    'OTHER',
    NULL,
    TRUE
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM users WHERE email = 'admin@mealmate.local'
  );

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
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Nguyễn Minh Quang',
    '0912345678',
    'MALE',
    NULL,
    TRUE
FROM roles r
WHERE r.name = 'CUSTOMER'
  AND NOT EXISTS (
      SELECT 1 FROM users WHERE email = 'user@mealmate.local'
  );

-- =====================================================
-- 3. FAMILY
-- Tạo 1 gia đình, housekeeper là user thường
-- =====================================================

INSERT INTO families (
    name,
    housekeeper_id
)
SELECT
    'Gia đình Minh Quang',
    u.id
FROM users u
WHERE u.email = 'user@mealmate.local'
  AND NOT EXISTS (
      SELECT 1 FROM families WHERE name = 'Gia đình Minh Quang'
  );

-- Gán user thường vào family vừa tạo
UPDATE users
SET family_id = (
    SELECT f.id
    FROM families f
    WHERE f.name = 'Gia đình Minh Quang'
    LIMIT 1
)
WHERE email = 'user@mealmate.local'
  AND family_id IS NULL;

-- =====================================================
-- 4. CATEGORIES
-- Đầy đủ các loại đã chốt
-- =====================================================

INSERT INTO categories (name, icon_key, color_code)
SELECT v.name, v.icon_key, v.color_code
FROM (
    VALUES
        ('Rau củ', 'vegetable', '#E8F5E9'),
        ('Trái cây', 'fruit', '#FFF3E0'),
        ('Thịt', 'meat', '#FFEBEE'),
        ('Hải sản', 'seafood', '#E3F2FD'),
        ('Trứng & Sữa', 'egg-milk', '#FFFDE7'),
        ('Đồ khô', 'dry-food', '#F3E5F5'),
        ('Gia vị', 'spice', '#FBE9E7'),
        ('Đồ uống', 'drink', '#E0F7FA')
) AS v(name, icon_key, color_code)
WHERE NOT EXISTS (
    SELECT 1
    FROM categories c
    WHERE LOWER(c.name) = LOWER(v.name)
);

-- =====================================================
-- 5. FOODS
-- Mỗi category vài thực phẩm + 1 thực phẩm "khác"
-- Các bản ghi "[category] khác" vẫn là food chuẩn hóa,
-- dùng để giữ category mapping, nhưng logic gợi ý món ăn nên loại trừ theo ID/name.
-- =====================================================

INSERT INTO foods (
    category_id,
    name,
    unit,
    synonyms,
    image_url,
    icon_key,
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
    v.icon_key,
    TRUE,
    NULL,
    NULL
FROM (
    VALUES
        -- Rau củ
        ('Rau củ', 'Cà chua', 'g', 'tomato,cà chua bi,cà chua đỏ', 'tomato'),
        ('Rau củ', 'Cà rốt', 'g', 'carrot,củ cà rốt', 'carrot'),
        ('Rau củ', 'Rau muống', 'g', 'rau xanh,rau muống', 'water-spinach'),
        ('Rau củ', 'Khoai tây', 'g', 'potato,củ khoai tây', 'potato'),
        ('Rau củ', 'Rau củ khác', 'g', 'rau khác,củ khác,rau củ khác,khác', 'vegetable-other'),

        -- Trái cây
        ('Trái cây', 'Táo', 'quả', 'apple,táo đỏ,táo xanh', 'apple'),
        ('Trái cây', 'Chuối', 'quả', 'banana,chuối tiêu,chuối tây', 'banana'),
        ('Trái cây', 'Cam', 'quả', 'orange,cam vàng', 'orange'),
        ('Trái cây', 'Dưa hấu', 'g', 'watermelon,dưa đỏ', 'watermelon'),
        ('Trái cây', 'Trái cây khác', 'g', 'hoa quả khác,trái cây khác,khác', 'fruit-other'),

        -- Thịt
        ('Thịt', 'Thịt lợn', 'g', 'thịt heo,heo,lợn,pork', 'pork'),
        ('Thịt', 'Thịt bò', 'g', 'bò,beef,thịt bò Mỹ', 'beef'),
        ('Thịt', 'Thịt gà', 'g', 'gà,chicken,ức gà,đùi gà', 'chicken'),
        ('Thịt', 'Xúc xích', 'g', 'sausage,xuc xich', 'sausage'),
        ('Thịt', 'Thịt khác', 'g', 'thịt khác,khác', 'meat-other'),

        -- Hải sản
        ('Hải sản', 'Cá hồi', 'g', 'salmon,cá hồi Nauy', 'salmon'),
        ('Hải sản', 'Tôm', 'g', 'shrimp,tôm sú,tôm thẻ', 'shrimp'),
        ('Hải sản', 'Mực', 'g', 'squid,mực ống,mực tươi', 'squid'),
        ('Hải sản', 'Cá thu', 'g', 'mackerel,cá biển', 'fish'),
        ('Hải sản', 'Hải sản khác', 'g', 'đồ biển khác,hải sản khác,khác', 'seafood-other'),

        -- Trứng & Sữa
        ('Trứng & Sữa', 'Trứng gà', 'quả', 'egg,trứng,trứng gà ta', 'egg'),
        ('Trứng & Sữa', 'Sữa tươi', 'ml', 'milk,sữa không đường,sữa có đường', 'milk'),
        ('Trứng & Sữa', 'Sữa chua', 'hộp', 'yogurt,yaourt', 'yogurt'),
        ('Trứng & Sữa', 'Phô mai', 'g', 'cheese,pho mai', 'cheese'),
        ('Trứng & Sữa', 'Trứng & Sữa khác', 'g', 'trứng khác,sữa khác,trứng sữa khác,khác', 'egg-milk-other'),

        -- Đồ khô
        ('Đồ khô', 'Gạo', 'g', 'rice,gạo tẻ,gạo nếp', 'rice'),
        ('Đồ khô', 'Mì gói', 'gói', 'instant noodle,mì ăn liền', 'noodle'),
        ('Đồ khô', 'Bún khô', 'g', 'bún,miến khô,phở khô', 'dry-noodle'),
        ('Đồ khô', 'Bột mì', 'g', 'flour,bột làm bánh', 'flour'),
        ('Đồ khô', 'Đồ khô khác', 'g', 'đồ khô khác,khác', 'dry-food-other'),

        -- Gia vị
        ('Gia vị', 'Muối', 'g', 'salt,muối ăn', 'salt'),
        ('Gia vị', 'Đường', 'g', 'sugar,đường trắng,đường nâu', 'sugar'),
        ('Gia vị', 'Nước mắm', 'ml', 'fish sauce,mắm', 'fish-sauce'),
        ('Gia vị', 'Dầu ăn', 'ml', 'cooking oil,dầu thực vật', 'oil'),
        ('Gia vị', 'Gia vị khác', 'g', 'gia vị khác,khác', 'spice-other'),

        -- Đồ uống
        ('Đồ uống', 'Nước lọc', 'ml', 'water,nước suối,nước tinh khiết', 'water'),
        ('Đồ uống', 'Nước cam', 'ml', 'orange juice,juice cam', 'orange-juice'),
        ('Đồ uống', 'Sữa đậu nành', 'ml', 'soy milk,sữa hạt', 'soy-milk'),
        ('Đồ uống', 'Trà xanh', 'ml', 'green tea,trà', 'tea'),
        ('Đồ uống', 'Đồ uống khác', 'ml', 'nước uống khác,đồ uống khác,khác', 'drink-other')
) AS v(category_name, food_name, unit, synonyms, icon_key)
JOIN categories c ON c.name = v.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM foods f
    WHERE LOWER(f.name) = LOWER(v.food_name)
);

-- =====================================================
-- 6. KIỂM TRA ID SAU KHI SEED
-- =====================================================

SELECT id, name
FROM roles
WHERE name IN ('ADMIN', 'CUSTOMER')
ORDER BY id;

SELECT id, email, full_name, family_id, role_id
FROM users
WHERE email IN ('admin@mealmate.local', 'user@mealmate.local')
ORDER BY id;

SELECT id, name, housekeeper_id
FROM families
WHERE name = 'Gia đình Minh Quang';

SELECT id, name
FROM categories
ORDER BY id;

SELECT f.id, f.name, c.name AS category_name, f.unit
FROM foods f
JOIN categories c ON f.category_id = c.id
ORDER BY c.id, f.id;

DO $$
BEGIN
    RAISE NOTICE 'Seed data completed successfully!';
END $$;