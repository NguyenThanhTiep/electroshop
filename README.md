# ElectroShop

ElectroShop là dự án website thương mại điện tử bán đồ điện tử, gồm frontend React, backend Spring Boot, MySQL và tích hợp thanh toán VNPAY Sandbox.

## Công nghệ sử dụng

- Frontend: React, Vite, Axios, React Router
- Backend: Spring Boot, Spring Security, Spring Data JPA
- Database: MySQL
- Thanh toán: VNPAY Sandbox
- Đóng gói: Docker, Docker Compose, Nginx, ngrok

## Chạy nhanh bằng Docker

Yêu cầu máy đã cài Docker Desktop và Docker Compose.
chạy:

```powershell
docker compose up --build
```

Sau khi chạy xong:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
Ngrok:    https://posting-prissy-elevate.ngrok-free.dev
```

MySQL chạy nội bộ trong Docker, backend tự kết nối qua service name `db`, nên người dùng không cần cấu hình MySQL local.

## Dữ liệu demo

File dữ liệu MySQL được đặt tại:

```text
docker/mysql/init/01-electroshop.sql
```

Khi chạy Docker lần đầu, MySQL sẽ tự import file này để có dữ liệu sản phẩm, danh mục, thương hiệu, banner và nội dung trang chủ.

Nếu muốn import lại dữ liệu từ đầu:

```powershell
docker compose down -v
docker compose up --build
```

Thư mục ảnh upload/banner:

```text
uploads/
```

Thư mục này được mount vào backend container để hiển thị ảnh đã lưu trong database.

## Tài khoản admin mặc định

Backend sẽ tự tạo tài khoản admin nếu database chưa có:

```text
Email:    admin@gmail.com
Password: admin
```

## Chạy VNPAY với ngrok tích hợp trong Docker

Chạy toàn bộ dự án bằng Docker, bao gồm cả ngrok:

```powershell
docker compose up --build
```

Thông tin thẻ test VNPAY Sandbox:

```text
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mã OTP: 123456
```

URL sau khi chạy:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
Ngrok:    https://posting-prissy-elevate.ngrok-free.dev
Ngrok dashboard: http://localhost:4040
Test API: https://posting-prissy-elevate.ngrok-free.dev/api/products

VNPAY Return URL:
https://posting-prissy-elevate.ngrok-free.dev/api/payments/vnpay/return

VNPAY IPN URL:
https://posting-prissy-elevate.ngrok-free.dev/api/payments/vnpay/ipn
```
