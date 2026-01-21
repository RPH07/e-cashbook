import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import FloatingInput from '@/components/FloatingInput';
import { useTransaction } from '../../context/TransactionContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { HeaderTitle } from '@react-navigation/elements';

type TransactionType = 'pemasukan' | 'pengeluaran';

export default function CreateTransaction() {
    const insets = useSafeAreaInsets();
    const [type, setType] = useState<TransactionType>('pengeluaran');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [account, setAccount] = useState('giro');
    const [note, setNote] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const {addTransaction} = useTransaction();

    const themeColor = type === 'pemasukan' ? '#2e7d32' : '#c62828';

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    const handleDateChange = (even: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    // Logic Ambil Gambar
    const pickImage = async () => {
        // Request Permission dulu
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Maaf', 'Kami butuh izin akses galeri buat upload struk!', [{ text: 'Oke' }]);
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = () => {
        if (!amount || !category) {
            Alert.alert("Nominal dan Kategori wajib diisi ya!");
            return;
        }

        const newTransaction = {
            id: Date.now().toString(),
            type: type,
            amount: parseFloat(amount),
            category: category,
            date: date.toISOString(),
            note: note,
            account: account,
            imageUri: image
        };

        addTransaction(newTransaction);


        Alert.alert("Berhasil!", `Transaksi ${type} sebesar Rp${amount} disimpan!`);
        router.back();
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Stack.Screen
                options={{
                    headerTitle: 'Catat transaksi',
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
                            <Text style={[styles.switchText, type === 'pengeluaran' && { color: themeColor }]}>pengeluaran</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Tanggal Transaksi</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display='default'
                            onChange={handleDateChange}
                        />
                    )}

                    <FloatingInput
                        label="Nominal (Rp)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        style={{ marginTop: 20 }}
                    />

                    <Text style={styles.label}>Sumber Dana / Akun</Text>
                    <View style={styles.pillContainer}>
                        {['Total', 'Tabungan', 'Giro'].map((acc) => (
                            <TouchableOpacity
                                key={acc}
                                style={[styles.pill, account === acc && { backgroundColor: themeColor, borderColor: themeColor }]}
                                onPress={() => setAccount(acc)}
                            >
                                <Text style={[styles.pillText, account === acc && { color: 'white' }]}>{acc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <FloatingInput
                        label="Kategori (Misal: Makan, Gaji)"
                        value={category}
                        onChangeText={setCategory}
                        style={{ marginTop: 20 }}
                    />

                    <Text style={styles.label}>Bukti Transaksi</Text>
                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={pickImage}
                    >
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={32} color="#aaa" />
                                <Text style={{ color: '#aaa', marginTop: 5 }}>Tap untuk upload foto</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <FloatingInput
                        label="Catatan Tambahan"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        style={{ height: 100, marginTop: 20 }}
                    />
                </View>
            </ScrollView>

            <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: themeColor }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveText}>SIMPAN TRANSAKSI</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        padding: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        padding: 4,
    },
    switchButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeSwitch: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    switchText: {
        fontWeight: 'bold',
        color: 'white',
    },
    formContainer: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 10,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    dateText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    pillText: {
        color: '#666',
        fontWeight: '600',
    },
    uploadBox: {
        height: 150,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});