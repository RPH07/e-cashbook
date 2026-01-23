import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LineChart } from "react-native-gifted-charts";
import { useTransaction } from '@/context/TransactionContext';

export default function Dashboard() {
    const { transactions, userRole } = useTransaction();
    const screenWidth = Dimensions.get('window').width;

    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');

            if (router.canDismiss()) {
                router.dismissAll();
            }
            router.replace('/login');

        } catch (error) {
            console.error("Gagal logout:", error);
        }
    };

    const totalIncome = transactions
        .filter(t => t.type === 'pemasukan' && t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'pengeluaran' && t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(val);
    };

    // --- DATA DUMMY GRAFIK ---
    const dataGrafik = [
        { value: 15, label: 'Sen' }, { value: 30, label: 'Sel' },
        { value: 26, label: 'Rab' }, { value: 40, label: 'Kam' },
        { value: 25, label: 'Jum' }, { value: 10, label: 'Sab' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a5dab" />
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View>
                        <Text style={styles.greeting}>Halo, {userRole ? userRole.toUpperCase() : 'USER'}</Text>
                        <Text style={styles.subtitle}>Selamat datang kembali!</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Saldo (Approved)</Text>
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

                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Grafik Minggu Ini</Text>
                    <LineChart
                        data={dataGrafik}
                        color="#1a5dab"
                        thickness={3}
                        dataPointsColor="#1a5dab"
                        startFillColor="#1a5dab"
                        endFillColor="#1a5dab"
                        startOpacity={0.2}
                        endOpacity={0.0}
                        areaChart
                        curved
                        hideRules
                        yAxisThickness={0}
                        xAxisThickness={0}
                        height={180}
                        width={screenWidth - 80} 
                        initialSpacing={20}
                        endSpacing={20}
                        spacing={55}
                    />
                </View>

                <Text style={styles.sectionTitle}>Menu Utama</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/uang_masuk')}>
                        <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="wallet-outline" size={28} color="#2e7d32" />
                        </View>
                        <Text style={styles.menuText}>Uang Masuk</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/uang_keluar')}>
                        <View style={[styles.iconBox, { backgroundColor: '#ffebee' }]}>
                            <Ionicons name="card-outline" size={28} color="#c62828" />
                        </View>
                        <Text style={styles.menuText}>Uang Keluar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/laporan')}>
                        <View style={[styles.iconBox, { backgroundColor: '#e3f2fd' }]}>
                            <Ionicons name="bar-chart-outline" size={28} color="#1565c0" />
                        </View>
                        <Text style={styles.menuText}>Laporan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => alert('Fitur Profile Coming Soon')}>
                        <View style={[styles.iconBox, { backgroundColor: '#f3e5f5' }]}>
                            <Ionicons name="person-outline" size={28} color="#7b1fa2" />
                        </View>
                        <Text style={styles.menuText}>Akun Saya</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {(userRole === 'admin' || userRole === 'staff' || userRole === 'finance') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/transaction/create')}
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        backgroundColor: '#1a5dab',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 40,
        marginBottom: -20, 
        zIndex: 1
    },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 18, color: '#e3f2fd' },
    subtitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },

    balanceCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    balanceLabel: { color: '#e3f2fd', fontSize: 14, marginBottom: 5 },
    balanceValue: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    rowSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 15 },
    summaryItem: {
        flexDirection: 'column',  
        alignItems: 'flex-start',
        gap: 8
    },
    summaryIconLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    summaryLabel: { color: '#e3f2fd', fontSize: 12 },
    summaryValue: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 0 
    },

    content: { padding: 20, paddingTop: 30 }, 
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },

    chartContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25, 
        elevation: 3,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
        overflow: 'hidden'
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuItem: {
        width: '48%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
    },
    iconBox: {
        width: 50, height: 50, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center', marginBottom: 10
    },
    menuText: { fontSize: 14, fontWeight: '600', color: '#555' },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1a5dab',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#1a5dab', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4
    }
});