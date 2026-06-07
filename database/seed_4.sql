-- ============================================================
-- SEED 4: Reseed anh that cho toan bo cong thuc trong seed_1 va seed_3
-- Chay sau: db.sql, seed_1.sql, seed_3.sql
--
-- Tieu chi:
-- - Anh mon an that, khong dung icon/placeholder.
-- - Uu tien URL anh truc tiep tu cloud de frontend render on dinh.
-- - Cong thuc seed_1 update theo name vi author co the la Bep nha MealMate
--   hoac Bep nha Fiza tuy database da duoc rename hay chua.
-- - Cong thuc seed_3 update theo name + author de tranh nham cong thuc trung ten.
-- - Script co the chay lai nhieu lan.
-- ============================================================

BEGIN;

CREATE TEMP TABLE seed_4_recipe_images (
    name VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    image_url VARCHAR(500) NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_4_recipe_images (name, author, image_url) VALUES
-- ============================================================
-- Cong thuc tu seed_1
-- ============================================================
('Phở bò gia đình', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-pho-bo-tai-gau-mon-an-sang-835561735421.jpg'),
('Bún chả Hà Nội', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-bun-cha-mon-chinh-409946962562.jpg'),
('Cơm tấm sườn trứng', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-com-tam-suon-nuong-mon-chinh-831905996856.jpg'),
('Canh chua cá basa', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-canh-chua-ca-basa-mon-chinh-147322849370.jpg'),
('Cá thu kho tiêu', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-ca-thu-kho-mon-chinh-921317343617.jpg'),
('Thịt kho trứng', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-thit-kho-trung-nam-djong-co-mon-chinh-871512913685.jpg'),
('Gà rang gừng', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-ga-rang-gung-mon-chinh-850554516745.jpg'),
('Rau muống xào tỏi', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-rau-muong-xao-toi-mon-chinh-424950040069.jpg'),
('Bò lúc lắc', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-bo-luc-lac-nhanh-gon-mon-chinh-809513959941.jpg'),
('Cháo gà xé', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-chao-ga-bo-duong-mon-chinh-303728220827.jpg'),
('Canh bí đỏ thịt bằm', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-canh-bi-djo-thit-bam-mon-chinh-201227429534.jpg'),
('Mực xào cà chua', NULL, 'https://cookbeo.com/media/2021/05/muc-xao-ca-chua/muc-xao-ca-chua-5x7.jpg'),
('Tôm rang thịt ba chỉ', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-tom-djong-rang-thit-ba-chi-mon-chinh-229448800789.jpg'),
('Miến gà nấm rơm', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-mien-ga-nam-huong-mon-an-sang-754014515807.jpg'),
('Sườn non kho tiêu', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-suon-heo-non-kho-tieu-mon-chinh-150790441965.jpg'),
('Salad trái cây sữa chua', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-sua-chua-trai-cay-hat-chia-mon-trang-mieng-950083540296.jpg'),
('Xôi đậu xanh', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-xoi-djau-xanh-cot-dua-mon-an-sang-909287019729.jpg'),
('Sinh tố xoài sữa chua', NULL, 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-sinh-to-xoai-sua-tuoi-nhanh-de-322599934100.jpg'),

-- ============================================================
-- Cong thuc tu seed_3: Tro ly nha bep
-- ============================================================
('Trứng chiên cà chua', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-trung-chien-ca-chua-mon-chinh-955287471616.jpg'),
('Thịt ba chỉ rang cháy cạnh', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-thit-ba-chi-rang-mon-chinh-290314796258.jpg'),
('Canh cải thìa nấu tôm', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-canh-cai-thia-nau-tom-trung-mon-chinh-846192367421.jpg'),
('Bò xào tỏi', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-bo-xao-rau-cu-eatclean-mon-chinh-235991584517.jpg'),
('Đùi gà chiên nước mắm', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-djui-ga-chien-nuoc-mam-mon-chinh-912527915466.jpg'),
('Cá basa kho tộ', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-ca-basa-kho-to-mon-chinh-192444690101.jpg'),
('Nấm rơm xào tỏi', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-nam-rom-xao-la-e-mon-chay-558689391749.jpg'),
('Gà kho gừng', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-ga-kho-gung-soi-mon-chinh-332196393593.jpg'),
('Sườn xào chua ngọt', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-suon-xao-chua-ngot-mon-chinh-388693588621.jpg'),
('Mực xào dứa', 'Trợ lý nhà bếp', 'https://cookbeo.com/media/2021/05/muc-xao-dua/muc-xao-dua-16x9.jpg'),
('Salad xoài sữa chua', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-sua-chua-trai-cay-hat-chia-mon-trang-mieng-950083540296.jpg'),
('Bún xào thập cẩm', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-bun-xao-thap-cam-mon-chinh-218890328959.jpg'),
('Canh nghêu cà chua', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-canh-chua-ngheu-mon-chinh-201961716964.jpg'),
('Miến gà nấm thập cẩm', 'Trợ lý nhà bếp', 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/10/cach-lam-mien-ga-nam-huong-mon-an-sang-754014515807.jpg');

UPDATE recipes r
SET image_url = s.image_url
FROM seed_4_recipe_images s
WHERE r.name = s.name
  AND (s.author IS NULL OR r.author = s.author);

-- Ket qua mong doi: updated_count >= 32 neu da chay du seed_1 va seed_3.
SELECT COUNT(*) AS updated_count
FROM recipes r
JOIN seed_4_recipe_images s
  ON r.name = s.name
 AND (s.author IS NULL OR r.author = s.author)
 AND r.image_url = s.image_url;

-- Neu co dong nao hien ra o day thi recipe do chua ton tai trong database
-- hoac author trong database khac voi author khai bao o tren.
SELECT s.name, s.author
FROM seed_4_recipe_images s
LEFT JOIN recipes r
  ON r.name = s.name
 AND (s.author IS NULL OR r.author = s.author)
WHERE r.id IS NULL
ORDER BY s.author, s.name;

COMMIT;
