import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-gifted-charts";
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

type TipeSaldo = 'Total' | 'Tabungan' | 'Giro';
type UserRole = 'admin' | 'bendahara' | 'auditor' | 'viewer';
export default function Dashboard() {
    // State buat nyimpen pilihan user
    const [selectedSaldo, setSelectedSaldo] = useState<TipeSaldo>('Total');
    const [userRole, setUserRole] = useState<UserRole>('viewer');
    const [isDropdownOpen, setDropdownOpen] = useState(false);
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

    // Data Dummy Saldo
    const saldoData: Record<TipeSaldo, string> = {
        'Total': 'Rp 125.450.000',
        'Tabungan': 'Rp 75.000.000',
        'Giro': 'Rp 50.450.000'
    };

    // Fungsi pas user milih opsi
    const handleSelect = (jenis: TipeSaldo) => {
        setSelectedSaldo(jenis);
        setDropdownOpen(false);
    };

    // Data Dummy Grafik 
    const dataGrafik = [
        { value: 15, label: 'Sen' }, { value: 30, label: 'Sel' },
        { value: 26, label: 'Rab' }, { value: 40, label: 'Kam' },
        { value: 25, label: 'Jum' }, { value: 10, label: 'Sab' },
    ];

    useEffect(() => {
        const loadRole = async () =>{
            const storedRole = await SecureStore.getItemAsync('userRole');
            if(storedRole) {
                setUserRole(storedRole as UserRole);
            }
        };
        loadRole();
    }, [])

    return (
        <View style={{flex: 1}}>
            <ScrollView style={styles.container}>
                {/* Header Area */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>E-CashBook</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity 
                            onPress={() => alert('Todo: Buat fitur Notifikasi')}
                        >
                            <Ionicons name="notifications-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardMain}>

                    {/* Tombol Dropdown */}
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setDropdownOpen(!isDropdownOpen)}
                    >
                        <Text style={styles.label}>Saldo {selectedSaldo}</Text>
                        <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#555" />
                    </TouchableOpacity>

                    {/* Menu Dropdown */}
                    {isDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                            {(['Total', 'Tabungan', 'Giro'] as TipeSaldo[]).map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.dropdownItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={{ fontWeight: item === selectedSaldo ? 'bold' : 'normal', color: '#333' }}>
                                        Saldo {item}
                                    </Text>
                                    {item === selectedSaldo && <Ionicons name="checkmark" size={16} color="green" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Angka Saldo Berubah Sesuai Pilihan */}
                    <Text style={styles.amount}>{saldoData[selectedSaldo]}</Text>
                    <Text style={styles.subLabel}>
                        {selectedSaldo === 'Total' ? 'Total Akumulasi' : `Rekening ${selectedSaldo}`}
                    </Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.summaryBox}>
                        <Text style={{ color: 'green' }}>Uang Masuk</Text>
                        <Text style={styles.summaryAmount}>Rp 45.200.000</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={{ color: 'red' }}>Uang Keluar</Text>
                        <Text style={styles.summaryAmount}>Rp 32.850.000</Text>
                    </View>
                </View>

                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Grafik Arus Kas</Text>
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
                        height={200}
                        width={screenWidth - 80}
                        initialSpacing={20}
                        endSpacing={20}
                        spacing={60}
                    />
                </View>

            </ScrollView>
            {(userRole === 'admin' || userRole === 'bendahara') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => alert("Halaman Tambah Transaksi")}
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        backgroundColor: '#1a5dab',
        padding: 20,
        paddingTop: (StatusBar.currentHeight || 0) + 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1 
    },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    headerRight: {
        flexDirection: 'row',
        gap: 20
    },
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 30,
        backgroundColor: '#1a5dab',
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    cardMain: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 3,
        zIndex: 10  
    },

    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 10
    },
    dropdownMenu: {
        position: 'absolute',
        top: 60, 
        backgroundColor: 'white',
        width: '80%',
        borderRadius: 10,
        padding: 5,
        elevation: 5, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 20
    },
    dropdownItem: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },

    amount: { fontSize: 28, fontWeight: 'bold', marginVertical: 10, color: '#1a5dab' },
    label: { fontSize: 16, color: '#555', marginRight: 5 },
    subLabel: { fontSize: 12, color: '#888' },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        zIndex: 1 // Z-index rendah biar gak nutupin dropdown dari atas
    },
    summaryBox: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        width: '48%',
        elevation: 3
    },
    summaryAmount: { fontWeight: 'bold', fontSize: 16, marginTop: 5 },

    chartContainer: {
        backgroundColor: 'white',
        margin: 20,
        marginTop: 0,
        padding: 20,
        borderRadius: 15,
        elevation: 3,
        marginBottom: 50,
        paddingBottom: 10,
        overflow: 'hidden'
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 }
});