import React from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    Image, ScrollView, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/components/TransactionCard';

interface Props {
    visible: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

const { width } = Dimensions.get('window');
const TransactionDetailModal: React.FC<Props> = ({ visible, onClose, transaction }) => {
    if (!transaction) return null;

    const isIncome = transaction.type === 'pemasukan';
    const color = isIncome ? '#2e7d32' : '#c62828';

    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(transaction.amount);

    const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <Modal
            visible={visible}
            animationType='slide'
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer} >
                    <View style={styles.header} >
                        <Text style={styles.headerTitle}>Detail Transaksi</Text>
                        <TouchableOpacity onPress={onClose} >
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.content} >
                        <View style={[styles.amountBox, { backgroundColor: isIncome ? '#e8f5e9' : '#ffebee' }]} >
                            <Text style={styles.labelAmount} >{isIncome ? 'Uang Masuk' : 'Uang Keluar'}</Text>
                            <Text style={styles.amountText} >{formattedAmount}</Text>
                        </View>
                        <View style={styles.infoRow} >
                            <View style={styles.infoItem}>
                                <Text style={styles.label} >Tanggal</Text>
                                <Text style={styles.value} >{formattedDate}</Text>
                            </View>
                            <View style={[styles.infoItem, {alignItems: 'flex-end'}]} >
                                <Text style={styles.label} >Akun</Text>
                                <Text style={[styles.value, {textAlign: 'right'}]} >{transaction.account}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow} >
                            <View style={styles.infoItem}>
                                <Text style={styles.label} >Kategori</Text>
                                <Text style={styles.value} >{transaction.category}</Text>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.label}>Catatan / Keterangan</Text>
                            <View style={styles.noteBox}>
                                <Text style={styles.noteText}>
                                    {transaction.note ? transaction.note : '- Tidak ada catatan -'}
                                </Text>
                            </View>
                        </View>
                        {transaction.imageUri && (
                            <View style={styles.section} >
                                <Text style={styles.label}>Bukti Transaksi</Text>
                                <Image
                                    source={{ uri: transaction.imageUri }}
                                    style={styles.proofImage}
                                />
                            </View>
                        )}
                    </ScrollView>
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => alert('Todo: buat fitur deleted')}>
                            <Ionicons name="trash-outline" size={20} color="#c62828" />
                            <Text style={{ color: '#c62828', marginLeft: 5 }}>Hapus</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 50 },

    amountBox: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    labelAmount: { fontSize: 14, color: '#666', marginBottom: 5 },
    amountText: { fontSize: 24, fontWeight: 'bold' },

    infoRow: { flexDirection: 'row', marginBottom: 15, gap: 20 },
    infoItem: { flex: 1 },
    label: { fontSize: 12, color: '#888', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: '#333' },

    section: { marginTop: 15 },
    noteBox: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    noteText: { color: '#444', lineHeight: 22 },

    proofImage: {
        width: '100%',
        height: 300,
        borderRadius: 10,
        marginTop: 10,
        resizeMode: 'contain',
        backgroundColor: '#000'
    },

    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    }
});

export default TransactionDetailModal;