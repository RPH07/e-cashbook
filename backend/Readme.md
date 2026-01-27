## Install Dependencies
```npm install

## Config Env
PORT=5000
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=e_cashbook_db
DB_HOST=127.0.0.1
DB_DIALECT=mysql
JWT_SECRET=super_secret_key_123

## Database setup
PORT=5000
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=e_cashbook_db
DB_HOST=127.0.0.1
DB_DIALECT=mysql
JWT_SECRET=super_secret_key_123

## Struktur API
content-type : application/json
authorization: bearer <your_jwt_token>

1. Authentication (/api/auth)
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
Endpoint: /:id
Fungsi: Update data transaksi
Izin Role: Owner / Admin

Method:PATCH
Endpoint: /:id/approve
Fungsi: Menyetujui transaksi & update saldo
Izin Role: "Admin, Auditor"

Method:PATCH
Endpoint: /:id/reject
Fungsi: Menolak transaksi
Izin Role: "Admin, Auditor"

Method:PATCH
Endpoint: /:id/void
Fungsi: Membatalkan transaksi & kembalikan saldo
Izin Role: "Admin, Finance"

Method:DELETE
Endpoint: /:id
Fungsi: Menghapus data transaksi
Izin Role: "Admin, Finance"

3. Reports & Audit (/api/reports)
Method,Endpoint,Fungsi,Izin Role
Method: GET
Endpoint: /dashboard,
Fungsi: Ringkasan total saldo & saldo per akun,
Izin Role: Semua User

Method: GET
Endpoint: /audit-logs
Fungsi: Riwayat aktivitas sistem (logs)
izin role: "Admin, Auditor"
