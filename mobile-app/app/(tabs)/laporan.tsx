import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTransaction } from '@/context/TransactionContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export default function LaporanScreen() {
  // Ambil data mentah dari Context
  const { transactions, userRole, userName, recordLog } = useTransaction();

  // State buat nyimpen filter waktu yang lagi aktif
  const [filterMode, setFilterMode] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

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

    transactions.forEach(t => {
      if(t.status !== 'approved') return;
      const tDate = new Date(t.date);

      if (t.type === 'transfer') return;

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
      if (t.status !== 'approved') return;
      // Normalisasi nama akun biar 'Giro' sama 'giro' dianggap satu akun
      const accName = t.account.charAt(0).toUpperCase() + t.account.slice(1);
      if (!balances[accName]) balances[accName] = 0;
      // tambah/kurang saldo sesuai tipe
      if (t.type === 'pemasukan') balances[accName] += t.amount;
      else balances[accName] -= t.amount;
    });

    return balances;
  }, [transactions]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(val);
  };

  // label tanggal di header (Januari 2026 atau 2026)
  const periodLabel = filterMode === 'bulanan'
    ? selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : selectedDate.getFullYear().toString();

  const generatePDF = async () => {
    setExportingPDF(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      if (filterMode === 'bulanan') {
          startDate.setDate(1); startDate.setHours(0,0,0,0);
          endDate.setMonth(endDate.getMonth() + 1); endDate.setDate(0); endDate.setHours(23,59,59,999);
      } else {
          startDate.setMonth(0, 1); startDate.setHours(0,0,0,0);
          endDate.setMonth(11, 31); endDate.setHours(23,59,59,999);
      }

      
      const statementTransactions = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            const isApproved = t.status === 'approved';
            const inRange = tDate >= startDate && tDate <= endDate;
            return isApproved && inRange;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


      // logic saldo berjalan
      let runningBalance = reportData.beginningBalance;
      
      const tableRows = statementTransactions.map(t => {
          const isCredit = t.type === 'pemasukan';
          const isDebit = t.type === 'pengeluaran';
          
          if (isCredit) runningBalance += t.amount;
          else runningBalance -= t.amount;

          const dateObj = new Date(t.date);
          const dateStr = dateObj.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'});
          
          const accountName = t.account || (t as any).accountName || 'Tanpa Akun';
          const accountBadgeColor = accountName.toLowerCase().includes('giro') ? '#e3f2fd' : '#fff3e0'; 
          const accountTextColor = accountName.toLowerCase().includes('giro') ? '#1565c0' : '#e65100';

          return `
            <tr>
              <td style="text-align: left;">
                <div style="font-weight: bold;">${dateStr}</div>
              </td>
              <td style="text-align: left;">
                <div style="font-weight: bold;">${t.category}</div>
                <div style="font-size: 10px; color: #666;">${t.note || '-'}</div>
                <div style="font-size: 9px; color: #888; margin-top: 2px;">Ref: ${t.id.substring(0,8).toUpperCase()}</div>
              </td>
              <td style="text-align: center; vertical-align: middle;">
                <div style="
                  background-color: ${accountBadgeColor}; 
                  color: ${accountTextColor}; 
                  padding: 6px 10px; 
                  border-radius: 6px; 
                  font-size: 9px; 
                  font-weight: bold; 
                  line-height: 1.3;
                  display: inline-block;
                  max-width: 100%;
                  word-wrap: break-word;
                  text-align: center;
                ">
                  ${accountName.toUpperCase()}
                </div>
              </td>
              <td style="text-align: right; color: #c62828;">${isDebit ? formatMoney(t.amount) : 'Rp0'}</td>
              <td style="text-align: right; color: #2e7d32;">${isCredit ? formatMoney(t.amount) : 'Rp0'}</td>
              <td style="text-align: right; font-weight: bold;">${formatMoney(runningBalance)}</td>
            </tr>
          `;
      }).join('');

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #333; font-size: 11px; }
              
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1a5dab; padding-bottom: 10px; }
              .brand { color: #1a5dab; font-size: 24px; font-weight: bold; display: flex; align-items: center; }
              .brand span { color: #1a5dab; margin-left: 5px; }
              
              .report-info { text-align: right; }
              .report-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 5px; text-transform: uppercase; }
              
              .info-box { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }
              .info-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
              .info-value { font-size: 14px; font-weight: bold; color: #333; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              
              th { background-color: #1a5dab; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
              
              td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
              tr:nth-child(even) { background-color: #fafafa; }
              
              .summary-section { margin-top: 20px; display: flex; justify-content: flex-end; }
              .summary-table { width: 300px; }
              .summary-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ccc; }
              .summary-total { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; margin-top: 5px; font-weight: bold; font-size: 14px; }
              
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">E-CASH<span>BOOK</span></div>
              <div class="report-info">
                <div class="report-title">Laporan Rekening</div>
                <div>Periode: ${periodLabel}</div>
              </div>
            </div>

            <div class="info-box">
              <div>
                <div class="info-label">Nama Pemilik</div>
                <div class="info-value">${userName.toUpperCase()}</div>
                <div class="info-label" style="margin-top: 10px;">Role / Jabatan</div>
                <div class="info-value" style="text-transform: capitalize;">${userRole}</div>
              </div>
              <div style="text-align: right;">
                  <div class="info-label">Saldo Awal (Beginning Balance)</div>
                  <div class="info-value" style="font-size: 16px;">${formatMoney(reportData.beginningBalance)}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th width="12%">Tanggal</th>
                  <th width="28%">Uraian Transaksi</th>
                  <th width="15%" style="text-align: center;">Akun</th>
                  <th width="15%" style="text-align: right;">Debit</th> 
                  <th width="15%" style="text-align: right;">Kredit</th>
                  <th width="15%" style="text-align: right;">Saldo</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows.length > 0 ? tableRows : '<tr><td colspan="6" style="text-align:center; padding: 20px;">Tidak ada transaksi pada periode ini.</td></tr>'}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-table">
                <div class="summary-row">
                    <span>Mutasi Debit (-)</span>
                    <span style="color: #c62828;">${formatMoney(reportData.expense)}</span>
                </div>
                <div class="summary-row">
                    <span>Mutasi Kredit (+)</span>
                    <span style="color: #2e7d32;">${formatMoney(reportData.income)}</span>
                </div>
                <div class="summary-total">
                    <span>Saldo Akhir</span>
                    <span>${formatMoney(reportData.endingBalance)}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>Dokumen ini diterbitkan secara elektronik oleh sistem E-CashBook dan sah tanpa tanda tangan basah.</p>
              <p>Dicetak pada: ${new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </body>
        </html>
      `;
      const fileName = filterMode === 'bulanan'
        ? `laporan_keuangan_${selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/ /g, '_').toLowerCase()}.pdf`
        : `laporan_keuangan_${selectedDate.getFullYear()}.pdf`;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Copy dengan nama yang benar
      const finalFile = new FileSystem.File(FileSystem.Paths.cache, fileName);
      const tempFile = new FileSystem.File(uri);
      
      // Hapus file lama jika ada untuk avoid konflik
      if (finalFile.exists) {
        await finalFile.delete();
      }
      
      await tempFile.copy(finalFile);
      
      recordLog('EXPORT', 'Menu Laporan', `Cetak Laporan PDF (Periode: ${periodLabel})`);
      await Sharing.shareAsync(finalFile.uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf'
      });
    } catch (error) {
      Alert.alert("Gagal", "Tidak bisa membuat PDF: " + error);
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToExcel = async () => {
    setExportingExcel(true);
    try {
      // Filter transaksi berdasarkan periode
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);

      if (filterMode === 'bulanan') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
      }

      const filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      });

      // Sheet 1: Ringkasan
      const summaryData = [
        ['LAPORAN KEUANGAN'],
        [`Periode: ${periodLabel}`],
        [''],
        ['Ringkasan Mutasi Kas'],
        ['Saldo Awal', reportData.beginningBalance],
        ['(+) Total Pemasukan', reportData.income],
        ['(-) Total Pengeluaran', reportData.expense],
        ['Saldo Akhir', reportData.endingBalance],
        [''],
        ['Pengeluaran Terbesar'],
        ['Kategori', 'Jumlah', 'Persentase'],
        ...reportData.topExpenses.map(cat => [
          cat.name,
          cat.total,
          `${cat.percentage.toFixed(1)}%`
        ]),
        [''],
        ['Posisi Saldo Per Akun'],
        ['Akun', 'Saldo'],
        ...Object.keys(accountBalances).map(acc => [
          acc,
          accountBalances[acc]
        ])
      ];

      // Sheet 2: Detail Transaksi
      const transactionData = [
        ['Tanggal', 'Tipe', 'Kategori', 'Akun', 'Jumlah', 'Catatan', 'Status'],
        ...filteredTransactions.map(t => [
          new Date(t.date).toLocaleDateString('id-ID'),
          t.type,
          t.category,
          t.account,
          t.amount,
          t.note || '',
          t.status
        ])
      ];

      // Buat workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      const ws2 = XLSX.utils.aoa_to_sheet(transactionData);
      
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');
      XLSX.utils.book_append_sheet(wb, ws2, 'Detail Transaksi');

      // Generate file sebagai array
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const fileName = `laporan_${periodLabel.replace(/ /g, '_').toLowerCase()}.xlsx`;
      
      const file = new FileSystem.File(FileSystem.Paths.cache, fileName);
      
      // Hapus file lama jika ada untuk avoid konflik
      if (file.exists) {
        await file.delete();
      }
      
      recordLog('EXPORT', 'Menu Laporan', `Cetak Laporan Excel (Periode: ${periodLabel})`);
      
      // Write menggunakan ArrayBuffer
      const uint8Array = new Uint8Array(wbout);
      await file.write(uint8Array);
      
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } catch (error) {
      Alert.alert('Gagal', 'Tidak bisa membuat file Excel: ' + error);
    } finally {
      setExportingExcel(false);
    }
  };

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
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={generatePDF}
          disabled={exportingPDF || exportingExcel}
        >
          {exportingPDF ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.pdfText}>Unduh PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.excelButton}
          onPress={exportToExcel}
          disabled={exportingPDF || exportingExcel}
        >
          {exportingExcel ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="grid-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.pdfText}>Unduh Excel</Text>
            </>
          )}
        </TouchableOpacity>

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="arrow-down-circle" size={16} color="#2e7d32" style={{ marginRight: 5 }} />
              <Text style={styles.flowLabel}>Pemasukan</Text>
            </View>
            <Text style={[styles.flowValue, { color: '#2e7d32' }]}>+ {formatMoney(reportData.income)}</Text>
          </View>

          {/* Mutasi Keluar */}
          <View style={styles.flowRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="arrow-up-circle" size={16} color="#c62828" style={{ marginRight: 5 }} />
              <Text style={styles.flowLabel}>Pengeluaran</Text>
            </View>
            <Text style={[styles.flowValue, { color: '#c62828' }]}>- {formatMoney(reportData.expense)}</Text>
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
  pdfButton: {
    backgroundColor: '#1a5dab', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 15, borderRadius: 10, marginBottom: 12, elevation: 3
  },
  excelButton: {
    backgroundColor: '#2e7d32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 15, borderRadius: 10, marginBottom: 20, elevation: 3
  },
  pdfText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
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