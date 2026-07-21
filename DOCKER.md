# Chay ElectroShop bang Docker

Tai lieu nay dung de nguoi khac clone/pull du an ve va chay duoc frontend, backend, MySQL va tuy chon ngrok.

## 1. Chuan bi

Can cai:

- Docker Desktop
- Docker Compose

Vi ngrok duoc tich hop chay cung Docker Compose, can tao `.env` truoc khi chay:

```powershell
copy .env.vnpay.example .env
```

Dien toi thieu cac bien ngrok:

```env
PUBLIC_BASE_URL=https://posting-prissy-elevate.ngrok-free.dev
NGROK_AUTHTOKEN=AUTHTOKEN_NGROK_CUA_BAN
NGROK_DOMAIN=posting-prissy-elevate.ngrok-free.dev
```

Neu demo VNPAY, dien them:

```env
VNPAY_TMN_CODE=TMN_CODE_VNPAY_CAP
VNPAY_HASH_SECRET=HASH_SECRET_VNPAY_CAP
```

## 2. Chay BE, FE va MySQL

```powershell
docker compose up --build
```

Sau khi chay xong:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Ngrok: https://posting-prissy-elevate.ngrok-free.dev
- MySQL chay noi bo trong Docker voi service name `db`

Tai khoan admin mac dinh:

```text
email: admin@gmail.com
password: admin
```

## 3. Nap du lieu database

Neu co file dump `.sql`, dat vao:

```text
docker/mysql/init/
```

Neu muon export database local hien tai sang file init Docker, chay:

```powershell
.\scripts\export-electroshop-db.ps1
```

Sau do chay lan dau:

```powershell
docker compose up --build
```

Neu truoc do da tao volume database, can reset volume de MySQL import lai:

```powershell
docker compose down -v
docker compose up --build
```

Thu muc anh upload duoc mount vao container backend:

```text
./uploads -> /app/uploads
```

Neu database dump co duong dan anh trong `uploads`, hay copy kem thu muc `uploads` sang may chay Docker de anh san pham/banner hien dung.

## 4. Chay VNPAY voi ngrok tich hop trong Docker

VNPAY can Return URL/IPN truy cap duoc tu internet. Du an da cau hinh service `ngrok` trong Docker Compose, nen chi can chay Docker la ngrok cung chay theo.

Tao file `.env` tu file mau:

```powershell
copy .env.vnpay.example .env
```

Trong file `.env`, dien:

```env
VNPAY_TMN_CODE=TMN_CODE_VNPAY_CAP
VNPAY_HASH_SECRET=HASH_SECRET_VNPAY_CAP
PUBLIC_BASE_URL=https://posting-prissy-elevate.ngrok-free.dev
FRONTEND_URL=http://localhost:5173
NGROK_AUTHTOKEN=AUTHTOKEN_NGROK_CUA_BAN
NGROK_DOMAIN=posting-prissy-elevate.ngrok-free.dev
```

Chay du an:

```powershell
docker compose up --build
```

Luu y:

- `PUBLIC_BASE_URL` phai dung dung domain ngrok.
- `NGROK_DOMAIN` phai trung voi domain trong `PUBLIC_BASE_URL`.
- Service ngrok se tu tro vao backend container cong `8080`.
- Khong commit `.env` vi co secret VNPAY.

Thong tin the test VNPAY Sandbox:

```text
Ngan hang: NCB
So the: 9704198526191432198
Ten chu the: NGUYEN VAN A
Ngay phat hanh: 07/15
Ma OTP: 123456
```

Ngrok dashboard:

```text
http://localhost:4040
```

## 5. Dung he thong

```powershell
docker compose down
```

Dung va xoa ca database volume:

```powershell
docker compose down -v
```

## 6. Ghi chu

- Mac dinh backend tao bang bang JPA voi `ddl-auto=update`.
- MySQL trong container dung database `electroshop`.
- Mac dinh khong expose MySQL ra may host, nen khong bi trung cong voi MySQL local cua nguoi khac.
- Backend ket noi MySQL bang mang noi bo Docker: `db:3306`.
- Neu khong dung ngrok, VNPAY Return URL/IPN se khong hoat dong tu sandbox internet.

## 7. Xem database neu can

Khong bat buoc phai dung MySQL Workbench de chay du an. Neu muon kiem tra database trong container, dung:

```powershell
docker compose exec db mysql -uroot -proot electroshop
```

Neu that su muon ket noi bang MySQL Workbench, tam thoi mo port bang lenh rieng:

```powershell
docker compose down
```

Sau do them cau hinh port vao `docker-compose.override.yml` tren may ca nhan:

```yaml
services:
  db:
    ports:
      - "3307:3306"
```

File override nay chi phuc vu debug ca nhan, khong bat buoc commit len Git.
