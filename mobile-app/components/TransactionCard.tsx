import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import tipe transaction biar aman
import { Transaction } from '@/context/TransactionContext';

interface Props {
    transaction: Transaction;
    onPress?: () => void;
}

const TransactionCard: React.FC<Props> = ({ transaction, onPress }) => {
    const isIncome = transaction.type === 'pemasukan' || transaction.type === 'income';
    let color = isIncome ? '#2e7d32' : '#c62828';
    let iconName: keyof typeof Ionicons.glyphMap = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';
    let bgColor = isIncome ? '#e8f5e9' : '#ffebee';
    let statusColor = color;
    let statusText = '';
    let cardBorderColor = '#eee';
    
    // --- LOGIC STATUS ---
    const isPending = transaction.status === 'pending';
    const isRejected = transaction.status === 'rejected';
    const isVerified = transaction.status === 'waiting_approval_a';
    const isVoid = transaction.status === 'void';

    if (isPending) {
        statusColor = '#fbc02d';
        bgColor = '#fff8e1';
        statusText = 'PENDING';
        cardBorderColor = '#fbc02d';
    } else if (isVerified){
        statusColor = '#0288d1';
        bgColor = '#e1f5fe';
        iconName = 'hourglass-outline';
        statusText = 'VERIFIED';
        cardBorderColor = '#0288d1';
    } else if (isRejected) {
        statusColor = '#d32f2f';
        bgColor = '#ffebee';
        iconName = 'close-circle-outline';
        statusText = 'DITOLAK';
        cardBorderColor = '#d32f2f';
    } else if (isVoid) {
        statusColor = '#757575';
        bgColor = '#f5f5f5';
        iconName = 'remove-circle-outline';
        statusText = 'DIBATALKAN';
        cardBorderColor = '#757575';
    }


    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(transaction.amount);

    const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

return (
        <TouchableOpacity
            style={[styles.card, { borderColor: cardBorderColor }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                <Ionicons
                    name={iconName}
                    size={24}
                    color={statusColor}
                />
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.category} numberOfLines={1}>
                        {transaction.category || 'Umum'}
                    </Text>
                    
                    {(isPending || isVerified || isRejected || isVoid) && (
                        <View style={[
                            styles.badge, 
                            { 
                                borderColor: statusColor, 
                                backgroundColor: isVerified ? '#fff3e0' : (isPending ? '#fffde7' : '#eee') 
                            }
                        ]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>
                                {statusText}
                            </Text>
                        </View>
                    )}
                </View>
                
                <Text style={styles.date}>
                    {formattedDate} • {transaction.account || 'Tunai'}
                </Text>
                
                {transaction.note ? (
                    <Text style={styles.note} numberOfLines={1}>{transaction.note}</Text>
                ) : null}
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
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'white',
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 10,
        borderWidth: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        elevation: 2
    },
    iconContainer: { 
        width: 45, 
        height: 45, 
        borderRadius: 25, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 15 
    },
    infoContainer: { 
        flex: 1,
        marginRight: 10
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap', 
        marginBottom: 2
    },
    category: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#333',
        marginRight: 8
    },
    date: { 
        fontSize: 12, 
        color: '#888', 
        marginBottom: 2 
    },
    note: {
        fontSize: 11,
        color: '#aaa',
        fontStyle: 'italic'
    },
    amount: { 
        fontSize: 15, 
        fontWeight: 'bold' 
    },
    badge: { 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 6, 
        borderWidth: 1,
    },
    badgeText: { 
        fontSize: 9, 
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
});

export default TransactionCard;