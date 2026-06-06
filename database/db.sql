-- ==========================================
-- CƠ SỞ DỮ LIỆU MEALMATE (PostgreSQL)
-- Tên bảng và cột bằng tiếng Anh
-- Phân quyền RBAC: roles, permissions
-- ==========================================

-- ==========================================
-- 1. PHÂN QUYỀN (RBAC)
-- ==========================================

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- Tên quyền, ví dụ: "Xem danh sách thực phẩm"
    api_path VARCHAR(255) NOT NULL,          -- Đường dẫn API, ví dụ: /api/foods
    method VARCHAR(10) NOT NULL,             -- Phương thức HTTP: GET, POST, PUT, DELETE, PATCH
    module VARCHAR(100) NOT NULL,            -- Module: AUTH, USER, FOOD, FRIDGE, RECIPE, SHOPPING, MEAL
    created_by_id BIGINT,
    created_by_email VARCHAR(255),
    updated_by_id BIGINT,
    updated_by_email VARCHAR(255),
    deleted_by_id BIGINT,
    deleted_by_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,       -- Tên vai trò: ADMIN, CUSTOMER
    description VARCHAR(500),                -- Mô tả vai trò
    is_active BOOLEAN DEFAULT TRUE,          -- Trạng thái hoạt động
    created_by_id BIGINT,
    created_by_email VARCHAR(255),
    updated_by_id BIGINT,
    updated_by_email VARCHAR(255),
    deleted_by_id BIGINT,
    deleted_by_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng trung gian liên kết vai trò với quyền (N-N)
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. NGƯỜI DÙNG & GIA ĐÌNH
-- ==========================================

-- Tạo bảng users trước (family_id sẽ thêm FK sau để tránh lỗi vòng lặp)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    family_id INT,                           -- Mã gia đình (FK thêm sau)
    role_id INT,                             -- Vai trò người dùng
    email VARCHAR(255) UNIQUE,               -- Email đăng nhập (duy nhất)
    password_hash VARCHAR(255) NOT NULL,     -- Mật khẩu đã mã hóa BCrypt
    full_name VARCHAR(255) NOT NULL,         -- Họ và tên
    phone VARCHAR(20),                       -- Số điện thoại
    gender VARCHAR(10),                      -- Giới tính: MALE, FEMALE, OTHER
    avatar_url VARCHAR(500),                 -- Đường dẫn ảnh đại diện
    email_verified BOOLEAN DEFAULT FALSE,    -- Đã xác thực email chưa
    verification_token VARCHAR(255),         -- Token xác thực email
    verification_token_expiry TIMESTAMP,     -- Thời hạn token xác thực
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- Bảng gia đình
CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- Tên gia đình
    housekeeper_id INT,                      -- Người nội trợ (quản lý gia đình)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_family_housekeeper FOREIGN KEY (housekeeper_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Thêm FK từ users → families (thêm sau để tránh phụ thuộc vòng)
ALTER TABLE users
ADD CONSTRAINT fk_user_family
FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL;

-- ==========================================
-- 3. DANH MỤC THỰC PHẨM
-- ==========================================

-- Bảng chủng loại thực phẩm
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- Tên chủng loại: Rau củ, Thịt, Hải sản, Trái Cây, Trứng & Sữa, Đồ khô, Khác
    icon_key VARCHAR(100),                   -- Mã icon mặc định của chủng loại; thực phẩm dùng icon của chủng loại
    color_code VARCHAR(20),                  -- Mã màu hiển thị mặc định của chủng loại, ví dụ: #E8F5E9
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng thực phẩm
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    category_id INT,                         -- Thuộc chủng loại nào
    name VARCHAR(255) NOT NULL,              -- Tên thực phẩm
    unit VARCHAR(50),                        -- Đơn vị đo: kg, g, lít, quả...
    synonyms VARCHAR(500),                   -- Từ đồng nghĩa (phân cách bằng dấu phẩy, dùng để tối ưu tìm kiếm)
    image_url VARCHAR(500),                  -- Đường dẫn ảnh minh họa
    is_system BOOLEAN DEFAULT TRUE,          -- TRUE nếu là thực phẩm mặc định của hệ thống, FALSE nếu là thực phẩm người dùng tự tạo
    created_by INT,                          -- Người dùng tạo thực phẩm này, dùng cho thực phẩm tự tạo
    family_id INT,                           -- Gia đình sở hữu thực phẩm tự tạo; NULL nếu là thực phẩm hệ thống
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_food_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_food_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Bảng biện pháp bảo quản thực phẩm
CREATE TABLE preservation_methods (
    id SERIAL PRIMARY KEY,
    food_id INT NOT NULL,                    -- Thực phẩm cần bảo quản
    content TEXT NOT NULL,                   -- Nội dung hướng dẫn bảo quản
    reference_source VARCHAR(500),           -- Nguồn tham khảo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_preservation_food FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. QUẢN LÝ TỦ LẠNH
-- ==========================================

-- Bảng đồ trong tủ lạnh của gia đình
CREATE TABLE fridge_items (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL,                  -- Thuộc gia đình nào
    food_id INT NOT NULL,                    -- Thực phẩm gì
    custom_name VARCHAR(255),                -- Tên tùy chỉnh nếu người dùng tự nhập thực phẩm
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Số lượng
    storage_location VARCHAR(100),           -- Vị trí lưu trữ chính: COOL (ngăn mát), FREEZER (ngăn đông), DRY (tủ đồ khô)
    specific_location VARCHAR(100),          -- Vị trí cụ thể trong khu vực lưu trữ: VEGETABLE_DRAWER (ngăn rau), DOOR_SHELF (cánh tủ), TOP_SHELF (kệ trên)...
    added_date DATE DEFAULT CURRENT_DATE,    -- Ngày nhập vào tủ
    expiry_date DATE,                        -- Hạn sử dụng
    status VARCHAR(50) DEFAULT 'STORED',     -- Trạng thái: STORED (đang lưu), EXPIRED (hết hạn), USED (đã dùng hết), REMOVED (đã loại bỏ)
    image_url VARCHAR(500),                  -- Ảnh chụp thực phẩm trong tủ (tùy chọn)
    note TEXT,                               -- Ghi chú
    removed_reason VARCHAR(100),                -- Lý do loại bỏ: USED_UP, EXPIRED_DISCARDED, SPOILED, WRONG_INFO, OTHER
    removed_reason_note TEXT,                   -- Nội dung lý do khác nếu người dùng chọn OTHER
    removed_at TIMESTAMP,                       -- Thời điểm loại bỏ thực phẩm khỏi tủ; NULL nếu thực phẩm vẫn đang lưu
    removed_by INT,                             -- Người thực hiện loại bỏ thực phẩm
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fridge_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT fk_fridge_food FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    CONSTRAINT fk_fridge_removed_by FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 5. KẾ HOẠCH MUA SẮM
-- ==========================================

-- Bảng danh sách mua sắm
CREATE TABLE shopping_lists (
    id SERIAL PRIMARY KEY,
    created_by INT NOT NULL,                 -- Người tạo danh sách
    family_id INT NOT NULL,                  -- Thuộc gia đình nào
    created_date DATE DEFAULT CURRENT_DATE,  -- Ngày tạo
    planned_date DATE,                       -- Ngày dự kiến đi mua
    note TEXT,                               -- Ghi chú
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shopping_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shopping_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Bảng chi tiết từng mục trong danh sách mua sắm
CREATE TABLE shopping_list_items (
    id SERIAL PRIMARY KEY,
    shopping_list_id INT NOT NULL,           -- Thuộc danh sách nào
    food_id INT NOT NULL,                    -- Thực phẩm cần mua
    custom_name VARCHAR(255),                -- Tên cụ thể nếu chọn thực phẩm "khác"
    order_number INT,                        -- Số thứ tự
    quantity NUMERIC(10, 2) NOT NULL,        -- Số lượng cần mua
    unit VARCHAR(50),                        -- Đơn vị tính
    note TEXT,                               -- Ghi chú thêm
    assigned_to INT,                         -- Người được giao mua
    is_purchased BOOLEAN DEFAULT FALSE,      -- Đã mua chưa
    imported_to_fridge_at TIMESTAMP,         -- Thời điểm đã nhập mục này vào tủ lạnh
    fridge_item_id INT,                      -- Fridge item được tạo từ mục đi chợ này
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sli_list FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_sli_food FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    CONSTRAINT fk_sli_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_sli_fridge_item FOREIGN KEY (fridge_item_id) REFERENCES fridge_items(id) ON DELETE SET NULL
);

-- ==========================================
-- 6. MÓN ĂN & CÔNG THỨC
-- ==========================================

-- Bảng công thức / món ăn
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,              -- Tên món ăn
    description TEXT,                        -- Mô tả ngắn về món ăn hiển thị ở trang chi tiết

    instructions TEXT,                       -- Hướng dẫn chế biến đầy đủ

    cooking_time_minutes INT,                -- Thời gian nấu dự kiến (phút)
    servings INT,                            -- Số khẩu phần ăn phù hợp
    calories INT,                            -- Tổng năng lượng ước tính (kcal)

    difficulty VARCHAR(20)
        CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')), -- Độ khó chế biến: EASY, MEDIUM, HARD

    reference_link VARCHAR(500),             -- Link tham khảo (video, blog, website...)
    author VARCHAR(255),                     -- Tác giả công thức

    preferred_meal_time VARCHAR(20)
        CHECK (preferred_meal_time IN ('BREAKFAST', 'LUNCH', 'DINNER')), -- Bữa ưu tiên: BREAKFAST, LUNCH, DINNER

    display_status VARCHAR(50) DEFAULT 'SYSTEM', -- Loại: SYSTEM (món hệ thống), CUSTOM (món tự tạo)
    image_url VARCHAR(500),                  -- Ảnh minh họa món ăn

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng nguyên liệu của món ăn
CREATE TABLE recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL,                  -- Thuộc món ăn nào
    food_id INT NOT NULL,                    -- Nguyên liệu (thực phẩm)
    quantity NUMERIC(10, 2) NOT NULL,        -- Số lượng cần
    unit VARCHAR(50),                        -- Đơn vị
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recipe_food UNIQUE (recipe_id, food_id),
    CONSTRAINT fk_ri_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ri_food FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- Bảng yêu thích / nổi bật (liên kết N-N giữa người dùng và món ăn) — theo yêu cầu mục 4.3
CREATE TABLE user_favorite_recipes (
    user_id INT NOT NULL,                    -- Người dùng
    recipe_id INT NOT NULL,                  -- Món ăn yêu thích
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id),
    CONSTRAINT fk_ufr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ufr_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. THỰC ĐƠN & BỮA ĂN
-- ==========================================

-- Bảng thực đơn (kế hoạch ăn theo tuần)
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL,                  -- Thuộc gia đình nào
    start_date DATE NOT NULL,                -- Ngày bắt đầu
    end_date DATE NOT NULL,                  -- Ngày kết thúc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Bảng bữa ăn (mỗi ngày có thể có nhiều bữa)
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    menu_id INT NOT NULL,                    -- Thuộc thực đơn nào
    meal_date DATE NOT NULL,                 -- Ngày ăn
    meal_type VARCHAR(20) NOT NULL
        CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER')), -- Loại bữa ăn: BREAKFAST, LUNCH, DINNER
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meal_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- Bảng chi tiết bữa ăn (món ăn trong mỗi bữa)
CREATE TABLE meal_items (
    id SERIAL PRIMARY KEY,
    meal_id INT NOT NULL,                    -- Thuộc bữa ăn nào
    recipe_id INT NOT NULL,                  -- Món ăn
    status VARCHAR(50) DEFAULT 'SUGGESTED',  -- Trạng thái: SUGGESTED (gợi ý), CONFIRMED (đã chốt)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_meal_recipe UNIQUE (meal_id, recipe_id),
    CONSTRAINT fk_mi_meal FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    CONSTRAINT fk_mi_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- ==========================================
-- 8. DỮ LIỆU MẶC ĐỊNH
-- ==========================================

-- Tạo 2 vai trò mặc định
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Quản trị viên hệ thống - toàn quyền truy cập'),
('CUSTOMER', 'Khách hàng / thành viên gia đình');

CREATE TABLE invitations (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL,                  -- Lời mời từ gia đình nào
    receiver_id INT NOT NULL,                -- Gửi lời mời tới User ID nào
    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')), -- Trạng thái lời mời: PENDING (đang chờ), ACCEPTED (đã chấp nhận), DECLINED (đã từ chối)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invite_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT fk_invite_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

