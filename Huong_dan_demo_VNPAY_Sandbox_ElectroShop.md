# HƯỚNG DẪN DEMO THANH TOÁN VNPAY SANDBOX — ELECTROSHOP

> Dùng cho dự án **ElectroShop**  
> Backend: Spring Boot — cổng `8080`  
> Frontend: React + Vite — cổng `5173`  
> Database: MySQL — database `electroshop`  
> Tunnel: ngrok  
> Môi trường thanh toán: VNPAY Sandbox

---

## 1. Mục tiêu của buổi demo

Luồng demo cần chạy được:

```text
Người dùng chọn sản phẩm
→ Mở trang thanh toán
→ Chọn phương thức VNPAY
→ Backend tạo đơn hàng
→ Backend tạo paymentUrl
→ Trình duyệt chuyển sang VNPAY Sandbox
→ Thanh toán bằng thẻ test
→ VNPAY chuyển về Return URL qua ngrok
→ Backend xác minh chữ ký và cập nhật database
→ Đơn hàng chuyển sang PAID
```

Kết quả đúng trong database:

```text
orders.payment_status = PAID
orders.order_status   = PENDING_CONFIRMATION

payments.status                 = PAID
payments.vnp_response_code      = 00
payments.vnp_transaction_status = 00
```

---

# 2. Chuẩn bị trước khi demo

## 2.1. Kiểm tra MySQL

Mở **MySQL Workbench** và kiểm tra database:

```sql
USE electroshop;

SELECT id, email, full_name, phone, role
FROM users;
```

Tài khoản người dùng hiện tại:

```text
userId = 2
email  = user1@gmail.com
role   = user
```

Kiểm tra sản phẩm dùng để test:

```sql
SELECT id, name, price, stock
FROM products
WHERE id = 1;
```

Sản phẩm phải:

- Tồn tại.
- Có `price > 0`.
- Có `stock > 0`.

---

## 2.2. Kiểm tra các biến môi trường VNPAY

Các biến cần có:

```text
VNPAY_TMN_CODE
VNPAY_HASH_SECRET
PUBLIC_BASE_URL
```

Không đưa `VNPAY_HASH_SECRET` vào GitHub, frontend hoặc ảnh chụp màn hình.

Trong PowerShell mới, kiểm tra:

```powershell
echo $env:VNPAY_TMN_CODE
echo $env:PUBLIC_BASE_URL
```

Kiểm tra HashSecret mà không hiện nội dung:

```powershell
if ($env:VNPAY_HASH_SECRET) {
    Write-Host "VNPAY_HASH_SECRET: DA CAU HINH"
} else {
    Write-Host "VNPAY_HASH_SECRET: CHUA CAU HINH"
}
```

Nếu chưa có, khai báo tạm thời:

```powershell
$env:VNPAY_TMN_CODE="TMN_CODE_VNPAY_CAP"

$env:VNPAY_HASH_SECRET="HASH_SECRET_VNPAY_CAP"

$env:PUBLIC_BASE_URL="https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev"
```

> Các biến `$env:...` chỉ có hiệu lực trong cửa sổ PowerShell hiện tại.

---

## 2.3. Kiểm tra `application.properties`

File:

```text
D:\Backup EL\TMDT\electroshop\src\main\resources\application.properties
```

Cần có:

```properties
spring.application.name=electroshop

spring.datasource.url=jdbc:mysql://localhost:3306/electroshop
spring.datasource.username=root
spring.datasource.password=root

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

server.port=8080

spring.web.resources.static-locations=file:uploads/

spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=100MB

# =========================
# VNPAY SANDBOX
# =========================

vnpay.version=2.1.0
vnpay.command=pay

vnpay.tmn-code=${VNPAY_TMN_CODE:}
vnpay.hash-secret=${VNPAY_HASH_SECRET:}

vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

vnpay.currency=VND
vnpay.locale=vn
vnpay.order-type=other

app.public-base-url=${PUBLIC_BASE_URL:http://localhost:8080}
app.frontend-url=http://localhost:5173
```

Cảnh báo `unknown property` trong VS Code không làm backend build thất bại.

---

# 3. Thứ tự mở các chương trình khi demo

Nên chuẩn bị 4 cửa sổ:

```text
Cửa sổ 1: MySQL Workbench
Cửa sổ 2: Backend Spring Boot
Cửa sổ 3: ngrok
Cửa sổ 4: Frontend React hoặc Postman
```

Không đóng cửa sổ backend và ngrok trong lúc thanh toán.

---

# 4. Chạy backend Spring Boot

Mở PowerShell:

```powershell
cd "D:\Backup EL\TMDT\electroshop"
```

Khai báo biến môi trường nếu cần:

```powershell
$env:VNPAY_TMN_CODE="TMN_CODE_VNPAY_CAP"

$env:VNPAY_HASH_SECRET="HASH_SECRET_VNPAY_CAP"

$env:PUBLIC_BASE_URL="https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev"
```

Kiểm tra build:

```powershell
.\mvnw.cmd clean compile
```

Kết quả đúng:

```text
BUILD SUCCESS
```

Chạy backend:

```powershell
.\mvnw.cmd spring-boot:run
```

Đợi tới khi thấy:

```text
Tomcat started on port 8080
Started ElectroshopApplication
```

Kiểm tra API:

```text
http://localhost:8080/api/orders
```

Nếu trình duyệt hiển thị JSON thì backend đã hoạt động.

---

# 5. Chạy ngrok

Mở một PowerShell khác:

```powershell
ngrok http 8080
```

Hoặc dùng tên miền cố định đã được ngrok cấp:

```powershell
ngrok http 8080 --url https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev
```

Kết quả đúng:

```text
Session Status    online

Forwarding
https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev
-> http://localhost:8080
```

Kiểm tra:

```text
https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev/api/orders
```

Nếu xuất hiện trang cảnh báo ngrok Free:

```text
You are about to visit...
```

nhấn:

```text
Visit Site
```

Sau đó trình duyệt thường sẽ không hỏi lại trong phiên hiện tại.

---

## 5.1. Nếu ngrok tạo URL mới

Nếu chạy:

```powershell
ngrok http 8080
```

và nhận URL mới, cập nhật lại:

```powershell
$env:PUBLIC_BASE_URL="https://URL-NGROK-MOI.ngrok-free.dev"
```

Sau đó phải:

1. Dừng backend bằng `Ctrl + C`.
2. Chạy lại backend trong cửa sổ có biến mới.
3. Tạo một giao dịch VNPAY mới.

Không dùng lại `paymentUrl` được tạo với URL ngrok cũ.

---

# 6. Chạy frontend

Mở terminal mới:

```powershell
cd "D:\Backup EL\TMDT\electroshop\frontend"
```

Cài thư viện nếu cần:

```powershell
npm install
```

Chạy frontend:

```powershell
npm run dev
```

Mở:

```text
http://localhost:5173
```

---

# 7. Tạo giao dịch VNPAY bằng Postman

API:

```http
POST http://localhost:8080/api/checkout
```

Chọn:

```text
Body → raw → JSON
```

Dữ liệu demo:

```json
{
  "userId": 2,
  "customerName": "Nguyễn Thành Tiếp",
  "email": "user1@gmail.com",
  "phone": "0586235610",
  "shippingAddress": "Thành phố Hồ Chí Minh",
  "note": "",
  "paymentMethod": "VNPAY",
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "selectedOptions": "{}"
    }
  ]
}
```

Kết quả đúng:

```text
201 Created
```

Response mẫu:

```json
{
  "orderId": 10,
  "orderCode": "ES202606151416217A827F",
  "subtotal": 20500000.00,
  "shippingFee": 0,
  "discountAmount": 0,
  "totalAmount": 20500000.00,
  "paymentMethod": "VNPAY",
  "paymentStatus": "UNPAID",
  "orderStatus": "WAITING_PAYMENT",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

Sao chép toàn bộ giá trị:

```text
paymentUrl
```

và mở trên Chrome.

Không sửa thủ công bất kỳ ký tự nào trong URL.

---

# 8. Thanh toán trên VNPAY Sandbox

Không dùng tài khoản hoặc thẻ ngân hàng thật.

Chọn:

```text
Thẻ ATM và tài khoản ngân hàng
```

Chọn ngân hàng:

```text
NCB
```

Thông tin thẻ test:

```text
Số thẻ:          9704198526191432198
Tên chủ thẻ:     NGUYEN VAN A
Ngày phát hành:  07/15
OTP:             123456
```

Sau khi nhập OTP, VNPAY sẽ chuyển trình duyệt về:

```text
https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev/api/payments/vnpay/return
```

---

# 9. Cách xử lý đang dùng cho demo

Phiên bản demo hiện tại dùng:

```text
Return URL
→ xác minh chữ ký
→ gọi callbackService.processIpn(params)
→ đối chiếu số tiền
→ kiểm tra trạng thái giao dịch
→ cập nhật database
→ chuyển hướng về frontend
```

Đây là phương án fallback để demo nhanh khi VNPAY Sandbox chưa gọi IPN tự động.

Trong triển khai thật:

```text
IPN là nguồn cập nhật chính
Return URL chỉ dùng để đưa khách về trang kết quả
```

---

# 10. Theo dõi request bằng ngrok Inspector

Mở:

```text
http://127.0.0.1:4040
```

Sau khi thanh toán, cần thấy:

```text
GET /api/payments/vnpay/return
```

Mã phản hồi đúng:

```text
302
```

`302` là bình thường vì backend chuyển hướng về:

```text
http://localhost:5173/payment-result
```

Nếu VNPAY gọi IPN, có thể thấy thêm:

```text
GET /api/payments/vnpay/ipn
```

Mã phản hồi đúng:

```text
200
```

---

# 11. Kiểm tra Terminal backend

Khi Return fallback xử lý thành công, Terminal có thể hiện:

```text
VNPAY Return fallback: {RspCode=00, Message=Confirm Success}
```

Các kết quả khác:

```text
RspCode=02
Order already confirmed
```

Giao dịch đã được xử lý trước đó.

```text
RspCode=04
Invalid amount
```

Số tiền callback không khớp database.

```text
RspCode=97
Invalid signature
```

Chữ ký callback không hợp lệ.

---

# 12. Kiểm tra database sau khi thanh toán

## 12.1. Kiểm tra bảng `orders`

```sql
USE electroshop;

SELECT
    id,
    order_code,
    payment_method,
    payment_status,
    order_status,
    total_amount,
    created_at
FROM orders
ORDER BY id DESC
LIMIT 5;
```

Kết quả đúng:

```text
payment_method = VNPAY
payment_status = PAID
order_status   = PENDING_CONFIRMATION
```

---

## 12.2. Kiểm tra bảng `payments`

```sql
SELECT
    id,
    order_id,
    txn_ref,
    amount,
    status,
    vnp_response_code,
    vnp_transaction_status,
    vnp_transaction_no,
    bank_code,
    card_type,
    pay_date
FROM payments
ORDER BY id DESC
LIMIT 10;
```

Kết quả đúng:

```text
status                 = PAID
vnp_response_code      = 00
vnp_transaction_status = 00
vnp_transaction_no     = có dữ liệu
bank_code               = NCB
```

---

## 12.3. Kiểm tra đầy đủ đơn và giao dịch

```sql
SELECT
    o.id AS order_id,
    o.order_code,
    o.payment_status,
    o.order_status,
    o.total_amount,
    p.txn_ref,
    p.status AS transaction_status,
    p.vnp_response_code,
    p.vnp_transaction_status,
    p.vnp_transaction_no,
    p.bank_code,
    p.card_type,
    p.pay_date
FROM orders o
JOIN payments p
    ON p.order_id = o.id
ORDER BY o.id DESC
LIMIT 10;
```

---

# 13. Các lỗi thường gặp

## 13.1. `Chưa cấu hình VNPAY_TMN_CODE`

Thông báo:

```text
IllegalStateException:
Chưa cấu hình VNPAY_TMN_CODE
```

Nguyên nhân:

- Chưa khai báo biến môi trường.
- Khai báo ở PowerShell khác.
- Backend chạy từ Spring Boot Dashboard nên không nhận biến.

Cách sửa:

```powershell
$env:VNPAY_TMN_CODE="TMN_CODE_VNPAY_CAP"

$env:VNPAY_HASH_SECRET="HASH_SECRET_VNPAY_CAP"

$env:PUBLIC_BASE_URL="https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev"

.\mvnw.cmd spring-boot:run
```

Phải chạy backend trong chính PowerShell vừa khai báo biến.

---

## 13.2. VNPAY báo `Sai chữ ký` — code 70

Nguyên nhân thường gặp:

- Dùng sai `VNPAY_HASH_SECRET`.
- Dùng mật khẩu đăng nhập Sandbox thay cho HashSecret.
- `TmnCode` và `HashSecret` không cùng một bộ.
- Backend chưa khởi động lại sau khi thay biến.
- Đang mở `paymentUrl` cũ.

Cách sửa:

1. Kiểm tra đúng `vnp_TmnCode` và `vnp_HashSecret` từ VNPAY.
2. Dừng backend.
3. Khai báo lại biến môi trường.
4. Chạy lại backend.
5. Tạo giao dịch mới.
6. Chỉ mở `paymentUrl` mới nhất.

---

## 13.3. `ERR_NGROK_3200`

Thông báo:

```text
The endpoint ... is offline
```

Nguyên nhân:

- Cửa sổ ngrok đã bị đóng.
- Tunnel bị ngắt.
- URL cũ không còn online.

Cách sửa:

```powershell
ngrok http 8080 --url https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev
```

Hoặc:

```powershell
ngrok http 8080
```

Nếu URL thay đổi, cập nhật `PUBLIC_BASE_URL` và khởi động lại backend.

---

## 13.4. Trang cảnh báo ngrok Free

Trang hiện:

```text
You are about to visit...
```

Cách xử lý:

```text
Nhấn Visit Site
```

Nên mở tên miền ngrok một lần trước khi bắt đầu demo:

```text
https://TEN-MIEN-NGROK-CUA-BAN.ngrok-free.dev/api/orders
```

---

## 13.5. Return URL có `302`

Đây không phải lỗi.

```text
GET /api/payments/vnpay/return → 302
```

Có nghĩa backend đã nhận request và chuyển hướng về frontend.

---

## 13.6. Database vẫn `UNPAID`

Kiểm tra:

1. Backend có đang chạy không.
2. ngrok có online không.
3. Request Return có xuất hiện trong `127.0.0.1:4040` không.
4. Terminal có báo `Invalid signature` hoặc `Invalid amount` không.
5. Controller có gọi `callbackService.processIpn(params)` trong Return fallback không.

---

# 14. Replay request Return để test nhanh

Khi đã có request thành công trong ngrok Inspector:

```text
GET /api/payments/vnpay/return
```

Có thể gửi lại mà không thanh toán lần nữa:

1. Mở `http://127.0.0.1:4040`.
2. Chọn request Return.
3. Nhấn **Replay**.
4. Gửi lại request.

Backend sẽ xác minh lại chữ ký và cập nhật database nếu giao dịch chưa được xử lý.

Nếu giao dịch đã được xử lý, có thể nhận:

```text
RspCode=02
Order already confirmed
```

---

# 15. Lưu ý về tồn kho

Code hiện tại giữ hàng bằng cách trừ tồn kho ngay khi tạo đơn VNPAY.

Mỗi lần nhấn **Send** trong Postman sẽ:

```text
Tạo đơn mới
Tạo payment mới
Trừ tồn kho
```

Không nhấn Send nhiều lần liên tục.

Kiểm tra các đơn đang giữ tồn kho:

```sql
SELECT
    oi.product_id,
    SUM(oi.quantity) AS reserved_quantity
FROM order_items oi
JOIN orders o
    ON o.id = oi.order_id
WHERE o.payment_status = 'UNPAID'
  AND o.order_status = 'WAITING_PAYMENT'
GROUP BY oi.product_id;
```

Về sau nên bổ sung:

```text
Đơn WAITING_PAYMENT quá 15 phút
→ CANCELLED
→ payment FAILED
→ hoàn tồn kho
→ stock_released = true
```

---

# 16. Checklist demo nhanh

Trước khi giảng viên xem:

```text
[ ] MySQL đang chạy
[ ] Backend chạy ở 8080
[ ] Frontend chạy ở 5173
[ ] ngrok đang online
[ ] PUBLIC_BASE_URL đúng với URL ngrok hiện tại
[ ] VNPAY_TMN_CODE đã có
[ ] VNPAY_HASH_SECRET đã có
[ ] Product ID dùng test còn tồn kho
[ ] User ID dùng test là 2
[ ] Mở trước URL ngrok và nhấn Visit Site
[ ] Postman trả 201 Created
[ ] paymentUrl không null
[ ] Mở đúng paymentUrl mới nhất
[ ] Dùng thẻ test NCB
[ ] ngrok Inspector có request Return
[ ] Database chuyển sang PAID
```

---

# 17. Kịch bản trình bày ngắn khi demo

Có thể trình bày:

```text
Đầu tiên, người dùng chọn sản phẩm và phương thức thanh toán VNPAY.

Frontend chỉ gửi mã sản phẩm và số lượng. Backend lấy lại giá thật từ
database, kiểm tra tồn kho, tính tổng tiền và tạo đơn hàng ở trạng thái
WAITING_PAYMENT.

Sau đó backend tạo một mã giao dịch riêng, ký dữ liệu bằng HMAC-SHA512
và tạo paymentUrl của VNPAY Sandbox.

Người dùng được chuyển sang VNPAY để thanh toán bằng thẻ test.

Sau khi thanh toán thành công, VNPAY trả các tham số giao dịch về backend
thông qua URL ngrok. Backend kiểm tra chữ ký, mã giao dịch, số tiền và
trạng thái trước khi cập nhật đơn hàng thành PAID.

Nhờ vậy frontend không thể tự sửa giá hoặc tự chuyển trạng thái đơn hàng.
```

---

# 18. Thông tin cần bảo mật

Không chia sẻ hoặc commit:

```text
VNPAY_HASH_SECRET
ngrok Authtoken
Mật khẩu MySQL
Mật khẩu người dùng
```

Có thể chia sẻ:

```text
VNPAY_TMN_CODE
URL ngrok tạm thời
Return URL
IPN URL
```

Nhưng khi hết buổi demo nên tắt ngrok.

---

# 19. Tắt hệ thống sau khi demo

Dừng backend:

```text
Ctrl + C
```

Dừng frontend:

```text
Ctrl + C
```

Dừng ngrok:

```text
Ctrl + C
```

Kiểm tra không còn tiến trình chiếm cổng:

```powershell
netstat -ano | findstr :8080
```

```powershell
netstat -ano | findstr :5173
```
