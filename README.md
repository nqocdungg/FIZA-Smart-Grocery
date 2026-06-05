# MealMate - Hệ thống đi chợ tiện lợi

MealMate là hệ thống hỗ trợ gia đình lập kế hoạch mua sắm, quản lý thực phẩm trong tủ lạnh, theo dõi hạn sử dụng, gợi ý món ăn từ nguyên liệu sẵn có và xây dựng thực đơn theo tuần.

## Chức năng chính

- Quản lý tài khoản, vai trò và phân quyền.
- Quản lý gia đình và thành viên.
- Quản lý danh mục thực phẩm, thực phẩm và cách bảo quản.
- Quản lý thực phẩm trong tủ lạnh: số lượng, vị trí lưu trữ, hạn sử dụng, trạng thái.
- Lập danh sách mua sắm, phân công người mua và cập nhật trạng thái mua hàng.
- Quản lý công thức nấu ăn, nguyên liệu, món yêu thích.
- Lên kế hoạch bữa ăn theo ngày/tuần và gợi ý món ăn.
- Báo cáo, thống kê hoạt động mua sắm và sử dụng thực phẩm.

## Công nghệ sử dụng

### Backend

- Java 21
- Spring Boot 3.5
- Spring Web, Spring Data JPA, Spring Security
- JWT Authentication
- PostgreSQL
- Maven
- Lombok, MapStruct
- Springdoc OpenAPI

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Lucide React

## Cấu trúc thư mục

```text
.
├── database/
│   ├── db.sql          # Schema PostgreSQL
│   └── seed_1.sql      # Dữ liệu mẫu cho hệ thống
├── mealmate/           # Backend Spring Boot
│   ├── src/main/java/com/mealmate/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── catalog/
│   │   ├── fridge/
│   │   ├── shopping/
│   │   ├── meal/
│   │   ├── report/
│   │   └── admin/
│   └── src/main/resources/application.yaml
├── mealmate-UI/        # Frontend React/Vite
│   ├── src/
│   └── .env
└── README.md
```

## Cài đặt database

Yêu cầu PostgreSQL đang chạy local. Cấu hình mặc định của backend:

```yaml
url: jdbc:postgresql://localhost:5432/mealmate
username: postgres
password: admin
```

Tạo mới database và seed dữ liệu:

```bash
psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS mealmate;"
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE mealmate WITH ENCODING 'UTF8';"
psql -h localhost -p 5432 -U postgres -d mealmate -f database/db.sql
psql -h localhost -p 5432 -U postgres -d mealmate -f database/seed_1.sql
```

Mật khẩu mặc định của các tài khoản seed là `123456`.

Tài khoản mẫu:

| Vai trò | Email |
| --- | --- |
| Admin | `quantri@mealmate.vn` |
| Người nội trợ | `lan.nguyen@example.com` |
| Người nội trợ | `huong.tran@example.com` |
| Thành viên | `minh.nguyen@example.com` |
| Thành viên | `khoa.tran@example.com` |

## Chạy backend

```bash
cd mealmate
./mvnw spring-boot:run
```

Trên Windows:

```bash
cd mealmate
mvnw.cmd spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

## Chạy frontend

File `mealmate-UI/.env` đang trỏ API về backend local:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Chạy frontend:

```bash
cd mealmate-UI
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

## Build

Backend:

```bash
cd mealmate
./mvnw clean package
```

Frontend:

```bash
cd mealmate-UI
npm run build
```

## Ghi chú

- Nếu thay đổi cấu trúc bảng, cập nhật `database/db.sql` trước rồi điều chỉnh seed tương ứng.
- Nếu reset dữ liệu local, chạy lại lần lượt `db.sql` và `seed_1.sql`.
- Dữ liệu seed sử dụng nội dung tiếng Việt và phù hợp ngữ cảnh gia đình Việt Nam.
