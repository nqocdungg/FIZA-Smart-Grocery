# FIZA Smart Grocery

FIZA Smart Grocery là hệ thống hỗ trợ quản lý thực phẩm và bữa ăn trong gia đình, giúp người dùng theo dõi thực phẩm trong tủ lạnh, lập kế hoạch mua sắm, xây dựng thực đơn và tối ưu việc sử dụng nguyên liệu nhằm giảm lãng phí thực phẩm.

Dự án được phát triển theo kiến trúc Frontend–Backend tách biệt, sử dụng JWT Authentication và PostgreSQL Database.

---

## Tính năng chính

### Quản lý người dùng và gia đình

* Đăng ký, đăng nhập và xác thực người dùng
* Quản lý hồ sơ cá nhân
* Tạo gia đình và mời thành viên tham gia
* Phân quyền thành viên trong gia đình

### Quản lý thực phẩm và tủ lạnh

* Quản lý danh mục thực phẩm
* Theo dõi số lượng thực phẩm trong tủ lạnh
* Quản lý hạn sử dụng và trạng thái bảo quản
* Cảnh báo thực phẩm sắp hết hạn

### Quản lý mua sắm

* Tạo và quản lý danh sách mua sắm
* Theo dõi tiến độ mua hàng
* Đồng bộ thực phẩm đã mua vào kho gia đình

### Quản lý công thức và thực đơn

* Tra cứu và lưu trữ công thức nấu ăn
* Lưu món ăn yêu thích
* Xây dựng thực đơn theo ngày hoặc tuần
* Gợi ý món ăn dựa trên nguyên liệu hiện có

### Báo cáo và thống kê

* Thống kê tình trạng thực phẩm
* Thống kê hoạt động mua sắm
* Theo dõi mức độ sử dụng nguyên liệu

---

## Phân quyền hệ thống

Hệ thống áp dụng mô hình **Role-Based Access Control (RBAC)** với ba nhóm người dùng chính:

| Vai trò     | Mô tả                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| ADMIN       | Quản trị hệ thống, quản lý dữ liệu dùng chung và giám sát toàn bộ hoạt động     |
| HOUSEKEEPER | Quản lý hoạt động của gia đình, bao gồm tủ lạnh, mua sắm, thực đơn và công thức |
| CUSTOMER    | Thành viên gia đình, tham gia sử dụng và cập nhật dữ liệu được chia sẻ          |

### Ma trận phân quyền

| Chức năng                   | ADMIN | HOUSEKEEPER | CUSTOMER            |
| --------------------------- | ----- | ----------- | ------------------- |
| Quản lý người dùng hệ thống | ✓     | ✗           | ✗                   |
| Quản lý danh mục dùng chung | ✓     | ✗           | ✗                   |
| Quản lý gia đình            | ✓     | ✓           | ✗                   |
| Quản lý thành viên gia đình | ✓     | ✓           | Xem                 |
| Quản lý tủ lạnh             | ✓     | ✓           | ✓                   |
| Quản lý thực phẩm           | ✓     | ✓           | ✓                   |
| Quản lý danh sách mua sắm   | ✓     | ✓           | Cập nhật trạng thái |
| Quản lý công thức nấu ăn    | ✓     | ✓           | ✓                   |
| Quản lý thực đơn            | ✓     | ✓           | ✓                   |
| Xem báo cáo thống kê        | ✓     | ✓           | Giới hạn            |
| Quản trị hệ thống           | ✓     | ✗           | ✗                   |

---

## Công nghệ sử dụng

### Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* PostgreSQL
* JWT Authentication
* MapStruct
* Lombok
* Swagger / OpenAPI

### Frontend

* React
* TypeScript
* Vite
* React Router
* Axios
* Recharts
* Lucide React

### Cloud Services

* Neon PostgreSQL
* Cloudinary
* Render
* Vercel

---

## Kiến trúc hệ thống

```text
React + TypeScript
        │
        │ REST API / JWT
        ▼
Spring Boot Backend
        │
        ▼
PostgreSQL Database

Cloudinary (Media Storage)
```

---

## Cấu trúc dự án

```text
FIZA-Smart-Grocery
│
├── database/          # Database scripts và seed data
├── doc/               # Tài liệu dự án
├── mealmate/          # Backend (Spring Boot)
├── mealmate-UI/       # Frontend (React + TypeScript)
└── .github/           # CI/CD workflows
```

---

## Yêu cầu môi trường

* Java 21
* Node.js 20+
* PostgreSQL 13+
* Git

---

## Cài đặt và chạy dự án

### Clone repository

```bash
git clone https://github.com/nqocdungg/FIZA-Smart-Grocery.git
cd FIZA-Smart-Grocery
```

### Chạy Backend

```bash
cd mealmate

./mvnw spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

### Chạy Frontend

```bash
cd mealmate-UI

npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

## Triển khai

| Thành phần    | Nền tảng        |
| ------------- | --------------- |
| Frontend      | Vercel          |
| Backend       | Render          |
| Database      | Neon PostgreSQL |
| Media Storage | Cloudinary      |

---

## Thông tin dự án

| Thuộc tính     | Giá trị                       |
| -------------- | ----------------------------- |
| Project        | FIZA Smart Grocery            |
| Course         | IT4549 - ITSS                 |
| Academic Year  | 2024 - 2025                   |
| Architecture   | Frontend - Backend Separation |
| Authentication | JWT                           |
| Database       | PostgreSQL                    |

---

## Nhóm phát triển

Dự án được phát triển trong khuôn khổ học phần **IT4549 - Phát triển phần mềm theo chuẩn ITSS** tại Trường Đại học Bách khoa Hà Nội.
