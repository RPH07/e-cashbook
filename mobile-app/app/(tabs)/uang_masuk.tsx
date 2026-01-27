import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransaction, Transaction } from '@/context/TransactionContext';
import TransactionCard from '@/components/TransactionCard';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UangMasukScreen() {
    const { transactions } = useTransaction();
    
    // state filter & pencarian
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    
    // Filter Values
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
    const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

    // State Detail Modal
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    // logic ambil kategori dari create
    const availableCategories = Array.from(
        new Set(transactions.filter(t => t.type === 'pemasukan').map(t => t.category))
    );

    // logic filtering
    const filteredData = transactions
        .filter(t => {
            if (t.type !== 'pemasukan') return false;

            // Search (Note, Category, Account)
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                (t.note || '').toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query) ||
                t.account.toLowerCase().includes(query);

            let matchesDate = true;
            const txDate = new Date(t.date);
            if (startDate) matchesDate = matchesDate && txDate >= startDate;
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59); 
                matchesDate = matchesDate && txDate <= endOfDay;
            }

            const matchesCategory = selectedCategory ? t.category === selectedCategory : true;

            return matchesSearch && matchesDate && matchesCategory;
        })
        .sort((a, b) => {
            // Sorting
            switch (sortBy) {
                case 'oldest': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'highest': return b.amount - a.amount;
                case 'lowest': return a.amount - b.amount;
                case 'newest': default: return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const type = showPicker;
        setShowPicker(null);
        if (selectedDate && type) {
            if (type === 'start') setStartDate(selectedDate);
            else setEndDate(selectedDate);
        }
    };

    const resetFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedCategory(null);
        setSortBy('newest');
        setShowFilterModal(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#888" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
                    <Ionicons name="options" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <TransactionCard
                        transaction={item}
                        onPress={() => {
                            setSelectedTx(item);
                            setDetailVisible(true);
                        }}
                    />
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Ionicons name="file-tray-outline" size={50} color="#ccc" />
                        <Text style={{ color: '#888', marginTop: 10 }}>Tidak ada data ditemukan</Text>
                    </View>
                }
            />

            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter & Urutkan</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView>
                            <Text style={styles.sectionLabel}>Rentang Tanggal</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
                                    <Ionicons name="calendar-outline" size={18} color="#555" />
                                    <Text style={{marginLeft: 5}}>{startDate ? startDate.toLocaleDateString() : 'Mulai'}</Text>
                                </TouchableOpacity>
                                <Text>-</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
                                    <Ionicons name="calendar-outline" size={18} color="#555" />
                                    <Text style={{marginLeft: 5}}>{endDate ? endDate.toLocaleDateString() : 'Sampai'}</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.sectionLabel}>Kategori</Text>
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                                <TouchableOpacity 
                                    style={[styles.chip, !selectedCategory && styles.chipActive]}
                                    onPress={() => setSelectedCategory(null)}
                                >
                                    <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Semua</Text>
                                </TouchableOpacity>
                                {availableCategories.map(cat => (
                                    <TouchableOpacity 
                                        key={cat}
                                        style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sectionLabel}>Urutkan Berdasarkan</Text>
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                                {['newest', 'oldest', 'highest', 'lowest'].map(sort => (
                                    <TouchableOpacity 
                                        key={sort}
                                        style={[styles.chip, sortBy === sort && styles.chipActive]}
                                        onPress={() => setSortBy(sort as any)}
                                    >
                                        <Text style={[styles.chipText, sortBy === sort && styles.chipTextActive]}>
                                            {sort === 'newest' ? 'Terbaru' : sort === 'oldest' ? 'Terlama' : sort === 'highest' ? 'Terbesar' : 'Terkecil'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
                                <Text style={{color: '#666'}}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
                                <Text style={{color: 'white', fontWeight: 'bold'}}>Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {showPicker && (
                    <DateTimePicker
                        value={showPicker === 'start' ? (startDate || new Date()) : (endDate || new Date())}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
            </Modal>

            <TransactionDetailModal
                visible={detailVisible}
                transaction={selectedTx}
                onClose={() => setDetailVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerContainer: {
        flexDirection: 'row', padding: 20, paddingTop: 50, backgroundColor: 'white',
        alignItems: 'center', gap: 10, elevation: 2
    },
    searchBox: {
        flex: 1, flexDirection: 'row', backgroundColor: '#f0f2f5', 
        paddingHorizontal: 15, height: 45, borderRadius: 25, alignItems: 'center'
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
    filterBtn: {
        width: 45, height: 45, backgroundColor: '#1a5dab', borderRadius: 25,
        justifyContent: 'center', alignItems: 'center'
    },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 15, marginBottom: 10 },
    dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    dateBtn: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' 
    },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: 'white' },
    chipActive: { backgroundColor: '#e3f2fd', borderColor: '#1a5dab' },
    chipText: { color: '#666', fontSize: 12 },
    chipTextActive: { color: '#1a5dab', fontWeight: 'bold' },
    modalFooter: { flexDirection: 'row', marginTop: 30, gap: 10 },
    resetBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: '#eee' },
    applyBtn: { flex: 2, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: '#1a5dab' }
});