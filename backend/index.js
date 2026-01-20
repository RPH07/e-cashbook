require('dotenv').config();
const express = require('express');
const { sequelize } = require('./src/models'); // Memanggil "Manajer" database

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware agar backend bisa baca input JSON
app.use(express.json());

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