import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import tipe data biar aman
import { Transaction } from '@/context/TransactionContext';

interface Props {
    data: Transaction;
    onPress?: () => void;
}

const TransactionCard: React.FC<Props> = ({ data, onPress }) => {
    const isIncome = data.type === 'pemasukan';
    const color = isIncome ? '#2e7d32' : '#c62828';
    const iconName = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';

    // --- LOGIC STATUS ---
    const isPending = data.status === 'pending';
    const isRejected = data.status === 'rejected';

    const statusColor = isPending ? '#fbc02d' : (isRejected ? '#757575' : color);
    const bgColor = isPending ? '#fffde7' : (isIncome ? '#e8f5e9' : '#ffebee');

    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(data.amount);

    const formattedDate = new Date(data.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <TouchableOpacity
            style={[styles.card, isPending ? { borderColor: '#fbc02d', borderWidth: 1 } : { borderColor: '#eee' }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                <Ionicons
                    name={isPending ? "time-outline" : iconName}
                    size={24}
                    color={statusColor}
                />
            </View>

            <View style={styles.infoContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.category}>{data.category}</Text>
                    {isPending && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>PENDING</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.date}>{formattedDate} • {data.account}</Text>
            </View>

            <Text style={[styles.amount, { color: statusColor }]}>
                {isIncome ? '+ ' : '- '}
                {formattedAmount}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        padding: 15, borderRadius: 12, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,borderWidth: 1
    },
    iconContainer: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoContainer: { flex: 1 },
    category: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    date: { fontSize: 12, color: '#888', marginTop: 2 },
    amount: { fontSize: 14, fontWeight: 'bold' },
    badge: { backgroundColor: '#fff9c4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    badgeText: { fontSize: 10, color: '#fbc02d', fontWeight: 'bold' }
});

export default TransactionCard;