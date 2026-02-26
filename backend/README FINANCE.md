## Install Dependencies
```composer install

## Copy env.example dan ubah menjadi env
cp .env.example .env
php artisan key:generate

## Migrate database dan seeder
php artisan migrate --seed

## Mulai Server
php artisan serve


## Config Env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=e_cashbook_db
DB_USERNAME=root
DB_PASSWORD=your_password_database


## Struktur API
content-type : application/json
authorization: bearer <your_sanctum_token>

1. Authentication (/api)
Method: POST
Endpoint: /login
Fungsi: Masuk ke sistem & dapatkan token

2. Transaction (/api/transactions)
Method:POST
Endpoint: /
Fungsi: Input transaksi baru (status: pending)
Izin Role: Semua User

Method:GET
Endpoint:/
Fungsi: List semua transaksi
Izin Role: Semua User

Method:PUT
Endpoint: /{:id}
Fungsi: Update data transaksi
Izin Role: Owner / Admin

Method:PATCH
Endpoint: /{:id}/approve
Fungsi: Menyetujui transaksi & update saldo
Izin Role: "Admin, Auditor"

Method:PATCH
Endpoint: /{:id}/reject
Fungsi: Menolak transaksi
Izin Role: "Admin, Auditor"

Method:PATCH
Endpoint: /{:id}/void
Fungsi: Membatalkan transaksi & kembalikan saldo
Izin Role: "Admin, Finance"

Method:DELETE
Endpoint: /{:id}
Fungsi: Menghapus data transaksi
Izin Role: "Admin, Finance"

3. Reports & Audit (/api)
Method,Endpoint,Fungsi,Izin Role
Method: GET
Endpoint: /dashboard,
Fungsi: Ringkasan total saldo & saldo per akun,
Izin Role: Semua User

Method: GET
Endpoint: /audit-logs
Fungsi: Riwayat aktivitas sistem (logs)
izin role: "Admin, Auditor"
