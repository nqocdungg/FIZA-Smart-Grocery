-- ==========================================
-- 1. NGƯỜI DÙNG & GIA ĐÌNH
-- ==========================================

-- Tạo bảng NguoiDung trước (chưa set Foreign Key đến GiaDinh để tránh lỗi vòng lặp)
CREATE TABLE NguoiDung (
    MaNguoiDung SERIAL PRIMARY KEY,
    MaGiaDinh INT, -- Khóa ngoại sẽ được thêm sau
    HoTen VARCHAR(255) NOT NULL,
    SDT VARCHAR(20),
    Email VARCHAR(255),
    MatKhau VARCHAR(255) NOT NULL,
    VaiTro VARCHAR(50) DEFAULT 'Thành viên' -- Quản trị viên, Nội trợ, Thành viên
);

-- Tạo bảng GiaDinh
CREATE TABLE GiaDinh (
    MaGiaDinh SERIAL PRIMARY KEY,
    MaNguoiNoiTro INT,
    TenGiaDinh VARCHAR(255) NOT NULL,
    CONSTRAINT fk_giadinh_noitro FOREIGN KEY (MaNguoiNoiTro) REFERENCES NguoiDung(MaNguoiDung) ON DELETE SET NULL
);

-- Cập nhật lại khóa ngoại cho bảng NguoiDung trỏ về GiaDinh
ALTER TABLE NguoiDung
ADD CONSTRAINT fk_nguoidung_giadinh 
FOREIGN KEY (MaGiaDinh) REFERENCES GiaDinh(MaGiaDinh) ON DELETE SET NULL;

-- ==========================================
-- 2. THỰC PHẨM & CHỦNG LOẠI
-- ==========================================

CREATE TABLE ChungLoai (
    MaChungLoai SERIAL PRIMARY KEY,
    TenChungLoai VARCHAR(255) NOT NULL
);

CREATE TABLE ThucPham (
    MaThucPham SERIAL PRIMARY KEY,
    MaChungLoai INT,
    TenThucPham VARCHAR(255) NOT NULL,
    DonViDo VARCHAR(50),
    TuDongNghia VARCHAR(500),
    CONSTRAINT fk_thucpham_chungloai FOREIGN KEY (MaChungLoai) REFERENCES ChungLoai(MaChungLoai) ON DELETE SET NULL
);

CREATE TABLE BienPhapBaoQuan (
    MaBienPhap SERIAL PRIMARY KEY,
    MaThucPham INT NOT NULL,
    NoiDung TEXT NOT NULL,
    NguonThamKhao VARCHAR(500),
    CONSTRAINT fk_baoquan_thucpham FOREIGN KEY (MaThucPham) REFERENCES ThucPham(MaThucPham) ON DELETE CASCADE
);

-- ==========================================
-- 3. QUẢN LÝ TỦ LẠNH
-- ==========================================

CREATE TABLE DoTrongTuLanh (
    MaDo SERIAL PRIMARY KEY,
    MaGiaDinh INT NOT NULL,
    MaThucPham INT NOT NULL,
    SoLuong NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ViTriLuuTru VARCHAR(100), -- Ngăn mát, ngăn đông, ngăn rau
    NgayNhapVao DATE DEFAULT CURRENT_DATE,
    HanSuDung DATE,
    TrangThai VARCHAR(50) DEFAULT 'Đang lưu trữ', -- Đang lưu trữ, Hết hạn, Đã sử dụng
    CONSTRAINT fk_tulanh_giadinh FOREIGN KEY (MaGiaDinh) REFERENCES GiaDinh(MaGiaDinh) ON DELETE CASCADE,
    CONSTRAINT fk_tulanh_thucpham FOREIGN KEY (MaThucPham) REFERENCES ThucPham(MaThucPham) ON DELETE CASCADE
);

-- ==========================================
-- 4. KẾ HOẠCH MUA SẮM
-- ==========================================

CREATE TABLE BanKeHoach (
    MaBanKeHoach SERIAL PRIMARY KEY,
    MaNguoiTao INT NOT NULL,
    MaGiaDinh INT NOT NULL,
    NgayTao DATE DEFAULT CURRENT_DATE,
    NgayThucHien DATE,
    GhiChu TEXT,
    CONSTRAINT fk_kehoach_nguoitao FOREIGN KEY (MaNguoiTao) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE,
    CONSTRAINT fk_kehoach_giadinh FOREIGN KEY (MaGiaDinh) REFERENCES GiaDinh(MaGiaDinh) ON DELETE CASCADE
);

CREATE TABLE ChiTietKeHoach (
    MaBanKeHoach INT NOT NULL,
    MaThucPham INT NOT NULL,
    STT INT,
    SoLuong NUMERIC(10, 2) NOT NULL,
    DonViTinh VARCHAR(50),
    GhiChu TEXT,
    NguoiDuocGiao INT,
    TrangThaiMua BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (MaBanKeHoach, MaThucPham),
    CONSTRAINT fk_chitietkh_kehoach FOREIGN KEY (MaBanKeHoach) REFERENCES BanKeHoach(MaBanKeHoach) ON DELETE CASCADE,
    CONSTRAINT fk_chitietkh_thucpham FOREIGN KEY (MaThucPham) REFERENCES ThucPham(MaThucPham) ON DELETE CASCADE,
    CONSTRAINT fk_chitietkh_nguoigiao FOREIGN KEY (NguoiDuocGiao) REFERENCES NguoiDung(MaNguoiDung) ON DELETE SET NULL
);

-- ==========================================
-- 5. MÓN ĂN & THỰC ĐƠN
-- ==========================================

CREATE TABLE MonAn (
    MaMon SERIAL PRIMARY KEY,
    TenMon VARCHAR(255) NOT NULL,
    HuongDanCheBien TEXT,
    LinkThamKhao VARCHAR(500),
    TacGia VARCHAR(255),
    BuaAnUuTien VARCHAR(50), -- Sáng, Trưa, Tối
    TrangThaiHienThi VARCHAR(50) DEFAULT 'Món hệ thống' -- Món hệ thống, Món tự tạo
);

CREATE TABLE NguyenLieuMonAn (
    MaMon INT NOT NULL,
    MaThucPham INT NOT NULL,
    SoLuong NUMERIC(10, 2) NOT NULL,
    DonVi VARCHAR(50),
    PRIMARY KEY (MaMon, MaThucPham),
    CONSTRAINT fk_nguyenlieu_mon FOREIGN KEY (MaMon) REFERENCES MonAn(MaMon) ON DELETE CASCADE,
    CONSTRAINT fk_nguyenlieu_thucpham FOREIGN KEY (MaThucPham) REFERENCES ThucPham(MaThucPham) ON DELETE CASCADE
);

CREATE TABLE MonTu (
    MaNguoiDung INT NOT NULL,
    MaMon INT NOT NULL,
    PRIMARY KEY (MaNguoiDung, MaMon),
    CONSTRAINT fk_montu_nguoidung FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE,
    CONSTRAINT fk_montu_mon FOREIGN KEY (MaMon) REFERENCES MonAn(MaMon) ON DELETE CASCADE
);

CREATE TABLE ThucDon (
    MaThucDon SERIAL PRIMARY KEY,
    MaGiaDinh INT NOT NULL,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    CONSTRAINT fk_thucdon_giadinh FOREIGN KEY (MaGiaDinh) REFERENCES GiaDinh(MaGiaDinh) ON DELETE CASCADE
);

CREATE TABLE BuaAn (
    MaBuaAn SERIAL PRIMARY KEY,
    MaThucDon INT NOT NULL,
    NgayAn DATE NOT NULL,
    LoaiBua VARCHAR(50) NOT NULL, -- Sáng, Trưa, Tối
    CONSTRAINT fk_buaan_thucdon FOREIGN KEY (MaThucDon) REFERENCES ThucDon(MaThucDon) ON DELETE CASCADE
);

CREATE TABLE ChiTietBuaAn (
    MaBuaAn INT NOT NULL,
    MaMon INT NOT NULL,
    TrangThai VARCHAR(50) DEFAULT 'Gợi ý', -- Gợi ý, Đã chốt
    PRIMARY KEY (MaBuaAn, MaMon),
    CONSTRAINT fk_chitietbuaan_buaan FOREIGN KEY (MaBuaAn) REFERENCES BuaAn(MaBuaAn) ON DELETE CASCADE,
    CONSTRAINT fk_chitietbuaan_mon FOREIGN KEY (MaMon) REFERENCES MonAn(MaMon) ON DELETE CASCADE
);