# Fiza - Hệ thống đi chợ tiện lợi

Fiza là hệ thống hỗ trợ gia đình lập kế hoạch mua sắm, quản lý thực phẩm trong tủ lạnh, theo dõi hạn sử dụng, gợi ý món ăn từ nguyên liệu sẵn có và xây dựng kế hoạch bữa ăn hàng ngày/tuần.

## 📋 Chức năng chính

- **Quản lý tài khoản & phân quyền**: Quản lý tài khoản, vai trò (Admin, Người nội trợ, Thành viên) và phân quyền chi tiết
- **Quản lý gia đình**: Tạo và quản lý gia đình, thêm thành viên, phân quyền theo vai trò
- **Quản lý danh mục & thực phẩm**: Quản lý danh mục thực phẩm, loại thực phẩm, cách bảo quản
- **Quản lý tủ lạnh**: Theo dõi thực phẩm trong tủ lạnh (số lượng, vị trí, hạn sử dụng, trạng thái)
- **Lập danh sách mua sắm**: Tạo danh sách mua hàng, phân công người mua, cập nhật trạng thái
- **Quản lý công thức nấu ăn**: Quản lý công thức, nguyên liệu, lưu món yêu thích
- **Lên kế hoạch bữa ăn**: Lên kế hoạch bữa ăn theo ngày/tuần, gợi ý món ăn từ nguyên liệu sẵn có
- **Báo cáo & thống kê**: Thống kê hoạt động mua sắm và sử dụng thực phẩm

## 🛠️ Công nghệ sử dụng

### Backend
- **Java 21**
- **Spring Boot 3.5**
  - Spring Web
  - Spring Data JPA
  - Spring Security
- **JWT Authentication** - Xác thực an toàn
- **PostgreSQL** - Cơ sở dữ liệu
- **Maven** - Build tool
- **Lombok** - Giảm boilerplate code
- **MapStruct** - Mapping DTO/Entity
- **Springdoc OpenAPI** - Tài liệu API tự động

### Frontend
- **React 19** - UI Library
- **TypeScript** - Kiểu dữ liệu tĩnh
- **Vite** - Build tool, dev server nhanh
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Biểu đồ
- **Lucide React** - Icon components

## 📁 Cấu trúc thư mục

```
.
├── database/                           # Dữ liệu cơ sở dữ liệu
│   ├── db.sql                         # Schema PostgreSQL
│   └── seed_1.sql                     # Dữ liệu mẫu
├── mealmate/                          # Backend Spring Boot
│   ├── pom.xml                        # Maven dependencies
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mealmate/
│   │   │   │   ├── auth/              # Xác thực & phân quyền
│   │   │   │   ├── user/              # Quản lý người dùng
│   │   │   │   ├── catalog/           # Danh mục & thực phẩm
│   │   │   │   ├── fridge/            # Quản lý tủ lạnh
│   │   │   │   ├── shopping/          # Danh sách mua sắm
│   │   │   │   ├── meal/              # Quản lý bữa ăn & công thức
│   │   │   │   ├── report/            # Báo cáo & thống kê
│   │   │   │   ├── admin/             # Quản lý hệ thống
│   │   │   │   └── common/            # Utilities & exceptions
│   │   │   └── resources/
│   │   │       └── application.yaml   # Cấu hình ứng dụng
│   │   └── test/                      # Unit tests
│   └── mvnw / mvnw.cmd               # Maven wrapper
├── mealmate-UI/                       # Frontend React/Vite
│   ├── package.json                   # NPM dependencies
│   ├── vite.config.ts                 # Cấu hình Vite
│   ├── .env                           # Biến môi trường
│   ├── public/                        # Assets tĩnh
│   ├── src/
│   │   ├── components/                # React components
│   │   ├── pages/                     # Trang chính
│   │   ├── services/                  # API calls
│   │   ├── hooks/                     # Custom hooks
│   │   ├── utils/                     # Utility functions
│   │   ├── types/                     # TypeScript types
│   │   ├── styles/                    # CSS/SCSS
│   │   └── App.tsx                    # Component chính
│   └── tsconfig.json                  # TypeScript config
└── README.md                          # Tài liệu này
```

## ⚙️ Yêu cầu hệ thống

Trước khi cài đặt, hãy đảm bảo máy tính của bạn có:

### Bắt buộc
- **Java 21 trở lên**
  - [Tải Java từ Oracle](https://www.oracle.com/java/technologies/downloads/) hoặc [OpenJDK](https://openjdk.java.net/)
  - Kiểm tra: `java -version`
  
- **PostgreSQL 13 trở lên**
  - [Tải PostgreSQL](https://www.postgresql.org/download/)
  - Cài đặt và ghi nhớ mật khẩu người dùng `postgres`
  - Kiểm tra: `psql --version`

- **Node.js 18+ và npm**
  - [Tải Node.js](https://nodejs.org/) (bao gồm npm)
  - Kiểm tra: `node -v` và `npm -v`

### Tùy chọn
- **Git** - Để clone repository
- **IDE** - VS Code, IntelliJ IDEA, hoặc Eclipse
- **Postman** - Để test API (có thể dùng Swagger UI thay thế)

## 🚀 Hướng dẫn cài đặt và chạy

### Bước 1: Clone repository

```bash
git clone https://github.com/HieuLuong1/IT4549.ITSS.Group7.TuanNM.git
cd IT4549.ITSS.Group7.TuanNM
```

### Bước 2: Cài đặt PostgreSQL Database

#### 2.1 Tạo database

Chạy các lệnh sau trên PostgreSQL command line hoặc PgAdmin:

```bash
# Xóa database cũ nếu có
psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS mealmate;"

# Tạo database mới
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE mealmate WITH ENCODING 'UTF8';"

# Import schema (cấu trúc bảng)
psql -h localhost -p 5432 -U postgres -d mealmate -f database/db.sql

# Import dữ liệu mẫu
psql -h localhost -p 5432 -U postgres -d mealmate -f database/seed_1.sql
```

**Lưu ý**: 
- Thay `postgres` bằng username PostgreSQL của bạn nếu khác
- Thay mật khẩu nếu cần (thêm `-W` flag để nhập mật khẩu)

#### 2.2 Xác minh database

Kiểm tra dữ liệu đã được import:

```bash
psql -h localhost -p 5432 -U postgres -d mealmate -c "SELECT COUNT(*) FROM users;"
```

### Bước 3: Cài đặt Backend

```bash
cd mealmate

# Xem file application.yaml để xác minh cấu hình database
# Mặc định:
# - URL: jdbc:postgresql://localhost:5432/mealmate
# - Username: postgres
# - Password: admin
```

**Nếu cấu hình khác**, chỉnh sửa `src/main/resources/application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mealmate
    username: postgres          # Thay bằng username của bạn
    password: admin             # Thay bằng password của bạn
    driver-class-name: org.postgresql.Driver
```

**Chạy backend**:

- **Trên Linux/macOS**:
  ```bash
  ./mvnw spring-boot:run
  ```

- **Trên Windows**:
  ```bash
  mvnw.cmd spring-boot:run
  ```

Backend sẽ chạy tại: `http://localhost:8080`

**API Documentation**: `http://localhost:8080/swagger-ui/index.html`

### Bước 4: Cài đặt Frontend

```bash
cd ../mealmate-UI

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

**Cấu hình API**: File `.env` đã trỏ tới backend local:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Nếu backend chạy ở port khác, thay đổi giá trị này.

### Bước 5: Truy cập ứng dụng

Mở browser và truy cập: `http://localhost:5173`

## 👥 Tài khoản mẫu để thử nghiệm

Tất cả tài khoản mẫu sử dụng mật khẩu mặc định: **`123456`**

### Admin (Quản trị viên)
| Email | Mật khẩu | Quyền |
|-------|----------|-------|
| `quantri@mealmate.vn` | `123456` | Quản lý toàn bộ hệ thống, quản lý người dùng, cấu hình |

### Người nội trợ (Housewife)
| Email | Mật khẩu | Quyền |
|-------|----------|-------|
| `lan.nguyen@example.com` | `123456` | Quản lý tủ lạnh, lập danh sách mua sắm, lên kế hoạch bữa ăn |
| `huong.tran@example.com` | `123456` | Quản lý tủ lạnh, lập danh sách mua sắm, lên kế hoạch bữa ăn |

### Thành viên gia đình (Member)
| Email | Mật khẩu | Quyền |
|-------|----------|-------|
| `minh.nguyen@example.com` | `123456` | Xem thông tin gia đình, cập nhật trạng thái mua hàng |
| `khoa.tran@example.com` | `123456` | Xem thông tin gia đình, cập nhật trạng thái mua hàng |

### Hướng dẫn thử nghiệm từng vai trò

**Admin**: Đăng nhập để quản lý người dùng, cấu hình hệ thống, xem báo cáo toàn bộ

**Người nội trợ**: 
- Quản lý thực phẩm trong tủ lạnh
- Tạo & quản lý danh sách mua sắm
- Lên kế hoạch bữa ăn
- Xem thống kê sử dụng

**Thành viên**:
- Xem thông tin gia đình
- Xem danh sách mua sắm
- Cập nhật trạng thái mua hàng

## 🔧 Các lệnh hữu ích

### Build & Production

**Backend** - Build JAR file:

```bash
cd mealmate
./mvnw clean package
# JAR file sẽ ở: target/mealmate-*.jar
```

**Frontend** - Build cho production:

```bash
cd mealmate-UI
npm run build
# Build output ở: dist/
```

### Khắc phục sự cố

**Lỗi kết nối database**:
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql  # Linux
brew services list                 # macOS
# Hoặc kiểm tra trong Services (Windows)

# Reset password PostgreSQL
sudo -u postgres psql
postgres=# ALTER ROLE postgres WITH PASSWORD 'admin';
```

**Lỗi port đã được sử dụng**:
```bash
# Backend (port 8080)
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Frontend (port 5173)
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows
```

**Clear cache & reinstall**:
```bash
# Backend
cd mealmate
./mvnw clean install

# Frontend
cd mealmate-UI
rm -rf node_modules package-lock.json
npm install
```

## 📝 Ghi chú quan trọng

- ✅ Nếu thay đổi schema database, cập nhật `database/db.sql` trước
- ✅ Sau khi cập nhật schema, điều chỉnh seed data (`database/seed_1.sql`) tương ứng
- ✅ Để reset dữ liệu local, chạy lại script `db.sql` và `seed_1.sql`
- ✅ Dữ liệu seed sử dụng tiếng Việt và phù hợp ngữ cảnh gia đình Việt Nam
- ✅ JWT token hết hạn sau 24 giờ, cần đăng nhập lại
- ✅ Mặc định backend CORS chỉ cho phép `http://localhost:5173`

## 📚 Tài liệu thêm

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Authentication](https://jwt.io/)

## 👨‍💻 Thông tin team

**Project**: Fiza - Hệ thống đi chợ tiện lợi  
**Group**: IT4549.ITSS.Group7  
**Năm học**: 2024-2025

---

**Happy Coding! 🎉**
