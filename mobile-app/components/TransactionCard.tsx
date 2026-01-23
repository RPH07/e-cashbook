import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/context/TransactionContext';

interface Props {
    data: Transaction;
    onPress?: () => void;
}

const TransactionCard: React.FC<Props> = ({ data, onPress }) => {
    const isIncome = data.type === 'pemasukan';
    const color = isIncome ? '#2e7d32' : '#c62828';
    const iconName = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';

    // Format Rupiah
    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(data.amount);

    // Format Tanggal
    const formattedDate = new Date(data.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: isIncome ? '#e8f5e9' : '#ffebee' }]}>
                <Ionicons name={iconName} size={24} color={color} />
            </View>

            <View style={styles.infoContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.category}>{data.category}</Text>
                    {data.imageUri && (
                        <Ionicons 
                            name="attach"
                            size={16}
                            color="#888"
                            style={{marginLeft: 5, transform: [{rotate: '45deg'}]}}
                        />
                    )}
                </View>
                <Text style={styles.date}>{formattedDate} • {data.account}</Text>
            </View>

            <Text style={[styles.amount, { color: color }]}>
                {isIncome ? '+ ' : '- '}
                {formattedAmount}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoContainer: { flex: 1 },
    category: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    date: { fontSize: 12, color: '#888', marginTop: 2 },
    amount: { fontSize: 14, fontWeight: 'bold' },
});

export default TransactionCard;