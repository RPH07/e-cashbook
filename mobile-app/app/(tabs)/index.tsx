import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LineChart } from "react-native-gifted-charts";
import { useTransaction, AuditLog } from '@/context/TransactionContext';

// TYPE BUAT CARD LOG
type LogCategory = 'data' | 'system';

export default function Dashboard() {
    const { transactions, userRole, userName, logs, setUserRole } = useTransaction();
    const screenWidth = Dimensions.get('window').width;

    // State buat Modal Log
    const [showLogModal, setShowLogModal] = useState(false);
    const [logCategory, setLogCategory] = useState<LogCategory>('data');

    // --- LOGIC LOGOUT ---
    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userName');
            if (router.canDismiss()) router.dismissAll();
            router.replace('/login');
        } catch (error) { console.error("Gagal logout:", error); }
    };

    // --- LOGIC HITUNG SALDO (Approved Only) ---
    const totalIncome = transactions
        .filter(t => t.type === 'pemasukan' && t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'pengeluaran' && t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // --- LOGIC STAFF TRACKER ---
    // Hitung berapa transaksi staff yg masih pending/ditolak
    const myPendingCount = transactions.filter(t => t.createdByRole === 'staff' && t.status === 'pending').length;
    const myRejectedCount = transactions.filter(t => t.createdByRole === 'staff' && t.status === 'rejected').length;

    // --- LOGIC FILTER LOG (ADMIN) ---
    const filteredLogs = logs.filter(log => {
        if (logCategory === 'data') {
            // Log Data: Create, Update, Delete
            return ['CREATE', 'UPDATE', 'DELETE'].includes(log.actionType);
        } else {
            // Log Sistem: Login, Export, Approve
            return ['LOGIN', 'EXPORT', 'APPROVE'].includes(log.actionType);
        }
    }); // Urutkan dari terbaru
    
    // Format Duit
    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    // Buka Modal Log
    const openLog = (category: LogCategory) => {
        setLogCategory(category);
        setShowLogModal(true);
    };

    // --- RENDER MENU ITEM (GRID) ---
    const renderMenuItem = (title: string, icon: any, color: string, bgColor: string, onPress: () => void) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.menuText}>{title}</Text>
        </TouchableOpacity>
    );

    // --- DATA GRAFIK DUMMY (Biar Tampilan Rame) ---
    const dataGrafik = [
        { value: 15, label: 'Sen' }, { value: 30, label: 'Sel' },
        { value: 26, label: 'Rab' }, { value: 40, label: 'Kam' },
        { value: 25, label: 'Jum' }, { value: 10, label: 'Sab' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a5dab" />
            
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View>
                        <Text style={styles.greeting}>Halo, {userName}</Text>
                        <Text style={styles.subtitle}>{userRole === 'admin' ? 'Administrator' : userRole === 'finance' ? 'Finance' : 'Staff Staff'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* --- TOTAL SALDO CARD --- */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Saldo (Real-Time)</Text>
                    <Text style={styles.balanceValue}>{formatMoney(balance)}</Text>

                    <View style={styles.rowSummary}>
                        <View style={styles.summaryItem}>
                            <View style={styles.summaryIconLabel}>
                                <Ionicons name="arrow-down-circle" size={20} color="#e8f5e9" />
                                <Text style={styles.summaryLabel}>Pemasukan</Text>
                            </View>
                            <Text style={styles.summaryValue}>{formatMoney(totalIncome)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <View style={styles.summaryIconLabel}>
                                <Ionicons name="arrow-up-circle" size={20} color="#ffebee" />
                                <Text style={styles.summaryLabel}>Pengeluaran</Text>
                            </View>
                            <Text style={styles.summaryValue}>{formatMoney(totalExpense)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* --- GRAFIK (Untuk Semua User) --- */}
                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Grafik Arus Kas</Text>
                    <LineChart
                        data={dataGrafik} color="#1a5dab" thickness={3}
                        dataPointsColor="#1a5dab" startFillColor="#1a5dab" endFillColor="#1a5dab"
                        startOpacity={0.2} endOpacity={0.0} areaChart curved hideRules
                        yAxisThickness={0} xAxisThickness={0} height={150} width={screenWidth - 80} 
                        initialSpacing={20} endSpacing={20} spacing={55}
                    />
                </View>

                {/* --- CONDITIONAL MENU BERDASARKAN ROLE --- */}

                {(userRole === 'admin' || userRole === 'finance') ? (
                    // === TAMPILAN ADMIN/FINANCE (MENU PENGAWASAN) ===
                    <>
                        <Text style={styles.sectionTitle}>Menu Pengawasan (Audit)</Text>
                        <View style={styles.grid}>
                            {renderMenuItem('Riwayat Perubahan', 'git-branch-outline', '#e65100', '#fff3e0', () => openLog('data'))}
                            {renderMenuItem('Log Aktivitas User', 'footsteps-outline', '#2e7d32', '#e8f5e9', () => openLog('system'))}
                            {renderMenuItem('Pusat Laporan', 'document-text-outline', '#1565c0', '#e3f2fd', () => router.push('/(tabs)/laporan'))}
                            {renderMenuItem('Manajemen Akun', 'people-outline', '#7b1fa2', '#f3e5f5', () => alert("Fitur manajemen user (Coming Soon)"))}
                        </View>
                    </>
                ) : (
                    // === TAMPILAN STAFF (STATUS TRACKER) ===
                    <>
                        <Text style={styles.sectionTitle}>Status Pengajuan Anda</Text>
                        
                        {/* Card Pending */}
                        <TouchableOpacity style={[styles.statusCard, {backgroundColor: '#fff9c4', borderColor:'#fff176'}]}>
                            <View style={styles.statusIconBox}>
                                <Ionicons name="time-outline" size={32} color="#f57f17" />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.statusTitle}>Menunggu Persetujuan</Text>
                                <Text style={styles.statusDesc}>Transaksi yang belum di-ACC Admin</Text>
                            </View>
                            <Text style={[styles.statusCount, {color: '#f57f17'}]}>{myPendingCount}</Text>
                        </TouchableOpacity>

                        {/* Card Rejected */}
                        <TouchableOpacity style={[styles.statusCard, {backgroundColor: '#ffebee', borderColor:'#ffcdd2', marginTop: 15}]}>
                            <View style={styles.statusIconBox}>
                                <Ionicons name="alert-circle-outline" size={32} color="#c62828" />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.statusTitle}>Ditolak / Revisi</Text>
                                <Text style={styles.statusDesc}>Transaksi yang perlu diperbaiki</Text>
                            </View>
                            <Text style={[styles.statusCount, {color: '#c62828'}]}>{myRejectedCount}</Text>
                        </TouchableOpacity>

                        <Text style={[styles.sectionTitle, {marginTop: 25}]}>Pintasan</Text>
                        <View style={styles.grid}>
                            {renderMenuItem('Input Pemasukan', 'arrow-down-circle', '#2e7d32', '#e8f5e9', () => router.push('/(tabs)/uang_masuk'))}
                            {renderMenuItem('Input Pengeluaran', 'arrow-up-circle', '#c62828', '#ffebee', () => router.push('/(tabs)/uang_keluar'))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* --- FAB (TOMBOL TAMBAH) --- */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/transaction/create')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* --- MODAL LOG VIEWER (POPUP CCTV) --- */}
            <Modal visible={showLogModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLogModal(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {logCategory === 'data' ? '📋 Riwayat Perubahan Data' : '👣 Log Aktivitas User'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowLogModal(false)}>
                            <Ionicons name="close-circle" size={30} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        data={filteredLogs}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{padding: 20}}
                        ListEmptyComponent={<Text style={{textAlign:'center', marginTop:50, color:'#aaa'}}>Belum ada aktivitas tercatat.</Text>}
                        renderItem={({item}) => (
                            <View style={styles.logCard}>
                                <View style={styles.logHeader}>
                                    <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                                        <Ionicons name="person-circle-outline" size={16} color="#555"/>
                                        <Text style={styles.logActor}>{item.actorName} <Text style={{fontWeight:'normal', fontSize:10}}>({item.actorRole})</Text></Text>
                                    </View>
                                    <Text style={styles.logTime}>
                                        {new Date(item.timestamp).toLocaleDateString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                                    </Text>
                                </View>
                                <View style={{flexDirection:'row', alignItems:'center', marginTop:5}}>
                                    <View style={[styles.badge, {backgroundColor: item.actionType === 'DELETE' || item.actionType === 'REJECT' ? '#ffebee' : '#e3f2fd'}]}>
                                        <Text style={{fontSize:10, fontWeight:'bold', color: item.actionType === 'DELETE' ? '#c62828' : '#1565c0'}}>
                                            {item.actionType}
                                        </Text>
                                    </View>
                                    <Text style={styles.logTarget}>{item.target}</Text>
                                </View>
                                <Text style={styles.logDetails}>{item.details}</Text>
                            </View>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        backgroundColor: '#1a5dab', padding: 20, paddingTop: 50,
        borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
        paddingBottom: 40, marginBottom: -20, zIndex: 1
    },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 18, color: '#e3f2fd' },
    subtitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    balanceCard: {
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 15, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
    },
    balanceLabel: { color: '#e3f2fd', fontSize: 14, marginBottom: 5 },
    balanceValue: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    rowSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 15 },
    summaryItem: { gap: 5 },
    summaryIconLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    summaryLabel: { color: '#e3f2fd', fontSize: 12 },
    summaryValue: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    content: { padding: 20, paddingTop: 30, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    chartContainer: {
        backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 25,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuItem: {
        width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 15,
        alignItems: 'center', marginBottom: 15, elevation: 2
    },
    iconBox: {
        width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10
    },
    menuText: { fontSize: 14, fontWeight: '600', color: '#555', textAlign: 'center' },
    fab: {
        position: 'absolute', bottom: 30, right: 30, width: 60, height: 60,
        borderRadius: 30, backgroundColor: '#1a5dab', justifyContent: 'center', alignItems: 'center', elevation: 5
    },
    
    // STYLE STAFF TRACKER
    statusCard: {
        flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12,
        borderWidth: 1, gap: 15
    },
    statusIconBox: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
    statusTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    statusDesc: { fontSize: 12, color: '#666' },
    statusCount: { fontSize: 24, fontWeight: 'bold' },

    // STYLE MODAL LOG
    modalContainer: { flex: 1, backgroundColor: '#f0f2f5' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    logCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    logActor: { fontWeight: 'bold', fontSize: 14, color: '#333' },
    logTime: { fontSize: 12, color: '#888' },
    logTarget: { fontSize: 12, fontWeight: 'bold', marginLeft: 8, color: '#555' },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    logDetails: { marginTop: 8, fontSize: 13, color: '#444', fontStyle: 'italic', borderLeftWidth: 2, borderLeftColor: '#eee', paddingLeft: 8 }
});