# FIZA Smart Grocery

FIZA là hệ thống hỗ trợ gia đình quản lý thực phẩm, tủ lạnh, kế hoạch đi chợ, công thức và thực đơn. Ứng dụng sử dụng kiến trúc frontend–backend tách rời, xác thực JWT và PostgreSQL.

## Chức năng chính

- Đăng ký, đăng nhập, quên mật khẩu và xác thực bằng JWT.
- Quản lý người dùng, vai trò và thành viên gia đình.
- Quản lý danh mục, thực phẩm, phương pháp bảo quản và công thức.
- Theo dõi thực phẩm trong tủ lạnh, số lượng, vị trí và hạn sử dụng.
- Gợi ý công thức và thực đơn dựa trên nguyên liệu hiện có.
- Lập kế hoạch đi chợ theo ngày hoặc tuần, phân công người mua và đánh dấu trạng thái.
- Nhập thực phẩm đã mua từ kế hoạch đi chợ vào tủ lạnh.
- Thông báo, báo cáo và dashboard quản trị.
- Upload ảnh lên Cloudinary và xuất nội dung PDF ở frontend.

### Phân quyền kế hoạch đi chợ

- `HOUSEKEEPER`: được tạo kế hoạch mới, chỉnh sửa danh sách, thêm thực phẩm, xóa danh sách và nhập thực phẩm đã mua vào tủ lạnh.
- `CUSTOMER`: được xem kế hoạch của gia đình và cập nhật trạng thái mua hàng trên kế hoạch hiện có.
- `ADMIN`: sử dụng các chức năng quản trị; không được mặc định coi là người nội trợ khi tạo kế hoạch mới.

Quyền tạo kế hoạch mới được kiểm tra ở cả frontend và backend.

## Công nghệ đang sử dụng

### Backend

| Công nghệ | Phiên bản/vai trò |
|---|---|
| Java | 21 |
| Spring Boot | 3.5.13 |
| Spring Web | REST API |
| Spring Data JPA / Hibernate | ORM và truy cập PostgreSQL |
| Spring Security | Xác thực và phân quyền |
| JJWT | 0.11.5 |
| Jakarta Validation | Kiểm tra dữ liệu đầu vào |
| PostgreSQL Driver | Runtime database driver |
| MapStruct | 1.5.5.Final |
| Lombok | Giảm boilerplate |
| Spring Mail | Email xác minh và quên mật khẩu |
| Springdoc OpenAPI | 2.8.17, Swagger UI |
| Cloudinary Java SDK | 1.39.0 |
| Maven Wrapper | Maven 3.9.14 |

### Frontend

| Công nghệ | Phiên bản/vai trò |
|---|---|
| React / React DOM | 19.2.5 |
| TypeScript | 6.0.2 |
| Vite | 8.0.10 |
| React Router | 7.14.2 |
| Axios | 1.15.2 |
| Recharts | 3.8.1 |
| Motion | 12.40.0 |
| Lucide React | 1.16.0 |
| jsPDF | 3.0.4 |
| React Hot Toast / Sonner | Thông báo giao diện |
| ESLint | 10.2.1 |

### Database và triển khai

- PostgreSQL local cho môi trường phát triển.
- Neon PostgreSQL cho database cloud.
- Render chạy backend bằng Docker multi-stage với Eclipse Temurin Java 21.
- Vercel build và phục vụ React SPA.
- GitHub Actions ping health endpoint định kỳ để hạn chế Render ngủ.
- Cloudinary lưu trữ ảnh.

Các URL đang sử dụng:

- Frontend: <https://fiza-smart-grocery.vercel.app>
- Backend: <https://fiza-smart-grocery.onrender.com>
- Health check: <https://fiza-smart-grocery.onrender.com/health>

## Kiến trúc tổng quan

```text
React 19 + TypeScript + Vite
              |
              | HTTPS / JSON / JWT
              v
Spring Boot 3.5 + Spring Security + JPA
              |
              v
PostgreSQL (local hoặc Neon)

Ảnh ----------------------------> Cloudinary
Frontend -----------------------> Vercel
Backend Docker -----------------> Render
```

Backend được tổ chức theo module:

- `auth`: đăng nhập, đăng ký, JWT và phân quyền.
- `user`: người dùng, gia đình và lời mời.
- `catalog`: danh mục, thực phẩm, công thức và bảo quản.
- `fridge`: quản lý thực phẩm trong tủ lạnh.
- `shopping`: kế hoạch đi chợ.
- `meal`: bữa ăn và thực đơn.
- `recommendation`: gợi ý công thức/thực đơn.
- `notification`: thông báo.
- `report`: báo cáo.
- `admin`: dashboard và API quản trị.
- `common`: DTO, exception, health check, storage và cấu hình dùng chung.

## Cấu trúc repository

```text
.
├── database/
│   ├── db.sql
│   ├── seed_1.sql
│   ├── seed_2.sql
│   ├── seed_3.sql
│   └── seed_4.sql
├── doc/
├── mealmate/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/mealmate/
│       ├── main/resources/
│       └── test/
├── mealmate-UI/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json
│   └── src/
│       ├── components/
│       ├── context/
│       ├── features/
│       ├── pages/
│       ├── services/
│       ├── shims/
│       └── types/
└── .github/workflows/keep-alive.yml
```

## Yêu cầu môi trường

- Java 21.
- Node.js `^20.19.0` hoặc `>=22.12.0` theo yêu cầu của Vite 8.
- npm đi kèm Node.js.
- PostgreSQL 13 trở lên cho môi trường local.
- Git.

Kiểm tra phiên bản:

```bash
java -version
node -v
npm -v
psql --version
```

Không cần cài Maven riêng vì repository có Maven Wrapper.

## Cài đặt local

### 1. Clone repository

```bash
git clone https://github.com/nqocdungg/FIZA-Smart-Grocery.git
cd FIZA-Smart-Grocery
```

Repo gốc:

```text
https://github.com/HieuLuong1/IT4549.ITSS.Group7.TuanNM.git
```

### 2. Khởi tạo PostgreSQL

```bash
psql -h localhost -p 5432 -U postgres -d postgres \
  -c "CREATE DATABASE mealmate WITH ENCODING 'UTF8';"

psql -h localhost -p 5432 -U postgres -d mealmate \
  -f database/db.sql

psql -h localhost -p 5432 -U postgres -d mealmate \
  -f database/seed_1.sql
```

Các file `seed_2.sql`, `seed_3.sql` và `seed_4.sql` chứa dữ liệu bổ sung. Chỉ chạy khi cần đúng bộ dữ liệu tương ứng và nên kiểm tra nội dung trước khi import để tránh trùng dữ liệu.

Xác minh:

```bash
psql -h localhost -p 5432 -U postgres -d mealmate \
  -c "SELECT COUNT(*) FROM users;"
```

> `localhost:5432/mealmate` và Neon `neondb` là hai database độc lập. Dữ liệu không tự đồng bộ giữa local và cloud.

### 3. Cấu hình backend

Backend đọc cấu hình database từ biến môi trường:

```env
SERVER_PORT=8080
DB_URL=jdbc:postgresql://localhost:5432/mealmate
DB_USERNAME=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_base64_secret
APP_BASE_URL=http://localhost:8080

SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_google_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Không commit mật khẩu, JWT secret, database URL có credentials hoặc Cloudinary secret lên Git.

Chạy backend:

```bash
cd mealmate
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Backend mặc định chạy tại <http://localhost:8080>.

- Swagger UI: <http://localhost:8080/swagger-ui/index.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>
- Health check: <http://localhost:8080/health>

### 4. Cấu hình frontend

```bash
cd mealmate-UI
npm install
```

Tạo hoặc cập nhật `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Chạy frontend:

```bash
npm run dev
```

Frontend mặc định chạy tại <http://localhost:5173>.

## Các lệnh thường dùng

### Backend

```bash
cd mealmate

# Compile
./mvnw compile

# Chạy test
./mvnw test

# Build JAR
./mvnw clean package
```

Trên Windows, thay `./mvnw` bằng `.\mvnw.cmd`.

### Frontend

```bash
cd mealmate-UI

# Development
npm run dev

# Type-check và production build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

Output frontend nằm trong `mealmate-UI/dist/`.

## Tài khoản seed

Mật khẩu mặc định của các tài khoản trong `seed_1.sql` là `123456`.

| Vai trò | Email |
|---|---|
| ADMIN | `quantri@mealmate.vn` |
| HOUSEKEEPER | `lan.nguyen@example.com` |
| HOUSEKEEPER | `huong.tran@example.com` |
| CUSTOMER | `minh.nguyen@example.com` |
| CUSTOMER | `anh.nguyen@example.com` |
| CUSTOMER | `binh.nguyen@example.com` |
| CUSTOMER | `khoa.tran@example.com` |
| CUSTOMER | `mai.tran@example.com` |

Các tài khoản này chỉ chắc chắn tồn tại sau khi import đúng seed vào database đang kết nối. Chỉnh sửa file seed không tự cập nhật database local, Neon hoặc Render đã tồn tại.

## Cấu hình triển khai

### Frontend trên Vercel

- Root Directory: `mealmate-UI`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable:

```env
VITE_API_BASE_URL=https://fiza-smart-grocery.onrender.com
```

`VITE_API_BASE_URL` được nhúng tại thời điểm build, vì vậy thay đổi biến này cần redeploy frontend.

### Backend trên Render

- Root Directory: `mealmate`
- Runtime: Docker
- Dockerfile: `mealmate/Dockerfile`
- Active profile trong image: `render`

Các biến tối thiểu:

```env
DB_URL=jdbc:postgresql://<neon-host>:5432/neondb?sslmode=require
DB_USERNAME=<neon-user>
DB_PASSWORD=<neon-password>
JWT_SECRET=<production-secret>
APP_BASE_URL=https://fiza-smart-grocery.onrender.com
```

Biến tùy chọn cho profile Render:

```env
DB_POOL_MAX_SIZE=5
DB_POOL_MIN_IDLE=1
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_MAX_LIFETIME=600000
DATABASE_MIGRATION_ENABLED=false
```

Profile Render giữ `spring.jpa.open-in-view=false`. Các service truy cập quan hệ lazy phải thực hiện trong transaction hoặc dùng truy vấn fetch phù hợp.

Ứng dụng sử dụng `spring.jpa.hibernate.ddl-auto=none`; schema cloud không tự cập nhật từ entity. Khi thay đổi schema, cần:

1. Cập nhật `database/db.sql`.
2. Tạo migration an toàn cho database đang chạy.
3. Kiểm tra đúng Neon endpoint/database mà Render sử dụng.
4. Redeploy và xác minh log cùng health endpoint.

## Lưu ý phát triển

- Giữ DTO, entity và schema PostgreSQL đồng bộ.
- Không dựa vào ID seed cố định trong business logic.
- Luôn lấy user hiện tại từ JWT/SecurityContext khi ghi dữ liệu có trường người tạo.
- Kiểm tra quyền ở backend; ẩn nút ở frontend chỉ là lớp hỗ trợ giao diện.
- Với shopping-plan, chỉ `HOUSEKEEPER` được tạo kế hoạch mới.
- CORS hiện cho phép mọi origin; nếu triển khai production lâu dài nên giới hạn về domain frontend chính thức.
- JWT mặc định hết hạn sau `3.600.000 ms` tương đương 1 giờ.
- Render dùng pool kết nối nhỏ để phù hợp Neon và tài nguyên hosting.

## Xử lý sự cố

### Frontend gọi sai backend

Kiểm tra `VITE_API_BASE_URL`, sau đó rebuild/redeploy Vercel.

### Local và Neon có dữ liệu khác nhau

So sánh đầy đủ:

- host;
- port;
- database name;
- username;
- SSL mode.

Database local thường là `localhost:5432/mealmate`; cấu hình Neon hiện dùng database `neondb`. Hai nơi không tự sao chép dữ liệu cho nhau.

### Render trả HTTP 500

1. Kiểm tra Render logs.
2. Kiểm tra `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
3. Gọi `/health`.
4. Xác minh schema Neon khớp `database/db.sql`.
5. Kiểm tra endpoint bằng đúng JWT và family của user.

### Port local bị chiếm

Windows:

```powershell
netstat -ano | findstr :8080
netstat -ano | findstr :5173
```

Linux/macOS:

```bash
lsof -i :8080
lsof -i :5173
```

## Tài liệu tham khảo

- [Spring Boot](https://spring.io/projects/spring-boot)
- [React](https://react.dev)
- [Vite](https://vite.dev)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Neon](https://neon.com/docs)
- [Render](https://render.com/docs)
- [Vercel](https://vercel.com/docs)
- [Cloudinary](https://cloudinary.com/documentation)

## Thông tin dự án

- Project: FIZA Smart Grocery
- Group: IT4549.ITSS.Group7
- Academic year: 2024–2025
