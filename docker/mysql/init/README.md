# MySQL init scripts

Dat file `.sql` cua database ElectroShop vao thu muc nay neu muon Docker tu import du lieu mau.

Luu y:
- Cac file `.sql` chi duoc MySQL image chay trong lan khoi tao volume database dau tien.
- Neu da chay container truoc do va muon import lai tu dau, dung:

```powershell
docker compose down -v
docker compose up --build
```

Backend se tu tao tai khoan admin mac dinh neu chua co:

```text
email: admin@gmail.com
password: admin
```
