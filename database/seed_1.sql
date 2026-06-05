-- ==========================================
-- SEED DATA CHUNG CHO HỆ THỐNG MEALMATE
-- Ghi chú bắt buộc: Mật khẩu mặc định của tất cả tài khoản seed là '123456'.
-- Giá trị password_hash bên dưới là BCrypt hash hợp lệ của chuỗi '123456'.
-- ==========================================

BEGIN;

-- ==========================================
-- 1. VAI TRÒ, QUYỀN VÀ PHÂN QUYỀN
-- ==========================================

UPDATE roles
SET description = 'Quản trị viên hệ thống, có toàn quyền quản lý dữ liệu chung'
WHERE name = 'ADMIN';

UPDATE roles
SET description = 'Thành viên gia đình, có thể xem và cùng cập nhật dữ liệu sinh hoạt'
WHERE name = 'CUSTOMER';

INSERT INTO roles (name, description, is_active)
VALUES ('HOUSEKEEPER', 'Chủ nhà hoặc người nội trợ chính, quản lý gia đình và kế hoạch ăn uống', TRUE)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO permissions (name, api_path, method, module) VALUES
('Xem danh sách quyền', '/api/permissions', 'GET', 'AUTH'),
('Tạo quyền hệ thống', '/api/permissions', 'POST', 'AUTH'),
('Cập nhật quyền hệ thống', '/api/permissions/{id}', 'PUT', 'AUTH'),
('Xóa quyền hệ thống', '/api/permissions/{id}', 'DELETE', 'AUTH'),
('Xem danh sách vai trò', '/api/roles', 'GET', 'AUTH'),
('Tạo vai trò', '/api/roles', 'POST', 'AUTH'),
('Cập nhật vai trò', '/api/roles/{id}', 'PUT', 'AUTH'),
('Gán quyền cho vai trò', '/api/roles/{id}/permissions', 'POST', 'AUTH'),
('Xem danh sách người dùng', '/api/users', 'GET', 'USER'),
('Tạo người dùng', '/api/users', 'POST', 'USER'),
('Cập nhật thông tin người dùng', '/api/users/{id}', 'PUT', 'USER'),
('Khóa hoặc mở khóa người dùng', '/api/users/{id}/status', 'PATCH', 'USER'),
('Xem thông tin gia đình', '/api/families/{id}', 'GET', 'FAMILY'),
('Cập nhật thông tin gia đình', '/api/families/{id}', 'PUT', 'FAMILY'),
('Mời thành viên vào gia đình', '/api/invitations', 'POST', 'FAMILY'),
('Phản hồi lời mời gia đình', '/api/invitations/{id}', 'PATCH', 'FAMILY'),
('Xem danh mục thực phẩm', '/api/categories', 'GET', 'FOOD'),
('Quản lý danh mục thực phẩm', '/api/categories', 'POST', 'FOOD'),
('Xem danh sách thực phẩm', '/api/foods', 'GET', 'FOOD'),
('Quản lý thực phẩm hệ thống', '/api/foods', 'POST', 'FOOD'),
('Cập nhật thực phẩm', '/api/foods/{id}', 'PUT', 'FOOD'),
('Xem hướng dẫn bảo quản', '/api/foods/{id}/preservation', 'GET', 'FOOD'),
('Xem tủ lạnh gia đình', '/api/fridge-items', 'GET', 'FRIDGE'),
('Thêm thực phẩm vào tủ lạnh', '/api/fridge-items', 'POST', 'FRIDGE'),
('Cập nhật thực phẩm trong tủ lạnh', '/api/fridge-items/{id}', 'PUT', 'FRIDGE'),
('Loại bỏ thực phẩm khỏi tủ lạnh', '/api/fridge-items/{id}/remove', 'PATCH', 'FRIDGE'),
('Xem danh sách mua sắm', '/api/shopping-lists', 'GET', 'SHOPPING'),
('Tạo danh sách mua sắm', '/api/shopping-lists', 'POST', 'SHOPPING'),
('Cập nhật mục cần mua', '/api/shopping-list-items/{id}', 'PUT', 'SHOPPING'),
('Đánh dấu đã mua', '/api/shopping-list-items/{id}/purchased', 'PATCH', 'SHOPPING'),
('Xem công thức nấu ăn', '/api/recipes', 'GET', 'RECIPE'),
('Quản lý công thức nấu ăn', '/api/recipes', 'POST', 'RECIPE'),
('Cập nhật công thức nấu ăn', '/api/recipes/{id}', 'PUT', 'RECIPE'),
('Yêu thích công thức nấu ăn', '/api/recipes/{id}/favorite', 'POST', 'RECIPE'),
('Xem thực đơn gia đình', '/api/menus', 'GET', 'MEAL'),
('Tạo thực đơn gia đình', '/api/menus', 'POST', 'MEAL'),
('Cập nhật bữa ăn trong thực đơn', '/api/meals/{id}', 'PUT', 'MEAL'),
('Chốt món ăn cho bữa', '/api/meal-items/{id}/confirm', 'PATCH', 'MEAL');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'HOUSEKEEPER'
  AND p.module IN ('FAMILY', 'FOOD', 'FRIDGE', 'SHOPPING', 'RECIPE', 'MEAL');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'CUSTOMER'
  AND p.name IN (
      'Xem thông tin gia đình',
      'Phản hồi lời mời gia đình',
      'Xem danh mục thực phẩm',
      'Xem danh sách thực phẩm',
      'Xem hướng dẫn bảo quản',
      'Xem tủ lạnh gia đình',
      'Thêm thực phẩm vào tủ lạnh',
      'Cập nhật thực phẩm trong tủ lạnh',
      'Loại bỏ thực phẩm khỏi tủ lạnh',
      'Xem danh sách mua sắm',
      'Cập nhật mục cần mua',
      'Đánh dấu đã mua',
      'Xem công thức nấu ăn',
      'Yêu thích công thức nấu ăn',
      'Xem thực đơn gia đình'
  );

-- ==========================================
-- 2. NGƯỜI DÙNG VÀ GIA ĐÌNH
-- ==========================================

INSERT INTO users (role_id, email, password_hash, full_name, phone, gender, avatar_url, email_verified) VALUES
((SELECT id FROM roles WHERE name = 'ADMIN'), 'quantri@mealmate.vn', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Quản trị viên MealMate', '0901000001', 'OTHER', 'https://i.pravatar.cc/300?img=12', TRUE),
((SELECT id FROM roles WHERE name = 'HOUSEKEEPER'), 'lan.nguyen@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Nguyễn Thị Lan', '0912345678', 'FEMALE', 'https://i.pravatar.cc/300?img=47', TRUE),
((SELECT id FROM roles WHERE name = 'CUSTOMER'), 'minh.nguyen@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Nguyễn Hoàng Minh', '0912345679', 'MALE', 'https://i.pravatar.cc/300?img=11', TRUE),
((SELECT id FROM roles WHERE name = 'CUSTOMER'), 'anh.nguyen@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Nguyễn Khánh An', '0912345680', 'FEMALE', 'https://i.pravatar.cc/300?img=32', TRUE),
((SELECT id FROM roles WHERE name = 'CUSTOMER'), 'binh.nguyen@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Nguyễn Gia Bình', '0912345681', 'MALE', 'https://i.pravatar.cc/300?img=18', TRUE),
((SELECT id FROM roles WHERE name = 'HOUSEKEEPER'), 'huong.tran@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Trần Thu Hương', '0987654321', 'FEMALE', 'https://i.pravatar.cc/300?img=45', TRUE),
((SELECT id FROM roles WHERE name = 'CUSTOMER'), 'khoa.tran@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Trần Minh Khoa', '0987654322', 'MALE', 'https://i.pravatar.cc/300?img=14', TRUE),
((SELECT id FROM roles WHERE name = 'CUSTOMER'), 'mai.tran@example.com', '$2a$10$1sovGk7R/WWccz.5eLCfUO6dI1uabs7xL6o98ilj.Db5RIK3zvq9K', 'Trần Ngọc Mai', '0987654323', 'FEMALE', 'https://i.pravatar.cc/300?img=29', TRUE);

INSERT INTO families (name, housekeeper_id) VALUES
('Gia đình An An', (SELECT id FROM users WHERE email = 'lan.nguyen@example.com')),
('Gia đình Trần Sum Vầy', (SELECT id FROM users WHERE email = 'huong.tran@example.com'));

UPDATE users
SET family_id = (SELECT id FROM families WHERE name = 'Gia đình An An')
WHERE email IN ('lan.nguyen@example.com', 'minh.nguyen@example.com', 'anh.nguyen@example.com', 'binh.nguyen@example.com');

UPDATE users
SET family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy')
WHERE email IN ('huong.tran@example.com', 'khoa.tran@example.com', 'mai.tran@example.com');

-- ==========================================
-- 3. DANH MỤC VÀ THỰC PHẨM DÙNG CHUNG
-- ==========================================

INSERT INTO categories (name, icon_key, color_code) VALUES
('Rau củ', 'vegetable', '#E8F5E9'),
('Thịt', 'meat', '#FFEBEE'),
('Hải sản', 'fish', '#E3F2FD'),
('Trái cây', 'fruit', '#FFF8E1'),
('Trứng và sữa', 'dairy', '#F3E5F5'),
('Đồ khô', 'dry_food', '#EFEBE9'),
('Gia vị', 'spice', '#FFF3E0'),
('Đồ uống', 'drink', '#E0F7FA');

INSERT INTO foods (category_id, name, unit, synonyms, image_url, is_system) VALUES
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Rau muống', 'bó', 'rau muống nước,rau muống cạn', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ipomoea_aquatica.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Cải thìa', 'kg', 'cải chíp,cải thìa non', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bok_choy.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Cà rốt', 'kg', 'củ cà rốt,cà rốt Đà Lạt', 'https://commons.wikimedia.org/wiki/Special:FilePath/Carrots.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Bí đỏ', 'kg', 'bí ngô,bí rợ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pumpkins.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Nấm rơm', 'g', 'nấm tươi,nấm rơm trắng', 'https://commons.wikimedia.org/wiki/Special:FilePath/Volvariella_volvacea.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Cà chua', 'kg', 'cà chua đỏ,cà chua bi', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tomatoes.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Tỏi', 'g', 'củ tỏi,tỏi ta', 'https://commons.wikimedia.org/wiki/Special:FilePath/Garlic.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Rau củ'), 'Rau củ khác', 'phần', 'rau khác,củ khác,tự nhập rau củ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Vegetables.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Thịt'), 'Thịt ba chỉ heo', 'kg', 'ba rọi,thịt ba rọi', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pork_belly.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Thịt'), 'Thịt nạc vai heo', 'kg', 'nạc vai,thịt vai', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pork_shoulder.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Thịt'), 'Ức gà', 'kg', 'lườn gà,thịt ức gà', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken_breast.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Thịt'), 'Đùi gà', 'kg', 'đùi gà ta,đùi gà công nghiệp', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken_legs.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Thịt'), 'Thịt bò thăn', 'kg', 'bò thăn,thăn bò', 'https://commons.wikimedia.org/wiki/Special:FilePath/Beef_tenderloin.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Thịt'), 'Sườn non heo', 'kg', 'sườn non,sườn heo', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pork_ribs.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Thịt'), 'Thịt khác', 'phần', 'thịt tự nhập,thịt tùy chọn', 'https://commons.wikimedia.org/wiki/Special:FilePath/Meat.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Hải sản'), 'Cá basa', 'kg', 'cá ba sa,cá phi lê basa', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pangasius_fillet.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Hải sản'), 'Cá thu', 'kg', 'cá thu cắt khoanh,cá thu biển', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mackerel.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Hải sản'), 'Tôm sú', 'kg', 'tôm tươi,tôm biển', 'https://commons.wikimedia.org/wiki/Special:FilePath/Penaeus_monodon.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Hải sản'), 'Mực ống', 'kg', 'mực tươi,mực lá nhỏ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Squid.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Hải sản'), 'Nghêu', 'kg', 'nghêu sống,ngao', 'https://commons.wikimedia.org/wiki/Special:FilePath/Clams.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Hải sản'), 'Cá hồi', 'kg', 'cá hồi phi lê,cá hồi tươi', 'https://commons.wikimedia.org/wiki/Special:FilePath/Salmon_fillet.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Hải sản'), 'Hải sản khác', 'phần', 'hải sản tự nhập,đồ biển khác', 'https://commons.wikimedia.org/wiki/Special:FilePath/Seafood.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Trái cây'), 'Chuối', 'nải', 'chuối tiêu,chuối sứ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bananas.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trái cây'), 'Xoài', 'kg', 'xoài cát,xoài chín', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mangoes.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trái cây'), 'Cam sành', 'kg', 'cam,cam vắt nước', 'https://commons.wikimedia.org/wiki/Special:FilePath/Oranges.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trái cây'), 'Thanh long', 'kg', 'thanh long ruột trắng,thanh long ruột đỏ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pitaya_cross_section_ed2.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trái cây'), 'Dưa hấu', 'kg', 'dưa hấu đỏ,dưa hấu không hạt', 'https://commons.wikimedia.org/wiki/Special:FilePath/Watermelon.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trái cây'), 'Dứa', 'quả', 'thơm,khóm,dứa chín', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pineapple.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trái cây'), 'Trái cây khác', 'phần', 'hoa quả khác,trái cây tự nhập', 'https://commons.wikimedia.org/wiki/Special:FilePath/Fruit.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Trứng gà', 'quả', 'hột gà,trứng gà ta', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken_eggs.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Trứng vịt', 'quả', 'hột vịt,trứng vịt tươi', 'https://commons.wikimedia.org/wiki/Special:FilePath/Duck_eggs.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Sữa tươi không đường', 'lít', 'sữa tươi,sữa hộp không đường', 'https://commons.wikimedia.org/wiki/Special:FilePath/Glass_of_milk.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Sữa chua', 'hộp', 'sữa chua hộp,sữa chua có đường', 'https://commons.wikimedia.org/wiki/Special:FilePath/Yogurt.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Phô mai', 'g', 'phô mai lát,phô mai miếng', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cheese.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Bơ lạt', 'g', 'bơ nhạt,bơ không muối', 'https://commons.wikimedia.org/wiki/Special:FilePath/Butter.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Trứng và sữa'), 'Trứng và sữa khác', 'phần', 'sản phẩm trứng sữa khác,tự nhập trứng sữa', 'https://commons.wikimedia.org/wiki/Special:FilePath/Dairy_products.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Gạo tẻ', 'kg', 'gạo trắng,gạo nấu cơm', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rice_grains.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Bánh phở khô', 'g', 'bánh phở,phở khô', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rice_noodles.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Bún khô', 'g', 'bún gạo,bún khô sợi nhỏ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rice_vermicelli.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Miến dong', 'g', 'miến,miến khô', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cellophane_noodles.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Đậu xanh', 'kg', 'đỗ xanh,đậu xanh cà vỏ', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mung_beans.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Đậu phộng', 'kg', 'lạc,đậu phụng', 'https://commons.wikimedia.org/wiki/Special:FilePath/Peanuts.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Mộc nhĩ', 'g', 'nấm mèo,mộc nhĩ khô', 'https://commons.wikimedia.org/wiki/Special:FilePath/Auricularia_auricula-judae.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ khô'), 'Đồ khô khác', 'phần', 'đồ khô tự nhập,nguyên liệu khô khác', 'https://commons.wikimedia.org/wiki/Special:FilePath/Dried_food.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Gia vị'), 'Nước mắm', 'ml', 'nước mắm nhĩ,nước mắm cá cơm', 'https://commons.wikimedia.org/wiki/Special:FilePath/Fish_sauce.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Dầu ăn', 'ml', 'dầu thực vật,dầu đậu nành', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cooking_oil.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Muối', 'g', 'muối biển,muối tinh', 'https://commons.wikimedia.org/wiki/Special:FilePath/Salt.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Đường', 'g', 'đường trắng,đường kính', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sugar.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Hạt nêm', 'g', 'bột nêm,hạt nêm thịt', 'https://commons.wikimedia.org/wiki/Special:FilePath/Seasoning.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Tiêu xay', 'g', 'hạt tiêu,tiêu đen', 'https://commons.wikimedia.org/wiki/Special:FilePath/Black_pepper.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Gừng', 'g', 'củ gừng,gừng ta', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ginger.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Gia vị'), 'Gia vị khác', 'phần', 'gia vị tự nhập,gia vị tùy chọn', 'https://commons.wikimedia.org/wiki/Special:FilePath/Spices.jpg', TRUE),

((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Trà xanh', 'g', 'chè xanh,trà mạn', 'https://commons.wikimedia.org/wiki/Special:FilePath/Green_tea_leaves.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Cà phê rang xay', 'g', 'cà phê phin,cà phê bột', 'https://commons.wikimedia.org/wiki/Special:FilePath/Roasted_coffee_beans.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Nước dừa', 'lít', 'nước dừa tươi,dừa xiêm', 'https://commons.wikimedia.org/wiki/Special:FilePath/Coconut_water.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Sữa đậu nành', 'lít', 'sữa đậu tương,sữa đậu nành nhà làm', 'https://commons.wikimedia.org/wiki/Special:FilePath/Soy_milk.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Nước cam ép', 'lít', 'nước cam vắt,cam ép', 'https://commons.wikimedia.org/wiki/Special:FilePath/Orange_juice.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Nước suối', 'chai', 'nước khoáng,nước uống đóng chai', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bottled_water.jpg', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Đồ uống khác', 'phần', 'thức uống tự nhập,nước uống khác', 'https://commons.wikimedia.org/wiki/Special:FilePath/Drinks.jpg', TRUE);

-- ==========================================
-- 4. HƯỚNG DẪN BẢO QUẢN
-- ==========================================

INSERT INTO preservation_methods (food_id, content, reference_source) VALUES
((SELECT id FROM foods WHERE name = 'Rau muống'), 'Nhặt bỏ lá úa, không rửa trước khi cất. Bọc bằng giấy khô rồi cho vào túi thoáng, bảo quản ở ngăn rau 2-3 ngày.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cải thìa'), 'Cắt bỏ gốc dập, lau khô phần lá. Đặt trong hộp có lót giấy thấm ẩm và dùng trong 3 ngày để rau còn giòn.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cà rốt'), 'Cắt bỏ phần lá nếu có, lau khô rồi để trong túi kín ở ngăn mát. Tránh đặt cạnh trái cây chín để hạn chế nhanh mềm.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Bí đỏ'), 'Bí nguyên quả để nơi khô thoáng. Bí đã cắt cần bọc kín mặt cắt, để ngăn mát và dùng trong 3-5 ngày.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Nấm rơm'), 'Không ngâm nước lâu. Cho nấm vào hộp giấy hoặc túi giấy, bảo quản ngăn mát và dùng càng sớm càng tốt.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cà chua'), 'Cà chua chưa chín nên để nơi thoáng mát. Cà đã chín có thể để ngăn mát nhưng nên dùng trong 2-3 ngày.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Tỏi'), 'Để nơi khô, thoáng, tránh nắng trực tiếp. Không cho tỏi nguyên củ vào ngăn mát vì dễ ẩm mốc.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Thịt ba chỉ heo'), 'Chia khẩu phần trước khi cấp đông. Nếu để ngăn mát nên dùng trong 1-2 ngày, nếu cấp đông cần bọc kín để tránh ám mùi.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Thịt nạc vai heo'), 'Rửa nhanh, thấm khô, chia từng phần vừa nấu. Dán nhãn ngày mua trước khi để ngăn đông.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Ức gà'), 'Bỏ phần nước trong khay, thấm khô và bọc kín. Dùng trong 1-2 ngày nếu để ngăn mát.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Đùi gà'), 'Ướp nhẹ muối hoặc gừng nếu dùng trong ngày. Nếu chưa dùng ngay, cấp đông theo từng phần để dễ rã đông.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Thịt bò thăn'), 'Bọc kín bằng màng bọc hoặc túi hút khí. Rã đông chậm trong ngăn mát để thịt giữ nước tốt hơn.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Sườn non heo'), 'Chần sơ nếu muốn nấu trong ngày. Nếu để lâu hơn, chia túi nhỏ và cấp đông ngay sau khi mua.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cá basa'), 'Thấm khô, bọc kín và để ngăn đông nếu chưa dùng trong ngày. Khi rã đông nên để trong ngăn mát qua đêm.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cá thu'), 'Ướp nhẹ muối, tiêu hoặc nước mắm rồi bọc kín. Cá biển nên dùng sớm để giữ vị ngọt.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Tôm sú'), 'Cắt râu, rửa nhanh, để ráo. Có thể cấp đông cùng ít nước sạch để tôm ít bị khô.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Mực ống'), 'Làm sạch túi mực và nội tạng, thấm khô rồi cấp đông. Không rã đông bằng nước nóng vì mực dễ dai.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Nghêu'), 'Ngâm nước muối loãng với vài lát ớt để nhả cát. Nên nấu trong ngày, không để kín quá lâu.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cá hồi'), 'Giữ lạnh liên tục, bọc kín để tránh ám mùi. Nếu ăn chín, nên dùng trong 1-2 ngày.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Chuối'), 'Để nơi thoáng, tránh ánh nắng. Nếu chuối đã chín nhanh, tách từng quả và đặt xa trái cây khác.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Xoài'), 'Xoài xanh để nhiệt độ phòng cho chín tự nhiên. Xoài chín nên bọc kín và dùng trong 2-3 ngày.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cam sành'), 'Để nơi mát hoặc ngăn mát. Lau khô vỏ trước khi cất để hạn chế mốc.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Thanh long'), 'Bọc từng quả bằng giấy hoặc túi thoáng, để ngăn mát và tránh đè nặng.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Dưa hấu'), 'Dưa nguyên quả để nơi thoáng mát. Dưa đã cắt cần bọc kín, để ngăn mát và dùng trong 24 giờ.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Dứa'), 'Dứa đã gọt nên cho vào hộp kín, bảo quản ngăn mát. Dùng trong 1-2 ngày để giữ vị thơm.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Trứng gà'), 'Đặt đầu nhỏ xuống dưới, không rửa trứng trước khi cất. Bảo quản ngăn mát riêng khỏi thực phẩm mùi mạnh.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Trứng vịt'), 'Lau sạch vỏ bằng khăn khô, để trong khay trứng. Dùng trước các quả có vết nứt nhỏ.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Sữa tươi không đường'), 'Sau khi mở hộp cần đậy kín, để ngăn mát và dùng theo hạn khuyến nghị trên bao bì.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Sữa chua'), 'Luôn giữ lạnh, không để ở cánh tủ quá lâu nếu tủ thường xuyên mở. Dùng trước hạn in trên nắp.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Phô mai'), 'Bọc kín phần đã mở bằng giấy nến hoặc hộp kín. Tránh để phô mai tiếp xúc hơi ẩm.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Gạo tẻ'), 'Để trong thùng kín, nơi khô ráo. Có thể đặt vài tép tỏi khô hoặc lá chanh khô để hạn chế mọt.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Bánh phở khô'), 'Cột kín miệng túi sau khi mở. Để nơi khô ráo, tránh hơi nước từ bếp.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Bún khô'), 'Bảo quản trong hộp kín hoặc túi kẹp kín. Kiểm tra mùi lạ trước khi nấu.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Miến dong'), 'Để nơi khô thoáng, tránh ánh nắng trực tiếp. Buộc kín để miến không hút ẩm.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Đậu xanh'), 'Đựng trong hũ kín, có thể phơi nắng nhẹ trước khi cất nếu mua số lượng nhiều.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Nước mắm'), 'Đậy nắp sau mỗi lần dùng, để nơi khô mát. Tránh để gần bếp nóng làm nước mắm đổi mùi.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Dầu ăn'), 'Đậy kín nắp, tránh ánh nắng trực tiếp. Không đổ dầu đã chiên lại vào chai dầu mới.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Gừng'), 'Bọc gừng bằng giấy khô rồi để ngăn mát, hoặc vùi trong cát sạch nếu muốn để lâu.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Trà xanh'), 'Để trà trong hộp kín, tránh ẩm và mùi mạnh. Không đặt gần gia vị nặng mùi.', 'Kinh nghiệm nội trợ Việt Nam'),
((SELECT id FROM foods WHERE name = 'Cà phê rang xay'), 'Đậy kín sau khi mở gói, để nơi khô mát. Không để cà phê trong tủ lạnh nếu bao bì không kín.', 'Kinh nghiệm nội trợ Việt Nam');

-- ==========================================
-- 5. TỦ LẠNH MẪU CHO 2 GIA ĐÌNH
-- ==========================================

INSERT INTO fridge_items (family_id, food_id, quantity, storage_location, specific_location, added_date, expiry_date, status, note) VALUES
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Rau muống'), 2, 'COOL', 'VEGETABLE_DRAWER', '2026-06-03', '2026-06-07', 'STORED', 'Mua ở chợ Nghĩa Tân, rau còn tươi'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Cà chua'), 1.5, 'COOL', 'VEGETABLE_DRAWER', '2026-06-02', '2026-06-09', 'STORED', 'Dùng nấu canh chua và sốt cà'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Thịt ba chỉ heo'), 1.2, 'FREEZER', 'MIDDLE_SHELF', '2026-06-01', '2026-07-01', 'STORED', 'Chia 3 túi nhỏ để kho và rang'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Thịt bò thăn'), 0.8, 'FREEZER', 'TOP_SHELF', '2026-06-04', '2026-07-04', 'STORED', 'Để làm bò lúc lắc cuối tuần'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Cá basa'), 0.7, 'FREEZER', 'BOTTOM_SHELF', '2026-06-02', '2026-06-25', 'STORED', 'Phi lê đã rửa sạch'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Trứng gà'), 12, 'COOL', 'DOOR_SHELF', '2026-05-30', '2026-06-20', 'STORED', 'Dùng dần cho bữa sáng'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Sữa chua'), 8, 'COOL', 'TOP_SHELF', '2026-06-01', '2026-06-15', 'STORED', 'Cho bé ăn sau bữa tối'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Gạo tẻ'), 8, 'DRY', 'BOTTOM_SHELF', '2026-05-20', '2026-12-31', 'STORED', 'Gạo tám thơm mới mua'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 1, 'DRY', 'TOP_SHELF', '2026-05-25', '2027-05-25', 'STORED', 'Chai đang dùng dở'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Chuối'), 1, 'COOL', 'BOTTOM_SHELF', '2026-05-29', '2026-06-03', 'EXPIRED', 'Chuối đã quá chín, cần kiểm tra trước khi dùng'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM foods WHERE name = 'Ức gà'), 0.5, 'FREEZER', 'TOP_SHELF', '2026-05-28', '2026-06-20', 'USED', 'Đã dùng nấu cháo gà'),

((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Cải thìa'), 1.2, 'COOL', 'VEGETABLE_DRAWER', '2026-06-04', '2026-06-08', 'STORED', 'Rau cho món xào tỏi'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Bí đỏ'), 1.8, 'COOL', 'BOTTOM_SHELF', '2026-06-01', '2026-06-12', 'STORED', 'Một nửa quả bí đỏ'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Sườn non heo'), 1, 'FREEZER', 'MIDDLE_SHELF', '2026-06-02', '2026-07-02', 'STORED', 'Dùng kho tiêu hoặc nấu canh'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Đùi gà'), 1.4, 'FREEZER', 'TOP_SHELF', '2026-06-01', '2026-06-28', 'STORED', 'Đùi gà đã chia 2 phần'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Tôm sú'), 0.9, 'FREEZER', 'BOTTOM_SHELF', '2026-06-03', '2026-06-24', 'STORED', 'Tôm còn vỏ, đã cắt râu'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Mực ống'), 0.6, 'FREEZER', 'BOTTOM_SHELF', '2026-06-02', '2026-06-23', 'STORED', 'Làm sạch sẵn'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Trứng vịt'), 10, 'COOL', 'DOOR_SHELF', '2026-05-31', '2026-06-18', 'STORED', 'Dùng làm món kho'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Bún khô'), 700, 'DRY', 'MIDDLE_SHELF', '2026-05-15', '2026-10-15', 'STORED', 'Còn nguyên nửa gói lớn'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Miến dong'), 500, 'DRY', 'MIDDLE_SHELF', '2026-05-16', '2026-11-16', 'STORED', 'Dành cho món miến gà'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Xoài'), 2, 'COOL', 'BOTTOM_SHELF', '2026-06-03', '2026-06-09', 'STORED', 'Xoài cát Hòa Lộc chín vừa'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM foods WHERE name = 'Sữa tươi không đường'), 2, 'COOL', 'DOOR_SHELF', '2026-06-01', '2026-06-12', 'STORED', 'Dùng pha sinh tố');

-- ==========================================
-- 6. DANH SÁCH MUA SẮM
-- ==========================================

INSERT INTO shopping_lists (created_by, family_id, created_date, planned_date, note) VALUES
((SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), (SELECT id FROM families WHERE name = 'Gia đình An An'), '2026-06-04', '2026-06-06', 'Mua thêm đồ cho bữa cuối tuần và chuẩn bị thực đơn tuần mới'),
((SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), (SELECT id FROM families WHERE name = 'Gia đình An An'), '2026-06-01', '2026-06-02', 'Danh sách đồ ăn sáng và trái cây cho các bé'),
((SELECT id FROM users WHERE email = 'huong.tran@example.com'), (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), '2026-06-04', '2026-06-07', 'Đi siêu thị gần nhà sau giờ làm'),
((SELECT id FROM users WHERE email = 'khoa.tran@example.com'), (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), '2026-05-30', '2026-05-31', 'Mua gia vị và đồ khô bổ sung'),
((SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), (SELECT id FROM families WHERE name = 'Gia đình An An'), '2026-06-05', '2026-06-05', 'Đồ đã mua ở chợ sáng, chờ nhập vào tủ lạnh'),
((SELECT id FROM users WHERE email = 'huong.tran@example.com'), (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), '2026-06-05', '2026-06-06', 'Đồ đã mua cuối tuần, chờ đưa vào tủ lạnh');

INSERT INTO shopping_list_items (shopping_list_id, food_id, custom_name, order_number, quantity, unit, note, assigned_to, is_purchased, imported_to_fridge_at) VALUES
((SELECT id FROM shopping_lists WHERE note = 'Mua thêm đồ cho bữa cuối tuần và chuẩn bị thực đơn tuần mới'), (SELECT id FROM foods WHERE name = 'Cá thu'), NULL, 1, 0.8, 'kg', 'Chọn cá tươi, cắt khoanh vừa kho', (SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Mua thêm đồ cho bữa cuối tuần và chuẩn bị thực đơn tuần mới'), (SELECT id FROM foods WHERE name = 'Rau củ khác'), 'Rau mồng tơi', 2, 2, 'bó', 'Tự nhập vì chưa có trong danh mục mặc định', (SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Mua thêm đồ cho bữa cuối tuần và chuẩn bị thực đơn tuần mới'), (SELECT id FROM foods WHERE name = 'Dứa'), NULL, 3, 1, 'quả', 'Dùng nấu canh chua cá', (SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Mua thêm đồ cho bữa cuối tuần và chuẩn bị thực đơn tuần mới'), (SELECT id FROM foods WHERE name = 'Sữa chua'), NULL, 4, 6, 'hộp', 'Chọn loại ít đường', (SELECT id FROM users WHERE email = 'anh.nguyen@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Mua thêm đồ cho bữa cuối tuần và chuẩn bị thực đơn tuần mới'), (SELECT id FROM foods WHERE name = 'Đồ uống khác'), 'Nước sấu ngâm', 5, 1, 'chai', 'Mua chai nhỏ cho bữa cơm gia đình', (SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), FALSE, NULL),

((SELECT id FROM shopping_lists WHERE note = 'Danh sách đồ ăn sáng và trái cây cho các bé'), (SELECT id FROM foods WHERE name = 'Bánh phở khô'), NULL, 1, 500, 'g', 'Mua loại sợi nhỏ', (SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), TRUE, '2026-06-02 18:15:00'),
((SELECT id FROM shopping_lists WHERE note = 'Danh sách đồ ăn sáng và trái cây cho các bé'), (SELECT id FROM foods WHERE name = 'Cam sành'), NULL, 2, 2, 'kg', 'Cam ngọt để vắt nước', (SELECT id FROM users WHERE email = 'anh.nguyen@example.com'), TRUE, '2026-06-02 18:20:00'),
((SELECT id FROM shopping_lists WHERE note = 'Danh sách đồ ăn sáng và trái cây cho các bé'), (SELECT id FROM foods WHERE name = 'Trứng gà'), NULL, 3, 10, 'quả', 'Chọn trứng mới', (SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), TRUE, '2026-06-02 18:22:00'),

((SELECT id FROM shopping_lists WHERE note = 'Đi siêu thị gần nhà sau giờ làm'), (SELECT id FROM foods WHERE name = 'Nghêu'), NULL, 1, 1, 'kg', 'Nấu canh nghêu với rau', (SELECT id FROM users WHERE email = 'khoa.tran@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đi siêu thị gần nhà sau giờ làm'), (SELECT id FROM foods WHERE name = 'Thịt nạc vai heo'), NULL, 2, 1.2, 'kg', 'Xay một phần để nấu canh bí', (SELECT id FROM users WHERE email = 'huong.tran@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đi siêu thị gần nhà sau giờ làm'), (SELECT id FROM foods WHERE name = 'Trái cây khác'), 'Ổi lê', 3, 1.5, 'kg', 'Trái cây tráng miệng', (SELECT id FROM users WHERE email = 'mai.tran@example.com'), FALSE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đi siêu thị gần nhà sau giờ làm'), (SELECT id FROM foods WHERE name = 'Nước cam ép'), NULL, 4, 1, 'lít', 'Loại không thêm đường', (SELECT id FROM users WHERE email = 'khoa.tran@example.com'), FALSE, NULL),

((SELECT id FROM shopping_lists WHERE note = 'Mua gia vị và đồ khô bổ sung'), (SELECT id FROM foods WHERE name = 'Nước mắm'), NULL, 1, 1, 'chai', 'Nước mắm truyền thống độ đạm vừa', (SELECT id FROM users WHERE email = 'khoa.tran@example.com'), TRUE, '2026-05-31 10:30:00'),
((SELECT id FROM shopping_lists WHERE note = 'Mua gia vị và đồ khô bổ sung'), (SELECT id FROM foods WHERE name = 'Tiêu xay'), NULL, 2, 100, 'g', 'Tiêu đen xay mới', (SELECT id FROM users WHERE email = 'khoa.tran@example.com'), TRUE, '2026-05-31 10:32:00'),
((SELECT id FROM shopping_lists WHERE note = 'Mua gia vị và đồ khô bổ sung'), (SELECT id FROM foods WHERE name = 'Đậu xanh'), NULL, 3, 1, 'kg', 'Nấu xôi và chè', (SELECT id FROM users WHERE email = 'huong.tran@example.com'), TRUE, '2026-05-31 10:40:00'),

((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua ở chợ sáng, chờ nhập vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Cải thìa'), NULL, 1, 1.5, 'kg', 'Đã mua, cần nhập vào ngăn rau', (SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), TRUE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua ở chợ sáng, chờ nhập vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Tôm sú'), NULL, 2, 0.8, 'kg', 'Đã mua, chia hộp cấp đông', (SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), TRUE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua ở chợ sáng, chờ nhập vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Sữa tươi không đường'), NULL, 3, 2, 'lít', 'Đã mua, để cánh cửa tủ lạnh', (SELECT id FROM users WHERE email = 'anh.nguyen@example.com'), TRUE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua ở chợ sáng, chờ nhập vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Rau củ khác'), 'Rau ngót', 4, 2, 'bó', 'Người dùng tự nhập tên khi thêm vào tủ lạnh', (SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), TRUE, NULL),

((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua cuối tuần, chờ đưa vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Cá thu'), NULL, 1, 1, 'kg', 'Đã mua, cắt khoanh để cấp đông', (SELECT id FROM users WHERE email = 'khoa.tran@example.com'), TRUE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua cuối tuần, chờ đưa vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Cà chua'), NULL, 2, 1, 'kg', 'Đã mua, dùng nấu canh và sốt', (SELECT id FROM users WHERE email = 'huong.tran@example.com'), TRUE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua cuối tuần, chờ đưa vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Trứng gà'), NULL, 3, 12, 'quả', 'Đã mua, kiểm tra hạn khi nhập kho', (SELECT id FROM users WHERE email = 'mai.tran@example.com'), TRUE, NULL),
((SELECT id FROM shopping_lists WHERE note = 'Đồ đã mua cuối tuần, chờ đưa vào tủ lạnh'), (SELECT id FROM foods WHERE name = 'Trái cây khác'), 'Ổi nữ hoàng', 4, 1.2, 'kg', 'Người dùng tự nhập tên khi thêm vào tủ lạnh', (SELECT id FROM users WHERE email = 'huong.tran@example.com'), TRUE, NULL);

-- ==========================================
-- 7. CÔNG THỨC NẤU ĂN
-- ==========================================

INSERT INTO recipes (name, description, instructions, cooking_time_minutes, servings, calories, difficulty, reference_link, author, preferred_meal_time, image_url) VALUES
('Phở bò gia đình', 'Bát phở bò thơm mùi gừng, nước dùng ngọt nhẹ, hợp cho bữa sáng cuối tuần.', 'Nướng thơm gừng, ninh xương hoặc dùng nước dùng sẵn. Chần bánh phở, xếp thịt bò thái mỏng, chan nước dùng nóng và ăn kèm rau thơm tùy khẩu vị.', 75, 4, 520, 'HARD', 'https://www.youtube.com/results?search_query=ph%E1%BB%9F+b%C3%B2+gia+%C4%91%C3%ACnh', 'Bếp nhà MealMate', 'BREAKFAST', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pho-Beef-Noodles-2008.jpg'),
('Bún chả Hà Nội', 'Thịt heo nướng thơm, nước chấm chua ngọt và bún mềm, phù hợp bữa trưa gia đình.', 'Ướp thịt với nước mắm, đường, tiêu và tỏi. Nướng hoặc áp chảo đến khi xém cạnh. Pha nước chấm chua ngọt, ăn cùng bún và rau sống.', 60, 4, 650, 'MEDIUM', 'https://www.youtube.com/results?search_query=b%C3%BAn+ch%E1%BA%A3+H%C3%A0+N%E1%BB%99i', 'Bếp nhà MealMate', 'LUNCH', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bun_cha.jpg'),
('Cơm tấm sườn trứng', 'Món cơm quen thuộc kiểu miền Nam với sườn non rim đậm đà và trứng chiên.', 'Ướp sườn với nước mắm, đường, tiêu. Rim hoặc nướng đến khi vàng. Nấu cơm, chiên trứng, dọn cùng dưa leo và nước mắm pha.', 55, 4, 720, 'MEDIUM', 'https://www.youtube.com/results?search_query=c%C6%A1m+t%E1%BA%A5m+s%C6%B0%E1%BB%9Dn+tr%E1%BB%A9ng', 'Bếp nhà MealMate', 'LUNCH', 'https://commons.wikimedia.org/wiki/Special:FilePath/Com-Tam-2008.jpg'),
('Canh chua cá basa', 'Canh chua vị thanh, có cá basa, cà chua và dứa, hợp bữa cơm ngày nóng.', 'Nấu nước sôi, cho dứa và cà chua vào trước. Thêm cá basa, nêm nước mắm, đường và muối. Đun vừa lửa để cá chín mà không nát.', 35, 4, 310, 'EASY', 'https://www.youtube.com/results?search_query=canh+chua+c%C3%A1+basa', 'Bếp nhà MealMate', 'DINNER', 'https://commons.wikimedia.org/wiki/Special:FilePath/Canhchua1.jpg'),
('Cá thu kho tiêu', 'Cá thu kho săn, thơm tiêu và nước mắm, ăn rất hợp với cơm trắng.', 'Ướp cá với nước mắm, tiêu, đường và ít dầu ăn. Kho lửa nhỏ đến khi nước sệt lại, trở cá nhẹ tay để không vỡ.', 45, 4, 430, 'MEDIUM', 'https://www.youtube.com/results?search_query=c%C3%A1+thu+kho+ti%C3%AAu', 'Bếp nhà MealMate', 'DINNER', 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%A1_kho_t%E1%BB%99.JPG'),
('Thịt kho trứng', 'Món kho truyền thống vị mặn ngọt hài hòa, phù hợp bữa cơm gia đình Việt.', 'Luộc trứng, bóc vỏ. Ướp thịt ba chỉ với nước mắm, đường, tiêu. Kho thịt đến mềm rồi cho trứng vào thấm vị.', 70, 5, 680, 'MEDIUM', 'https://www.youtube.com/results?search_query=th%E1%BB%8Bt+kho+tr%E1%BB%A9ng', 'Bếp nhà MealMate', 'DINNER', 'https://commons.wikimedia.org/wiki/Special:FilePath/Th%E1%BB%8Bt_kho_h%E1%BB%99t_v%E1%BB%8Bt.jpg'),
('Gà rang gừng', 'Đùi gà rang săn với gừng thơm, món mặn dễ ăn trong ngày mưa.', 'Chặt gà miếng vừa, ướp nước mắm, gừng và tiêu. Rang gà trên lửa vừa đến khi thịt săn, thêm ít nước rồi rim cạn.', 40, 4, 510, 'EASY', 'https://www.youtube.com/results?search_query=g%C3%A0+rang+g%E1%BB%ABng', 'Bếp nhà MealMate', 'DINNER', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-ga-rang-gung-mon-chinh-850554516745.jpg'),
('Rau muống xào tỏi', 'Đĩa rau xanh giòn, thơm tỏi, làm nhanh cho bữa cơm hằng ngày.', 'Chần nhanh rau muống trong nước sôi, vớt ra để ráo. Phi thơm tỏi, xào rau lửa lớn, nêm muối và hạt nêm.', 15, 4, 160, 'EASY', 'https://www.youtube.com/results?search_query=rau+mu%E1%BB%91ng+x%C3%A0o+t%E1%BB%8Fi', 'Bếp nhà MealMate', 'DINNER', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rau_mu%E1%BB%91ng_x%C3%A0o_t%E1%BB%8Fi%2C_th%C3%A1ng_4_n%C4%83m_2018.jpg'),
('Bò lúc lắc', 'Thịt bò mềm, xào nhanh với cà chua và gia vị đậm đà, hợp bữa tối đổi vị.', 'Cắt bò vuông, ướp tiêu, nước mắm và dầu ăn. Áp chảo lửa lớn, đảo nhanh cùng cà chua, nêm vừa ăn.', 30, 4, 560, 'MEDIUM', 'https://www.youtube.com/results?search_query=b%C3%B2+l%C3%BAc+l%E1%BA%AFc', 'Bếp nhà MealMate', 'DINNER', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bo_luc_lac.jpg'),
('Cháo gà xé', 'Cháo mềm, thịt gà xé nhỏ, dễ ăn cho cả người lớn và trẻ nhỏ.', 'Nấu gạo với nhiều nước đến nhừ. Luộc ức gà, xé nhỏ, cho vào cháo. Nêm muối, hạt nêm và tiêu tùy khẩu vị.', 50, 4, 390, 'EASY', 'https://www.youtube.com/results?search_query=ch%C3%A1o+g%C3%A0+x%C3%A9', 'Bếp nhà MealMate', 'BREAKFAST', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ch%C3%A1o_g%C3%A0_x%C3%A9_phay_%E1%BB%9F_P3_%C4%90%C3%B4ng_H%C3%A0_n%C4%83m_2018.jpg'),
('Canh bí đỏ thịt bằm', 'Canh bí đỏ ngọt mềm, có thịt heo bằm, phù hợp bữa tối nhẹ nhàng.', 'Bằm thịt nạc vai, ướp hạt nêm. Nấu bí đỏ đến mềm rồi cho thịt vào, nêm nước mắm và tiêu.', 30, 4, 280, 'EASY', 'https://www.youtube.com/results?search_query=canh+b%C3%AD+%C4%91%E1%BB%8F+th%E1%BB%8Bt+b%E1%BA%B1m', 'Bếp nhà MealMate', 'DINNER', 'https://i0.wp.com/www.wokandkin.com/wp-content/uploads/2020/11/Pumpkin-Soup-2.png?ssl=1'),
('Mực xào cà chua', 'Mực giòn ngọt xào cùng cà chua, món nhanh cho bữa cơm ngày bận.', 'Làm sạch mực, cắt khoanh. Xào tỏi thơm, cho mực vào đảo nhanh, thêm cà chua và nêm vừa ăn.', 25, 4, 330, 'EASY', 'https://www.youtube.com/results?search_query=m%E1%BB%B1c+x%C3%A0o+c%C3%A0+chua', 'Bếp nhà MealMate', 'DINNER', 'https://commons.wikimedia.org/wiki/Special:FilePath/M%C3%B3n_m%E1%BB%B1c_x%C3%A0o%2C_th%C3%A1ng_4_n%C4%83m_2018_%282%29.jpg'),
('Tôm rang thịt ba chỉ', 'Tôm và thịt ba chỉ rang mặn ngọt, rất đưa cơm.', 'Rang thịt ba chỉ ra bớt mỡ, cho tôm vào đảo săn. Nêm nước mắm, đường, tiêu rồi rim đến khi áo màu đẹp.', 35, 4, 590, 'MEDIUM', 'https://www.youtube.com/results?search_query=t%C3%B4m+rang+th%E1%BB%8Bt+ba+ch%E1%BB%89', 'Bếp nhà MealMate', 'DINNER', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-tom-djong-rang-thit-ba-chi-mon-chinh-229448800789.jpg'),
('Miến gà nấm rơm', 'Miến nước trong, gà mềm và nấm rơm ngọt, hợp bữa sáng hoặc bữa nhẹ.', 'Luộc gà lấy nước dùng. Cho miến đã ngâm mềm, nấm rơm và thịt gà xé vào nồi, nêm nước mắm và tiêu.', 45, 4, 430, 'EASY', 'https://www.youtube.com/results?search_query=mi%E1%BA%BFn+g%C3%A0+n%E1%BA%A5m+r%C6%A1m', 'Bếp nhà MealMate', 'BREAKFAST', 'https://commons.wikimedia.org/wiki/Special:FilePath/Mi%E1%BA%BFn_g%C3%A0.jpg'),
('Sườn non kho tiêu', 'Sườn non mềm, nước kho sánh và thơm tiêu xay.', 'Ướp sườn với nước mắm, tiêu và đường. Kho nhỏ lửa đến khi sườn mềm, nước kho bám đều miếng sườn.', 55, 4, 620, 'MEDIUM', 'https://www.youtube.com/results?search_query=s%C6%B0%E1%BB%9Dn+non+kho+ti%C3%AAu', 'Bếp nhà MealMate', 'DINNER', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-suon-heo-non-kho-tieu-mon-chinh-150790441965.jpg'),
('Salad trái cây sữa chua', 'Món tráng miệng mát nhẹ với trái cây Việt Nam và sữa chua.', 'Cắt xoài, thanh long, dưa hấu thành miếng vừa ăn. Trộn nhẹ với sữa chua lạnh và dùng ngay.', 15, 3, 240, 'EASY', 'https://www.youtube.com/results?search_query=salad+tr%C3%A1i+c%C3%A2y+s%E1%BB%AFa+chua', 'Bếp nhà MealMate', 'BREAKFAST', 'https://commons.wikimedia.org/wiki/Special:FilePath/Summer_fruit_salad.jpg'),
('Xôi đậu xanh', 'Xôi dẻo thơm, đậu xanh bùi, phù hợp bữa sáng no lâu.', 'Ngâm gạo và đậu xanh riêng. Hấp đậu và gạo đến chín mềm, trộn ít muối, dùng nóng.', 65, 4, 480, 'MEDIUM', 'https://www.youtube.com/results?search_query=x%C3%B4i+%C4%91%E1%BA%ADu+xanh', 'Bếp nhà MealMate', 'BREAKFAST', 'https://commons.wikimedia.org/wiki/Special:FilePath/X%C3%B4i_%C4%91%E1%BB%97_xanh.jpg'),
('Sinh tố xoài sữa chua', 'Ly sinh tố mát, vị xoài chín và sữa chua dịu nhẹ.', 'Xoài gọt vỏ, cắt miếng. Xay cùng sữa chua, sữa tươi và ít đường nếu thích ngọt hơn.', 10, 2, 260, 'EASY', 'https://www.youtube.com/results?search_query=sinh+t%E1%BB%91+xo%C3%A0i+s%E1%BB%AFa+chua', 'Bếp nhà MealMate', 'BREAKFAST', 'https://commons.wikimedia.org/wiki/Special:FilePath/AE_li%C3%AAn_hoan%2C_Sinh_t%E1%BB%91_xo%C3%A0i_%E1%BB%9F_B%C3%ACnh_T%C3%A2n%2C_ng8th2n2020_%281%29.jpg');

INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit) VALUES
((SELECT id FROM recipes WHERE name = 'Phở bò gia đình'), (SELECT id FROM foods WHERE name = 'Bánh phở khô'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Phở bò gia đình'), (SELECT id FROM foods WHERE name = 'Thịt bò thăn'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Phở bò gia đình'), (SELECT id FROM foods WHERE name = 'Gừng'), 30, 'g'),
((SELECT id FROM recipes WHERE name = 'Phở bò gia đình'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 30, 'ml'),
((SELECT id FROM recipes WHERE name = 'Phở bò gia đình'), (SELECT id FROM foods WHERE name = 'Muối'), 8, 'g'),

((SELECT id FROM recipes WHERE name = 'Bún chả Hà Nội'), (SELECT id FROM foods WHERE name = 'Bún khô'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Bún chả Hà Nội'), (SELECT id FROM foods WHERE name = 'Thịt nạc vai heo'), 700, 'g'),
((SELECT id FROM recipes WHERE name = 'Bún chả Hà Nội'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 60, 'ml'),
((SELECT id FROM recipes WHERE name = 'Bún chả Hà Nội'), (SELECT id FROM foods WHERE name = 'Đường'), 40, 'g'),
((SELECT id FROM recipes WHERE name = 'Bún chả Hà Nội'), (SELECT id FROM foods WHERE name = 'Tỏi'), 20, 'g'),

((SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng'), (SELECT id FROM foods WHERE name = 'Gạo tẻ'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng'), (SELECT id FROM foods WHERE name = 'Sườn non heo'), 800, 'g'),
((SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng'), (SELECT id FROM foods WHERE name = 'Trứng gà'), 4, 'quả'),
((SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 50, 'ml'),
((SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng'), (SELECT id FROM foods WHERE name = 'Đường'), 30, 'g'),

((SELECT id FROM recipes WHERE name = 'Canh chua cá basa'), (SELECT id FROM foods WHERE name = 'Cá basa'), 600, 'g'),
((SELECT id FROM recipes WHERE name = 'Canh chua cá basa'), (SELECT id FROM foods WHERE name = 'Cà chua'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Canh chua cá basa'), (SELECT id FROM foods WHERE name = 'Dứa'), 0.5, 'quả'),
((SELECT id FROM recipes WHERE name = 'Canh chua cá basa'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 30, 'ml'),
((SELECT id FROM recipes WHERE name = 'Canh chua cá basa'), (SELECT id FROM foods WHERE name = 'Đường'), 15, 'g'),

((SELECT id FROM recipes WHERE name = 'Cá thu kho tiêu'), (SELECT id FROM foods WHERE name = 'Cá thu'), 800, 'g'),
((SELECT id FROM recipes WHERE name = 'Cá thu kho tiêu'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 50, 'ml'),
((SELECT id FROM recipes WHERE name = 'Cá thu kho tiêu'), (SELECT id FROM foods WHERE name = 'Tiêu xay'), 8, 'g'),
((SELECT id FROM recipes WHERE name = 'Cá thu kho tiêu'), (SELECT id FROM foods WHERE name = 'Đường'), 20, 'g'),

((SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), (SELECT id FROM foods WHERE name = 'Thịt ba chỉ heo'), 900, 'g'),
((SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), (SELECT id FROM foods WHERE name = 'Trứng vịt'), 6, 'quả'),
((SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 70, 'ml'),
((SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), (SELECT id FROM foods WHERE name = 'Đường'), 40, 'g'),
((SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), (SELECT id FROM foods WHERE name = 'Tiêu xay'), 5, 'g'),

((SELECT id FROM recipes WHERE name = 'Gà rang gừng'), (SELECT id FROM foods WHERE name = 'Đùi gà'), 900, 'g'),
((SELECT id FROM recipes WHERE name = 'Gà rang gừng'), (SELECT id FROM foods WHERE name = 'Gừng'), 60, 'g'),
((SELECT id FROM recipes WHERE name = 'Gà rang gừng'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 45, 'ml'),
((SELECT id FROM recipes WHERE name = 'Gà rang gừng'), (SELECT id FROM foods WHERE name = 'Dầu ăn'), 20, 'ml'),

((SELECT id FROM recipes WHERE name = 'Rau muống xào tỏi'), (SELECT id FROM foods WHERE name = 'Rau muống'), 2, 'bó'),
((SELECT id FROM recipes WHERE name = 'Rau muống xào tỏi'), (SELECT id FROM foods WHERE name = 'Tỏi'), 30, 'g'),
((SELECT id FROM recipes WHERE name = 'Rau muống xào tỏi'), (SELECT id FROM foods WHERE name = 'Dầu ăn'), 25, 'ml'),
((SELECT id FROM recipes WHERE name = 'Rau muống xào tỏi'), (SELECT id FROM foods WHERE name = 'Hạt nêm'), 8, 'g'),

((SELECT id FROM recipes WHERE name = 'Bò lúc lắc'), (SELECT id FROM foods WHERE name = 'Thịt bò thăn'), 700, 'g'),
((SELECT id FROM recipes WHERE name = 'Bò lúc lắc'), (SELECT id FROM foods WHERE name = 'Cà chua'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Bò lúc lắc'), (SELECT id FROM foods WHERE name = 'Tỏi'), 20, 'g'),
((SELECT id FROM recipes WHERE name = 'Bò lúc lắc'), (SELECT id FROM foods WHERE name = 'Tiêu xay'), 8, 'g'),
((SELECT id FROM recipes WHERE name = 'Bò lúc lắc'), (SELECT id FROM foods WHERE name = 'Dầu ăn'), 30, 'ml'),

((SELECT id FROM recipes WHERE name = 'Cháo gà xé'), (SELECT id FROM foods WHERE name = 'Gạo tẻ'), 250, 'g'),
((SELECT id FROM recipes WHERE name = 'Cháo gà xé'), (SELECT id FROM foods WHERE name = 'Ức gà'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Cháo gà xé'), (SELECT id FROM foods WHERE name = 'Hạt nêm'), 10, 'g'),
((SELECT id FROM recipes WHERE name = 'Cháo gà xé'), (SELECT id FROM foods WHERE name = 'Tiêu xay'), 3, 'g'),

((SELECT id FROM recipes WHERE name = 'Canh bí đỏ thịt bằm'), (SELECT id FROM foods WHERE name = 'Bí đỏ'), 600, 'g'),
((SELECT id FROM recipes WHERE name = 'Canh bí đỏ thịt bằm'), (SELECT id FROM foods WHERE name = 'Thịt nạc vai heo'), 250, 'g'),
((SELECT id FROM recipes WHERE name = 'Canh bí đỏ thịt bằm'), (SELECT id FROM foods WHERE name = 'Hạt nêm'), 10, 'g'),
((SELECT id FROM recipes WHERE name = 'Canh bí đỏ thịt bằm'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 15, 'ml'),

((SELECT id FROM recipes WHERE name = 'Mực xào cà chua'), (SELECT id FROM foods WHERE name = 'Mực ống'), 600, 'g'),
((SELECT id FROM recipes WHERE name = 'Mực xào cà chua'), (SELECT id FROM foods WHERE name = 'Cà chua'), 350, 'g'),
((SELECT id FROM recipes WHERE name = 'Mực xào cà chua'), (SELECT id FROM foods WHERE name = 'Tỏi'), 20, 'g'),
((SELECT id FROM recipes WHERE name = 'Mực xào cà chua'), (SELECT id FROM foods WHERE name = 'Dầu ăn'), 25, 'ml'),

((SELECT id FROM recipes WHERE name = 'Tôm rang thịt ba chỉ'), (SELECT id FROM foods WHERE name = 'Tôm sú'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Tôm rang thịt ba chỉ'), (SELECT id FROM foods WHERE name = 'Thịt ba chỉ heo'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Tôm rang thịt ba chỉ'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 45, 'ml'),
((SELECT id FROM recipes WHERE name = 'Tôm rang thịt ba chỉ'), (SELECT id FROM foods WHERE name = 'Đường'), 25, 'g'),

((SELECT id FROM recipes WHERE name = 'Miến gà nấm rơm'), (SELECT id FROM foods WHERE name = 'Miến dong'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Miến gà nấm rơm'), (SELECT id FROM foods WHERE name = 'Ức gà'), 500, 'g'),
((SELECT id FROM recipes WHERE name = 'Miến gà nấm rơm'), (SELECT id FROM foods WHERE name = 'Nấm rơm'), 250, 'g'),
((SELECT id FROM recipes WHERE name = 'Miến gà nấm rơm'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 25, 'ml'),

((SELECT id FROM recipes WHERE name = 'Sườn non kho tiêu'), (SELECT id FROM foods WHERE name = 'Sườn non heo'), 900, 'g'),
((SELECT id FROM recipes WHERE name = 'Sườn non kho tiêu'), (SELECT id FROM foods WHERE name = 'Nước mắm'), 60, 'ml'),
((SELECT id FROM recipes WHERE name = 'Sườn non kho tiêu'), (SELECT id FROM foods WHERE name = 'Tiêu xay'), 10, 'g'),
((SELECT id FROM recipes WHERE name = 'Sườn non kho tiêu'), (SELECT id FROM foods WHERE name = 'Đường'), 25, 'g'),

((SELECT id FROM recipes WHERE name = 'Salad trái cây sữa chua'), (SELECT id FROM foods WHERE name = 'Xoài'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Salad trái cây sữa chua'), (SELECT id FROM foods WHERE name = 'Thanh long'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Salad trái cây sữa chua'), (SELECT id FROM foods WHERE name = 'Dưa hấu'), 300, 'g'),
((SELECT id FROM recipes WHERE name = 'Salad trái cây sữa chua'), (SELECT id FROM foods WHERE name = 'Sữa chua'), 3, 'hộp'),

((SELECT id FROM recipes WHERE name = 'Xôi đậu xanh'), (SELECT id FROM foods WHERE name = 'Gạo tẻ'), 600, 'g'),
((SELECT id FROM recipes WHERE name = 'Xôi đậu xanh'), (SELECT id FROM foods WHERE name = 'Đậu xanh'), 250, 'g'),
((SELECT id FROM recipes WHERE name = 'Xôi đậu xanh'), (SELECT id FROM foods WHERE name = 'Muối'), 5, 'g'),

((SELECT id FROM recipes WHERE name = 'Sinh tố xoài sữa chua'), (SELECT id FROM foods WHERE name = 'Xoài'), 400, 'g'),
((SELECT id FROM recipes WHERE name = 'Sinh tố xoài sữa chua'), (SELECT id FROM foods WHERE name = 'Sữa chua'), 2, 'hộp'),
((SELECT id FROM recipes WHERE name = 'Sinh tố xoài sữa chua'), (SELECT id FROM foods WHERE name = 'Sữa tươi không đường'), 250, 'ml'),
((SELECT id FROM recipes WHERE name = 'Sinh tố xoài sữa chua'), (SELECT id FROM foods WHERE name = 'Đường'), 15, 'g');

INSERT INTO user_favorite_recipes (user_id, recipe_id) VALUES
((SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), (SELECT id FROM recipes WHERE name = 'Thịt kho trứng')),
((SELECT id FROM users WHERE email = 'lan.nguyen@example.com'), (SELECT id FROM recipes WHERE name = 'Canh chua cá basa')),
((SELECT id FROM users WHERE email = 'minh.nguyen@example.com'), (SELECT id FROM recipes WHERE name = 'Phở bò gia đình')),
((SELECT id FROM users WHERE email = 'anh.nguyen@example.com'), (SELECT id FROM recipes WHERE name = 'Salad trái cây sữa chua')),
((SELECT id FROM users WHERE email = 'binh.nguyen@example.com'), (SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng')),
((SELECT id FROM users WHERE email = 'huong.tran@example.com'), (SELECT id FROM recipes WHERE name = 'Gà rang gừng')),
((SELECT id FROM users WHERE email = 'huong.tran@example.com'), (SELECT id FROM recipes WHERE name = 'Miến gà nấm rơm')),
((SELECT id FROM users WHERE email = 'khoa.tran@example.com'), (SELECT id FROM recipes WHERE name = 'Bò lúc lắc')),
((SELECT id FROM users WHERE email = 'mai.tran@example.com'), (SELECT id FROM recipes WHERE name = 'Sinh tố xoài sữa chua'));

-- ==========================================
-- 8. THỰC ĐƠN VÀ BỮA ĂN
-- ==========================================

INSERT INTO menus (family_id, start_date, end_date) VALUES
((SELECT id FROM families WHERE name = 'Gia đình An An'), '2026-06-08', '2026-06-14'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), '2026-06-08', '2026-06-14');

INSERT INTO meals (menu_id, meal_date, meal_type) VALUES
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-08', 'BREAKFAST'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-08', 'LUNCH'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-08', 'DINNER'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-09', 'BREAKFAST'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-09', 'LUNCH'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-09', 'DINNER'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-10', 'BREAKFAST'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-10', 'LUNCH'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08'), '2026-06-10', 'DINNER'),

((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-08', 'BREAKFAST'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-08', 'LUNCH'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-08', 'DINNER'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-09', 'BREAKFAST'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-09', 'LUNCH'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-09', 'DINNER'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-10', 'BREAKFAST'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-10', 'LUNCH'),
((SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08'), '2026-06-10', 'DINNER');

INSERT INTO meal_items (meal_id, recipe_id, status) VALUES
((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'BREAKFAST' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Cháo gà xé'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'LUNCH' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Cơm tấm sườn trứng'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Canh chua cá basa'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Rau muống xào tỏi'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-09' AND meal_type = 'BREAKFAST' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Phở bò gia đình'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-09' AND meal_type = 'LUNCH' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Tôm rang thịt ba chỉ'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-09' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-10' AND meal_type = 'BREAKFAST' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Sinh tố xoài sữa chua'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-10' AND meal_type = 'LUNCH' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Bún chả Hà Nội'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-10' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình An An') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Bò lúc lắc'), 'SUGGESTED'),

((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'BREAKFAST' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Xôi đậu xanh'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'LUNCH' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Sườn non kho tiêu'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-08' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Gà rang gừng'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-09' AND meal_type = 'BREAKFAST' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Miến gà nấm rơm'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-09' AND meal_type = 'LUNCH' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Mực xào cà chua'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-09' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Canh bí đỏ thịt bằm'), 'CONFIRMED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-10' AND meal_type = 'BREAKFAST' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Salad trái cây sữa chua'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-10' AND meal_type = 'LUNCH' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Cá thu kho tiêu'), 'SUGGESTED'),
((SELECT id FROM meals WHERE meal_date = '2026-06-10' AND meal_type = 'DINNER' AND menu_id = (SELECT id FROM menus WHERE family_id = (SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy') AND start_date = '2026-06-08')), (SELECT id FROM recipes WHERE name = 'Thịt kho trứng'), 'CONFIRMED');

-- ==========================================
-- 9. LỜI MỜI GIA ĐÌNH
-- ==========================================

INSERT INTO invitations (family_id, receiver_id, status) VALUES
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM users WHERE email = 'anh.nguyen@example.com'), 'ACCEPTED'),
((SELECT id FROM families WHERE name = 'Gia đình An An'), (SELECT id FROM users WHERE email = 'binh.nguyen@example.com'), 'ACCEPTED'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM users WHERE email = 'mai.tran@example.com'), 'ACCEPTED'),
((SELECT id FROM families WHERE name = 'Gia đình Trần Sum Vầy'), (SELECT id FROM users WHERE email = 'quantri@mealmate.vn'), 'PENDING');

COMMIT;
