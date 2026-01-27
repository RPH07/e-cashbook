require('dotenv').config();
const express = require('express');
const { sequelize } = require('./src/models'); // Memanggil "Manajer" database
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoute');
const reportRoutes = require('./src/routes/reportRoute');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Mengaktifkan CORS
app.use(cors());

// Middleware agar backend bisa baca input JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk logging body request (untuk debugging)
app.use((req, res, next) => {
  console.log('--- BODY AFTER JSON PARSER ---');
  console.log(req.body);
  next();
});

// Rute debug untuk menampilkan headers dan body request
app.post('/_debug', (req, res) => {
  res.json({
    headers: req.headers,
    body: req.body
  });
});

// Rute Auth
app.use('/api/auth', authRoutes);

// Rute Transaksi
app.use('/api/transactions', transactionRoutes);

// Rute Report
app.use('/api/reports', reportRoutes);

// Tes rute utama
app.get('/', (req, res) => {
  res.send('Backend E-Cashbook: Server & Database Connected!');
});

// Fungsi untuk cek koneksi DB & jalankan server
const startServer = async () => {
  try {
    // 1. Tes koneksi ke database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    // 2. Jalankan server setelah DB aman
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();