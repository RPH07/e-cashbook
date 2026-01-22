import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTransaction } from '@/context/TransactionContext';

export default function LaporanScreen() {
  // Ambil data mentah dari Context
  const { transactions } = useTransaction();
  
  // State buat nyimpen filter waktu yang lagi aktif
  const [filterMode, setFilterMode] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pas user pilih Tanggal di kalender
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  // Logic buat tombol panah kiri/kanan (< >)
  const changePeriod = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    if (filterMode === 'bulanan') {
      // Geser bulan (Maju/Mundur 1 bulan)
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      // Geser tahun (Maju/Mundur 1 tahun)
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  // --- LOGIC 1: HITUNG FLOW MUTASI (CORE) ---
  // Kita butuh misahin: Transaksi masa lalu (Saldo Awal) vs Transaksi periode ini
  const reportData = useMemo(() => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);

    // 1. Tentukan batas awal & akhir tanggal sesuai mode filter
    if (filterMode === 'bulanan') {
      startDate.setDate(1); // Mulai tanggal 1
      startDate.setHours(0, 0, 0, 0); // Reset jam ke 00:00
      
      endDate.setMonth(endDate.getMonth() + 1); // Loncat ke bulan depan...
      endDate.setDate(0); // ...terus mundur sehari (jadi tanggal terakhir bulan ini)
      endDate.setHours(23, 59, 59, 999); // Mentok jam 23:59
    } else {
      // Mode Tahunan: 1 Jan - 31 Des
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
    }

    // Variabel penampung sementara
    let beginningBalance = 0;
    let income = 0;
    let expense = 0;
    const expenseByCategory: Record<string, number> = {};

    // 2. Loop semua transaksi buat dipilah-pilah
    transactions.forEach(t => {
      const tDate = new Date(t.date);

      // Kalo transaksinya SEBELUM tanggal awal -> Masuk ke Saldo Awal
      if (tDate < startDate) {
        if (t.type === 'pemasukan') beginningBalance += t.amount;
        else beginningBalance -= t.amount;
      }
      // Kalo transaksinya DALAM range tanggal -> Hitung sebagai Mutasi (Masuk/Keluar)
      else if (tDate >= startDate && tDate <= endDate) {
        if (t.type === 'pemasukan') {
          income += t.amount;
        } else {
          expense += t.amount;
          // Catat kategori pengeluaran buat grafik nanti
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
      }
    });

    // Rumus Akuntansi: Saldo Akhir = Saldo Awal + Masuk - Keluar
    const endingBalance = beginningBalance + income - expense;

    // 3. Urutin pengeluaran dari yang paling boncos (Top 5)
    const sortedCategories = Object.keys(expenseByCategory)
      .map(cat => ({
        name: cat,
        total: expenseByCategory[cat],
        percentage: expense > 0 ? (expenseByCategory[cat] / expense) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total) // Sort Descending
      .slice(0, 5); // Ambil 5 teratas aja

    return {
      beginningBalance,
      income,
      expense,
      endingBalance,
      netFlow: income - expense, // Surplus atau Defisit
      topExpenses: sortedCategories
    };
  }, [transactions, selectedDate, filterMode]); // Re-calc cuma kalo data/filter berubah

  // --- logic ke 2, cek posisi saldo realtime ---
  // ini hitung saldo total per akun (Giro/Tabungan) TANPA filter tanggal
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    transactions.forEach(t => {
        // Normalisasi nama akun biar 'Giro' sama 'giro' dianggap satu akun
        const accName = t.account.charAt(0).toUpperCase() + t.account.slice(1); 
        
        if (!balances[accName]) balances[accName] = 0;
        
        // tambah/kurang saldo sesuai tipe
        if (t.type === 'pemasukan') balances[accName] += t.amount;
        else balances[accName] -= t.amount;
    });
    
    return balances;
  }, [transactions]);


  // Helper buat format Rupiah biar cantik
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(val);
  };

  // label tanggal di header (Januari 2026 atau 2026)
  const periodLabel = filterMode === 'bulanan' 
    ? selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : selectedDate.getFullYear().toString();

  return (
    <View style={styles.container}>
      {/* --- HEADER SECTION --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Keuangan</Text>
        
        {/* Toggle Bulanan / Tahunan */}
        <View style={styles.switchContainer}>
          <TouchableOpacity 
            style={[styles.switchBtn, filterMode === 'bulanan' && styles.switchActive]}
            onPress={() => setFilterMode('bulanan')}
          >
            <Text style={[styles.switchText, filterMode === 'bulanan' && styles.switchTextActive]}>Bulanan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.switchBtn, filterMode === 'tahunan' && styles.switchActive]}
            onPress={() => setFilterMode('tahunan')}
          >
            <Text style={[styles.switchText, filterMode === 'tahunan' && styles.switchTextActive]}>Tahunan</Text>
          </TouchableOpacity>
        </View>

        {/* Navigator Tanggal (< Januari 2026 >) */}
        <View style={styles.timeNav}>
          <TouchableOpacity onPress={() => changePeriod(-1)} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTrigger}>
            <Ionicons name="calendar-outline" size={18} color="#1a5dab" style={{ marginRight: 8 }} />
            <Text style={styles.dateLabel}>{periodLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changePeriod(1)} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* CARD 1: POSISI SALDO (Giro, Tabungan, dll) */}
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Posisi Saldo (Real-Time)</Text>
                <Ionicons name="wallet-outline" size={20} color="#666" />
            </View>
            <View style={styles.balanceList}>
                {Object.keys(accountBalances).length > 0 ? (
                Object.keys(accountBalances).map((acc) => (
                    <View key={acc} style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>{acc}</Text>
                    <Text style={[
                        styles.balanceValue, 
                        { color: accountBalances[acc] >= 0 ? '#333' : '#c62828' }
                    ]}>
                        {formatMoney(accountBalances[acc])}
                    </Text>
                    </View>
                ))
                ) : (
                <Text style={{ color: '#aaa', fontStyle: 'italic' }}>Belum ada data akun</Text>
                )}
            </View>
        </View>

        {/* CARD 2: REKAP ARUS KAS (Tabel Mutasi) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rekap Arus Kas</Text>
          
          {/* Saldo Awal */}
          <View style={styles.flowRow}>
            <Text style={styles.flowLabel}>Saldo Awal</Text>
            <Text style={styles.flowValue}>{formatMoney(reportData.beginningBalance)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Mutasi Masuk */}
          <View style={styles.flowRow}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name="arrow-down-circle" size={16} color="#2e7d32" style={{marginRight:5}} />
                <Text style={styles.flowLabel}>Pemasukan</Text>
            </View>
            <Text style={[styles.flowValue, {color: '#2e7d32'}]}>+ {formatMoney(reportData.income)}</Text>
          </View>

          {/* Mutasi Keluar */}
          <View style={styles.flowRow}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name="arrow-up-circle" size={16} color="#c62828" style={{marginRight:5}} />
                <Text style={styles.flowLabel}>Pengeluaran</Text>
            </View>
            <Text style={[styles.flowValue, {color: '#c62828'}]}>- {formatMoney(reportData.expense)}</Text>
          </View>

          {/* Garis Penutup Tabel */}
          <View style={[styles.divider, { backgroundColor: '#333', height: 1.5, marginVertical: 10 }]} />

          {/* Saldo Akhir */}
          <View style={styles.flowRow}>
            <Text style={[styles.flowLabel, { fontWeight: 'bold', fontSize: 16 }]}>Saldo Akhir</Text>
            <Text style={[
                styles.flowValue, 
                { fontWeight: 'bold', fontSize: 16, color: reportData.endingBalance >= 0 ? '#333' : '#c62828' }
            ]}>
                {formatMoney(reportData.endingBalance)}
            </Text>
          </View>
          
          <Text style={styles.flowSubtext}>
              {reportData.netFlow >= 0 ? 'Surplus' : 'Defisit'} {formatMoney(Math.abs(reportData.netFlow))} periode ini
          </Text>
        </View>

        {/* CARD 3: GRAFIK PENGELUARAN (Progress Bar) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pengeluaran Terbesar</Text>
          {reportData.topExpenses.length > 0 ? (
            reportData.topExpenses.map((cat, index) => (
              <View key={index} style={styles.progressRow}>
                {/* Nama & Nominal */}
                <View style={styles.catRow}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catAmount}>{formatMoney(cat.total)}</Text>
                </View>
                {/* Bar Merah */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${cat.percentage}%` }]} />
                </View>
                {/* Persentase */}
                <Text style={styles.percentText}>{cat.percentage.toFixed(1)}%</Text>
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#aaa' }}>Belum ada pengeluaran periode ini</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pop-up Kalender Native */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
      backgroundColor: 'white',
      padding: 20,
      paddingTop: (StatusBar.currentHeight || 0) + 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      alignItems: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    switchContainer: {
      flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 25,
      padding: 4, width: '80%', marginBottom: 15
    },
    switchBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
    switchActive: { backgroundColor: 'white', elevation: 2 },
    switchText: { color: '#888', fontWeight: '600' },
    switchTextActive: { color: '#333', fontWeight: 'bold' },
    timeNav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10
    },
    navArrow: { padding: 10 },
    dateTrigger: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd',
      paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    },
    dateLabel: { color: '#1a5dab', fontWeight: 'bold', fontSize: 16 },
  
    card: {
      backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 15,
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    
    balanceList: { gap: 10 },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    balanceLabel: { fontSize: 15, color: '#555' },
    balanceValue: { fontSize: 15, fontWeight: 'bold' },
  
    flowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    flowLabel: { fontSize: 14, color: '#555' },
    flowValue: { fontSize: 14, fontWeight: '600', color: '#333' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
    flowSubtext: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 10, fontStyle: 'italic' },
  
    progressRow: { marginBottom: 15 },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    catName: { fontSize: 14, fontWeight: '500', color: '#333' },
    catAmount: { fontSize: 14, fontWeight: 'bold', color: '#555' },
    progressBarTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 2 },
    progressBarFill: { height: '100%', backgroundColor: '#c62828', borderRadius: 4 },
    percentText: { fontSize: 10, color: '#999', textAlign: 'right' }
});