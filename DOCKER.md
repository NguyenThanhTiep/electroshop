# Chay ElectroShop bang Docker

Tai lieu nay dung de nguoi khac clone/pull du an ve va chay duoc frontend, backend, MySQL va tuy chon ngrok.

## 1. Chuan bi

Can cai:

- Docker Desktop
- Docker Compose

Neu chi chay web local, khong can tao `.env`. Chay truc tiep:

```powershell
docker compose up --build
```

Chi can tao `.env` khi muon cau hinh VNPAY/ngrok hoac doi cong frontend/backend:

```powershell
copy .env.docker.example .env
```

## 2. Chay BE, FE va MySQL

```powershell
docker compose up --build
```

Sau khi chay xong:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
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

## 4. Chay kem ngrok cho VNPAY

VNPAY can Return URL/IPN truy cap duoc tu internet. Cach on dinh nhat la dung static domain cua ngrok.

Trong file `.env`, dien:

```env
VNPAY_TMN_CODE=TMN_CODE_VNPAY_CAP
VNPAY_HASH_SECRET=HASH_SECRET_VNPAY_CAP
NGROK_AUTHTOKEN=AUTHTOKEN_NGROK_CUA_BAN
NGROK_DOMAIN=your-domain.ngrok-free.app
PUBLIC_BASE_URL=https://your-domain.ngrok-free.app
FRONTEND_URL=http://localhost:5173
```

Chay day du profile ngrok:

```powershell
docker compose --profile ngrok up --build
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
