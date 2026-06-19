-- ============================================================
-- SEED 5: DA DANG HOA THUC PHAM VA DON VI DO
-- Chay sau: db.sql, seed_1.sql
--
-- Nguyen tac:
-- - Cap nhat foods.unit bang danh sach don vi phu hop, cach nhau boi dau phay.
-- - Bo sung tu dong nghia cho thuc pham hien co.
-- - Them thuc pham moi theo tung danh muc.
-- - Khong thay doi shopping_lists hoac shopping_list_items.
-- - Co the chay lai nhieu lan ma khong tao trung thuc pham.
-- ============================================================

BEGIN;

CREATE TEMP TABLE seed_5_foods (
    category_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    synonyms VARCHAR(500),
    image_url VARCHAR(500)
) ON COMMIT DROP;

INSERT INTO seed_5_foods (category_name, name, unit, synonyms, image_url) VALUES
-- Rau cu
('Rau củ', 'Rau muống', 'g, kg, bó', 'rau muống nước,rau muống cạn,rau muống đồng', NULL),
('Rau củ', 'Cải thìa', 'g, kg, bó', 'cải chíp,cải thìa non,bok choy', NULL),
('Rau củ', 'Cà rốt', 'g, kg', 'củ cà rốt,cà rốt Đà Lạt,cà rốt baby', NULL),
('Rau củ', 'Bí đỏ', 'g, kg', 'bí ngô,bí rợ,bí đỏ hồ lô', NULL),
('Rau củ', 'Nấm rơm', 'g, kg', 'nấm tươi,nấm rơm trắng,nấm rơm đen', NULL),
('Rau củ', 'Cà chua', 'kg, g, quả', 'cà chua đỏ,cà chua bi,cà chua beef', NULL),
('Rau củ', 'Tỏi', 'g, kg', 'củ tỏi,tỏi ta,tỏi cô đơn', NULL),
('Rau củ', 'Rau củ khác', 'g, kg', 'rau khác,củ khác,tự nhập rau củ,rau củ tùy chọn', NULL),
('Rau củ', 'Khoai tây', 'g, kg', 'khoai tây vàng,khoai tây bi', 'https://commons.wikimedia.org/wiki/Special:FilePath/Patates.jpg'),
('Rau củ', 'Hành tây', 'g, kg', 'củ hành tây,hành tây tím', 'https://commons.wikimedia.org/wiki/Special:FilePath/Onions.jpg'),
('Rau củ', 'Bông cải xanh', 'g, kg', 'súp lơ xanh,broccoli,bông cải', 'https://commons.wikimedia.org/wiki/Special:FilePath/Broccoli_and_cross_section_edit.jpg'),

-- Thit
('Thịt', 'Thịt ba chỉ heo', 'g, kg', 'ba rọi,thịt ba rọi,ba chỉ lợn', NULL),
('Thịt', 'Thịt nạc vai heo', 'g, kg', 'nạc vai,thịt vai,nạc dăm', NULL),
('Thịt', 'Ức gà', 'g, kg', 'lườn gà,thịt ức gà,phi lê gà', NULL),
('Thịt', 'Đùi gà', 'g, kg', 'đùi gà ta,đùi gà công nghiệp,đùi tỏi gà', NULL),
('Thịt', 'Thịt bò thăn', 'g, kg', 'bò thăn,thăn bò,phi lê bò', NULL),
('Thịt', 'Sườn non heo', 'g, kg', 'sườn non,sườn heo,sườn lợn', NULL),
('Thịt', 'Thịt khác', 'g, kg', 'thịt tự nhập,thịt tùy chọn,các loại thịt khác', NULL),
('Thịt', 'Thịt heo xay', 'g, kg', 'thịt lợn xay,thịt băm,thịt heo băm', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ground_meat.jpg'),
('Thịt', 'Cánh gà', 'g, kg', 'cánh gà ta,cánh gà công nghiệp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken_wings.jpg'),
('Thịt', 'Xúc xích', 'g, kg', 'xúc xích heo,xúc xích tiệt trùng,sausage', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sausages.jpg'),

-- Hai san
('Hải sản', 'Cá basa', 'g, kg', 'cá ba sa,cá phi lê basa,cá tra phi lê', NULL),
('Hải sản', 'Cá thu', 'g, kg', 'cá thu cắt khoanh,cá thu biển,cá thu tươi', NULL),
('Hải sản', 'Tôm sú', 'g, kg', 'tôm tươi,tôm biển,tôm sú sống', NULL),
('Hải sản', 'Mực ống', 'g, kg', 'mực tươi,mực lá nhỏ,mực ống tươi', NULL),
('Hải sản', 'Nghêu', 'g, kg', 'nghêu sống,ngao,ngao trắng', NULL),
('Hải sản', 'Cá hồi', 'g, kg', 'cá hồi phi lê,cá hồi tươi,salmon', NULL),
('Hải sản', 'Hải sản khác', 'g, kg', 'hải sản tự nhập,đồ biển khác,hải sản tùy chọn', NULL),
('Hải sản', 'Cua biển', 'g, kg', 'cua thịt,cua gạch,cua xanh', 'https://commons.wikimedia.org/wiki/Special:FilePath/Callinectes_sapidus.jpg'),
('Hải sản', 'Cá ngừ', 'g, kg', 'cá ngừ đại dương,cá ngừ phi lê,tuna', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tuna_assortment.png'),
('Hải sản', 'Tôm thẻ', 'g, kg', 'tôm thẻ chân trắng,tôm bạc', 'https://commons.wikimedia.org/wiki/Special:FilePath/Litopenaeus_vannamei.jpg'),

-- Trai cay
('Trái cây', 'Chuối', 'g, kg, quả', 'chuối tiêu,chuối sứ,chuối già', NULL),
('Trái cây', 'Xoài', 'g, kg, quả', 'xoài cát,xoài chín,xoài keo', NULL),
('Trái cây', 'Cam sành', 'g, kg, quả', 'cam,cam vắt nước,cam sành Hà Giang', NULL),
('Trái cây', 'Thanh long', 'g, kg, quả', 'thanh long ruột trắng,thanh long ruột đỏ', NULL),
('Trái cây', 'Dưa hấu', 'g, kg, quả', 'dưa hấu đỏ,dưa hấu không hạt,dưa hấu mini', NULL),
('Trái cây', 'Dứa', 'g, kg, quả', 'thơm,khóm,dứa chín', NULL),
('Trái cây', 'Trái cây khác', 'g, kg, quả', 'hoa quả khác,trái cây tự nhập,trái cây tùy chọn', NULL),
('Trái cây', 'Táo', 'g, kg, quả', 'táo đỏ,táo xanh,apple', 'https://commons.wikimedia.org/wiki/Special:FilePath/Red_Apple.jpg'),
('Trái cây', 'Nho', 'g, kg', 'nho xanh,nho đỏ,nho không hạt', 'https://commons.wikimedia.org/wiki/Special:FilePath/Table_grapes_on_white.jpg'),
('Trái cây', 'Bơ', 'g, kg, quả', 'trái bơ,bơ sáp,avocado', 'https://commons.wikimedia.org/wiki/Special:FilePath/Avocado_with_cross_section_edit.jpg'),

-- Trung va sua
('Trứng và sữa', 'Trứng gà', 'quả', 'hột gà,trứng gà ta,trứng gà công nghiệp', NULL),
('Trứng và sữa', 'Trứng vịt', 'quả', 'hột vịt,trứng vịt tươi,trứng vịt ta', NULL),
('Trứng và sữa', 'Sữa tươi không đường', 'ml, lít', 'sữa tươi,sữa hộp không đường,sữa thanh trùng', NULL),
('Trứng và sữa', 'Sữa chua', 'g, kg, hộp', 'sữa chua hộp,sữa chua có đường,yaourt', NULL),
('Trứng và sữa', 'Phô mai', 'g, kg', 'phô mai lát,phô mai miếng,cheese', NULL),
('Trứng và sữa', 'Bơ lạt', 'g, kg', 'bơ nhạt,bơ không muối,unsalted butter', NULL),
('Trứng và sữa', 'Trứng và sữa khác', 'g, kg, ml, lít, quả, hộp', 'sản phẩm trứng sữa khác,tự nhập trứng sữa', NULL),
('Trứng và sữa', 'Sữa đặc', 'g, kg, ml', 'sữa đặc có đường,sữa ông thọ,condensed milk', 'https://commons.wikimedia.org/wiki/Special:FilePath/Condensed_milk.jpg'),
('Trứng và sữa', 'Kem tươi', 'ml, lít', 'whipping cream,kem sữa,kem béo', 'https://commons.wikimedia.org/wiki/Special:FilePath/Whipped_cream.jpg'),
('Trứng và sữa', 'Đậu hũ', 'g, kg', 'đậu phụ,tàu hũ,tofu', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tofu_4.jpg'),

-- Do kho
('Đồ khô', 'Gạo tẻ', 'g, kg', 'gạo trắng,gạo nấu cơm,gạo tám', NULL),
('Đồ khô', 'Bánh phở khô', 'g, kg', 'bánh phở,phở khô,bánh đa phở', NULL),
('Đồ khô', 'Bún khô', 'g, kg', 'bún gạo,bún khô sợi nhỏ,bún khô', NULL),
('Đồ khô', 'Miến dong', 'g, kg', 'miến,miến khô,miến dong khô', NULL),
('Đồ khô', 'Đậu xanh', 'g, kg', 'đỗ xanh,đậu xanh cà vỏ,đậu xanh nguyên hạt', NULL),
('Đồ khô', 'Đậu phộng', 'g, kg', 'lạc,đậu phụng,lạc nhân', NULL),
('Đồ khô', 'Mộc nhĩ', 'g, kg', 'nấm mèo,mộc nhĩ khô,nấm tai mèo', NULL),
('Đồ khô', 'Đồ khô khác', 'g, kg', 'đồ khô tự nhập,nguyên liệu khô khác,đồ khô tùy chọn', NULL),
('Đồ khô', 'Yến mạch', 'g, kg', 'oatmeal,yến mạch cán dẹt,yến mạch nguyên hạt', 'https://commons.wikimedia.org/wiki/Special:FilePath/Oats.jpg'),
('Đồ khô', 'Mì ăn liền', 'g, kg', 'mì gói,mì tôm,instant noodles', 'https://commons.wikimedia.org/wiki/Special:FilePath/Instant_noodles.jpg'),
('Đồ khô', 'Bột mì', 'g, kg', 'bột lúa mì,bột mì đa dụng,flour', 'https://commons.wikimedia.org/wiki/Special:FilePath/Wheat_flour.jpg'),

-- Gia vi
('Gia vị', 'Nước mắm', 'ml, lít', 'nước mắm nhĩ,nước mắm cá cơm,nước mắm truyền thống', NULL),
('Gia vị', 'Dầu ăn', 'ml, lít', 'dầu thực vật,dầu đậu nành,dầu chiên', NULL),
('Gia vị', 'Muối', 'g, kg', 'muối biển,muối tinh,muối i-ốt', NULL),
('Gia vị', 'Đường', 'g, kg', 'đường trắng,đường kính,đường cát', NULL),
('Gia vị', 'Hạt nêm', 'g, kg', 'bột nêm,hạt nêm thịt,hạt nêm rau củ', NULL),
('Gia vị', 'Tiêu xay', 'g, kg', 'hạt tiêu,tiêu đen,tiêu bột', NULL),
('Gia vị', 'Gừng', 'g, kg', 'củ gừng,gừng ta,gừng già', NULL),
('Gia vị', 'Gia vị khác', 'g, kg, ml, lít', 'gia vị tự nhập,gia vị tùy chọn,các loại gia vị khác', NULL),
('Gia vị', 'Tương ớt', 'ml, lít', 'sốt ớt,chili sauce,tương ớt cay', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sriracha_sauce.jpg'),
('Gia vị', 'Xì dầu', 'ml, lít', 'nước tương,soy sauce,tàu vị yểu', 'https://commons.wikimedia.org/wiki/Special:FilePath/Soy_sauce_2.jpg'),
('Gia vị', 'Giấm', 'ml, lít', 'dấm,giấm gạo,giấm ăn', 'https://commons.wikimedia.org/wiki/Special:FilePath/Vinegar.jpg'),

-- Do uong
('Đồ uống', 'Trà xanh', 'g, kg', 'chè xanh,trà mạn,trà lá', NULL),
('Đồ uống', 'Cà phê rang xay', 'g, kg', 'cà phê phin,cà phê bột,cà phê xay', NULL),
('Đồ uống', 'Nước dừa', 'ml, lít', 'nước dừa tươi,dừa xiêm,nước dừa đóng hộp', NULL),
('Đồ uống', 'Sữa đậu nành', 'ml, lít', 'sữa đậu tương,sữa đậu nành nhà làm', NULL),
('Đồ uống', 'Nước cam ép', 'ml, lít', 'nước cam vắt,cam ép,nước ép cam', NULL),
('Đồ uống', 'Nước suối', 'ml, lít', 'nước khoáng,nước uống đóng chai,nước tinh khiết', NULL),
('Đồ uống', 'Đồ uống khác', 'ml, lít', 'thức uống tự nhập,nước uống khác,đồ uống tùy chọn', NULL),
('Đồ uống', 'Nước ngọt', 'ml, lít', 'nước có ga,soda,soft drink', 'https://commons.wikimedia.org/wiki/Special:FilePath/Soft_drink_shelf_2.jpg'),
('Đồ uống', 'Bia', 'ml, lít', 'bia lon,bia chai,beer', 'https://commons.wikimedia.org/wiki/Special:FilePath/Beer_bottles.jpg'),
('Đồ uống', 'Bột cacao', 'g, kg', 'cacao powder,bột ca cao,cocoa', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cocoa_powder.jpg');

-- Cap nhat thuc pham da ton tai.
UPDATE foods f
SET category_id = c.id,
    unit = s.unit,
    synonyms = s.synonyms,
    image_url = COALESCE(s.image_url, f.image_url),
    updated_at = CURRENT_TIMESTAMP
FROM seed_5_foods s
JOIN categories c ON c.name = s.category_name
WHERE LOWER(BTRIM(f.name)) = LOWER(BTRIM(s.name));

-- Them thuc pham moi neu chua co.
INSERT INTO foods (
    category_id,
    name,
    unit,
    synonyms,
    image_url,
    is_system,
    created_at,
    updated_at
)
SELECT
    c.id,
    s.name,
    s.unit,
    s.synonyms,
    s.image_url,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_5_foods s
JOIN categories c ON c.name = s.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM foods f
    WHERE LOWER(BTRIM(f.name)) = LOWER(BTRIM(s.name))
);

-- Ghi de don vi cho du lieu fridge_items cu theo cach du lieu demo da nhap quantity:
-- - Chat long: <= 10 tinh theo lit, lon hon tinh theo ml.
-- - Thit, hai san, rau cu, trai cay, do kho: < 10 tinh theo kg, con lai tinh theo g.
-- - Cac thuc pham dem theo don vi gia dinh quen dung duoc xu ly rieng.
UPDATE fridge_items fi
SET unit = CASE
        WHEN f.name = 'Rau muống' THEN 'bó'
        WHEN f.name IN ('Trứng gà', 'Trứng vịt') THEN 'quả'
        WHEN f.name = 'Sữa chua' THEN 'hộp'
        WHEN f.name = 'Dứa' THEN 'quả'
        WHEN f.name IN (
            'Sữa tươi không đường',
            'Kem tươi',
            'Nước mắm',
            'Dầu ăn',
            'Tương ớt',
            'Xì dầu',
            'Giấm',
            'Nước dừa',
            'Sữa đậu nành',
            'Nước cam ép',
            'Nước suối',
            'Đồ uống khác',
            'Nước ngọt',
            'Bia'
        ) THEN CASE WHEN fi.quantity <= 10 THEN 'lít' ELSE 'ml' END
        WHEN fi.quantity < 10 THEN 'kg'
        ELSE 'g'
    END,
    updated_at = CURRENT_TIMESTAMP
FROM foods f
WHERE fi.food_id = f.id;

-- Kiem tra ket qua.
SELECT
    COUNT(*) AS configured_foods,
    COUNT(*) FILTER (WHERE f.unit LIKE '%,%') AS multi_unit_foods
FROM foods f
JOIN seed_5_foods s ON LOWER(BTRIM(f.name)) = LOWER(BTRIM(s.name));

SELECT
    c.name AS category_name,
    COUNT(*) AS food_count,
    COUNT(*) FILTER (WHERE f.unit LIKE '%,%') AS multi_unit_count
FROM foods f
JOIN categories c ON c.id = f.category_id
GROUP BY c.id, c.name
ORDER BY c.id;

COMMIT;
