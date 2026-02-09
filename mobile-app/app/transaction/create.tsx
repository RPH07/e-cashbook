import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import FloatingInput from '@/components/FloatingInput';
import { useTransaction } from '../../context/TransactionContext';
import { transactionService } from '@/services/transactionService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TransactionType = 'pemasukan' | 'pengeluaran' | 'transfer';

// Helper: Format Angka jadi Rupiah (String tampilan)
const formatCurrency = (value: string) => {
    if (!value) return '';
    // Hapus semua karakter non-angka
    const cleanValue = value.replace(/\D/g, '');
    // Format jadi ribuan (pake titik)
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/\./g, '').replace(/,/g, '.')) || 0;
};

export default function CreateTransaction() {
    const insets = useSafeAreaInsets();
    const { addTransaction, updateTransaction, transactions, userRole, userName } = useTransaction();

    const params = useLocalSearchParams();
    const editId = params.id as string;
    const isEditMode = !!editId;

    const [type, setType] = useState<TransactionType>('pengeluaran');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // State amount tetep string biar bisa nampung titik
    const [amount, setAmount] = useState(''); 
    
    const [note, setNote] = useState('');

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedToAccountId, setSelectedToAccountId] = useState<number | null>(null); // For transfer

    const [proofLink, setProofLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadMasterData = async () => {
            try {
                const accData = await transactionService.getAccounts();
                const catData = await transactionService.getCategories();
                setAccounts(accData || []);
                setCategories(catData || []);

                if (!isEditMode && accData?.length > 0) setSelectedAccountId(accData[0].id);
                if (!isEditMode && catData?.length > 0) setSelectedCategoryId(catData[0].id);

            } catch (error) {
                console.error("Gagal load master data", error);
            }
        };
        loadMasterData();
    }, []);

    useEffect(() => {
        if (isEditMode && accounts.length > 0 && categories.length > 0) {
            const txToEdit = transactions.find(t => String(t.id) === String(editId));

            if (txToEdit) {
                const mappedType: TransactionType = 
                    txToEdit.type === 'income' ? 'pemasukan' : 
                    txToEdit.type === 'expense' ? 'pengeluaran' :
                    txToEdit.type === 'transfer' ? 'transfer' :
                    txToEdit.type as TransactionType;
                setType(mappedType);
                setDate(new Date(txToEdit.date));
                
                setAmount(formatCurrency(txToEdit.amount.toString()));
                
                const noteValue = (txToEdit as any).note || (txToEdit as any).description || '';
                const proofValue = (txToEdit as any).proofLink || (txToEdit as any).evidence_link || '';
                
                setNote(noteValue);
                setProofLink(proofValue);

                const foundAccount = accounts.find(a => 
                    a.account_name === txToEdit.account || 
                    a.name === txToEdit.account
                );
                if (foundAccount) {
                    setSelectedAccountId(foundAccount.id);
                }

                const foundCategory = categories.find(c => c.name === txToEdit.category);
                if (foundCategory) {
                    setSelectedCategoryId(foundCategory.id);
                }
            }
        }
    }, [editId, transactions, accounts, categories, isEditMode]);

    const themeColor = type === 'pemasukan' ? '#2e7d32' : type === 'pengeluaran' ? '#c62828' : '#1976d2';

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const handleAmountChange = (text: string) => {
        setAmount(formatCurrency(text));
    };

    const handleSave = async () => {
        const numericAmount = parseCurrency(amount);

        if (type === 'transfer') {
            if (!numericAmount || !selectedAccountId || !selectedToAccountId) {
                Alert.alert("Eits!", "Nominal, Akun Sumber, dan Akun Tujuan wajib diisi untuk transfer!");
                return;
            }
            if (selectedAccountId === selectedToAccountId) {
                Alert.alert("Eits!", "Akun Sumber dan Tujuan tidak boleh sama!");
                return;
            }
        } else {
            if (!numericAmount || !selectedAccountId || !selectedCategoryId) {
                Alert.alert("Eits!", "Nominal, Akun, dan Kategori wajib dipilih ya!");
                return;
            }
        }

        setIsLoading(true);
        try {
            const selectedAccountObj = accounts.find(a => a.id === selectedAccountId);
            const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
            const selectedToAccountObj = accounts.find(a => a.id === selectedToAccountId);

            const payload: any = {
                type: type,
                amount: numericAmount,
                date: date.toISOString(),
                note: note,
                proofLink: proofLink,
                accountId: selectedAccountId!,
                accountName: selectedAccountObj?.account_name || 'Unknown',
            };

            if (type !== 'transfer') {
                payload.categoryId = selectedCategoryId!;
                payload.categoryName = selectedCategoryObj?.name || 'Unknown';
            }

            if (type === 'transfer') {
                payload.toAccountId = selectedToAccountId!;
                payload.toAccountName = selectedToAccountObj?.account_name || 'Unknown';
            }

            if (isEditMode) {
                await updateTransaction(editId, payload);
                Alert.alert("Berhasil", "Data transaksi berhasil diperbarui!");
            } else {
                await addTransaction(payload);
                if (userRole === 'staff') {
                    Alert.alert("Terkirim!", "Transaksi masuk antrian approval.");
                } else {
                    Alert.alert("Berhasil!", "Transaksi berhasil disimpan.");
                }
            }

            router.back();

        } catch (error) {
            console.error(error);
            Alert.alert("Gagal", "Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Stack.Screen
                options={{
                    headerTitle: isEditMode ? 'Edit Transaksi' : 'Catat Transaksi',
                    headerStyle: { backgroundColor: themeColor },
                    headerTintColor: '#fff',
                    headerShadowVisible: false
                }}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[styles.headerContainer, { backgroundColor: themeColor }]}>
                    <View style={[styles.switchContainer]}>
                        <TouchableOpacity
                            style={[styles.switchButton, type === 'pemasukan' && styles.activeSwitch]}
                            onPress={() => setType('pemasukan')}
                        >
                            <Text style={[styles.switchText, type === 'pemasukan' && { color: themeColor }]}>Pemasukan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.switchButton, type === 'pengeluaran' && styles.activeSwitch]}
                            onPress={() => setType('pengeluaran')}
                        >
                            <Text style={[styles.switchText, type === 'pengeluaran' && { color: themeColor }]}>Pengeluaran</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.switchButton, type === 'transfer' && styles.activeSwitch]}
                            onPress={() => setType('transfer')}
                        >
                            <Text style={[styles.switchText, type === 'transfer' && { color: themeColor }]}>Transfer</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Tanggal Transaksi</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                    </TouchableOpacity>
                    {showDatePicker && <DateTimePicker value={date} mode="date" onChange={handleDateChange} />}

                    <FloatingInput 
                        label="Nominal (Rp)" 
                        value={amount} 
                        onChangeText={handleAmountChange} 
                        keyboardType="numeric" 
                        style={{ marginTop: 20 }} 
                    />

                    <Text style={styles.label}>{type === 'transfer' ? 'Akun Sumber' : 'Sumber Dana / Akun'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                        <View style={styles.pillContainer}>
                            {accounts.map((acc) => (
                                <TouchableOpacity
                                    key={acc.id}
                                    style={[
                                        styles.pill,
                                        selectedAccountId === acc.id && { backgroundColor: themeColor, borderColor: themeColor }
                                    ]}
                                    onPress={() => setSelectedAccountId(acc.id)}
                                >
                                    <Text style={[
                                        styles.pillText,
                                        selectedAccountId === acc.id && { color: 'white' }
                                    ]}>
                                        {acc.account_name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {type === 'transfer' && (
                        <>
                            <Text style={styles.label}>Akun Tujuan</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                <View style={styles.pillContainer}>
                                    {accounts.map((acc) => (
                                        <TouchableOpacity
                                            key={acc.id}
                                            style={[
                                                styles.pill,
                                                selectedToAccountId === acc.id && { backgroundColor: themeColor, borderColor: themeColor },
                                                selectedAccountId === acc.id && { opacity: 0.5 }
                                            ]}
                                            onPress={() => {
                                                if (acc.id !== selectedAccountId) {
                                                    setSelectedToAccountId(acc.id);
                                                }
                                            }}
                                            disabled={acc.id === selectedAccountId}
                                        >
                                            <Text style={[
                                                styles.pillText,
                                                selectedToAccountId === acc.id && { color: 'white' }
                                            ]}>
                                                {acc.account_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </>
                    )}

                    {type !== 'transfer' && (
                        <>
                            <Text style={styles.label}>Kategori</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                <View style={styles.pillContainer}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.pill,
                                                selectedCategoryId === cat.id && { backgroundColor: themeColor, borderColor: themeColor }
                                            ]}
                                            onPress={() => setSelectedCategoryId(cat.id)}
                                        >
                                            <Text style={[
                                                styles.pillText,
                                                selectedCategoryId === cat.id && { color: 'white' }
                                            ]}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </>
                    )}

                    <Text style={styles.label}>Bukti Transaksi</Text>
                    <FloatingInput
                        label='Paste Link Google Drive di sini...'
                        value={proofLink}
                        onChangeText={setProofLink}
                        style={{ marginBottom: 20 }}
                    />

                    <FloatingInput label="Catatan Tambahan" value={note} onChangeText={setNote} multiline numberOfLines={3} style={{ height: 100, marginTop: 20 }} />
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: themeColor }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveText}>{isEditMode ? 'UPDATE TRANSAKSI' : 'SIMPAN TRANSAKSI'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    switchContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 4 },
    switchButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeSwitch: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, elevation: 2 },
    switchText: { fontWeight: 'bold', color: 'white' },
    formContainer: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 10 },
    dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    dateText: { marginLeft: 10, fontSize: 16, color: '#333' },
    pillContainer: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: 'white' },
    pillText: { color: '#666', fontWeight: '600' },
    uploadBox: { height: 150, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, elevation: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});