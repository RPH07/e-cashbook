import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TransactionCard, { Transaction } from '@/components/TransactionCard';
import { useTransaction } from '@/context/TransactionContext';
import TransactionDetailModal from '@/components/TransactionDetailModal';

export default function UangKeluar() {
  const [searchQuery, setSearchQuery] = useState('');
  const { transactions } = useTransaction();
  const expenseData = transactions.filter(item => item.type === 'pengeluaran');
  const filteredData = expenseData.filter(item => 
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCardPress = (item: Transaction) => {
    setSelectedTransaction(item);
    setModalVisible(true);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Pengeluaran</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="Cari pengeluaran..." 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard 
            data={item}
            onPress={() => handleCardPress(item)}
          />
        )}
        contentContainerStyle={{ padding: 20, paddingTop: 5 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={50} color="#ccc" />
            <Text style={{ color: '#aaa', marginTop: 10 }}>Belum ada data pengeluaran</Text>
          </View>
        }
      />

      <TransactionDetailModal 
        visible={modalVisible}
        transaction={selectedTransaction}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: (StatusBar.currentHeight || 0) + 20, 
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#c62828'
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16,
    color: '#333'
  },
  emptyState: { 
    alignItems: 'center', 
    marginTop: 80,
    opacity: 0.7 
  },
});