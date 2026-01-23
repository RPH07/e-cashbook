import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    Image, ScrollView, Dimensions, PanResponder, Animated, TouchableWithoutFeedback, Easing,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTransaction, Transaction } from '@/context/TransactionContext';

interface Props {
    visible: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CLOSE_THRESHOLD = SCREEN_HEIGHT * 0.25;

const TransactionDetailModal: React.FC<Props> = ({ visible, onClose, transaction }) => {
    const { userRole, approveTransaction, deleteTransaction } = useTransaction();
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [showModal, setShowModal] = useState(false);
    const backdropOpacity = panY.interpolate({
        inputRange: [0, SCREEN_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        if (visible) {
            panY.setValue(SCREEN_HEIGHT);
            setShowModal(true);
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 6,
                speed: 14
            }).start();
        } else {
            if (showModal) {
                setShowModal(false);
                panY.setValue(SCREEN_HEIGHT);
            }
        }
    }, [visible]);

    const closeModalAnimated = () => {
        Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start(() => {
            setShowModal(false);
            onClose();
        })
    }

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event(
                [null, { dy: panY }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > CLOSE_THRESHOLD || gestureState.vy > 0.5) {
                    Animated.spring(panY, {
                        toValue: SCREEN_HEIGHT,
                        velocity: gestureState.vy,
                        tension: 2,
                        friction: 8,
                        useNativeDriver: true
                    }).start(() => {
                        setShowModal(false);
                        onClose();
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8
                    }).start();
                }
            },
        })
    ).current;

    if (!transaction) return null;
    const isIncome = transaction.type === 'pemasukan';
    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(transaction.amount);
    const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const animatedStyle = {
        transform: [{ translateY: panY }]
    }

    const canApprove = transaction?.status === 'pending' && (userRole === 'finance' || userRole === 'admin')
    const canEditDelete = (() => {
        if (!transaction) return false;
        if (userRole === 'admin') return true;
        if (userRole === 'finance') return true;
        if (userRole === 'staff' && transaction.status === 'pending') return true;
        return false;
    })

    const handleDelete = () => {
        if (!transaction) return;

        Alert.alert(
            "Hapus Transaksi?",
            "Yakin mau hapus data ini? data tidak bisa di kembalikan.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => {
                        deleteTransaction(transaction.id);
                        closeModalAnimated();
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        if (!transaction) return;
        onClose();
        router.push({
            pathname: '/transaction/create',
            params: { id: transaction.id }
        });
    };

    const handleApprove = () => {
        if (transaction) {
            approveTransaction(transaction.id);
            onClose();
            alert("Transaksi berhasil di-Approve!");
        }
    }

    return (
        <Modal
            visible={showModal}
            transparent={true}
            animationType="none"
            onRequestClose={closeModalAnimated}
        >
            <View style={styles.overlayWrapper}>

                <TouchableWithoutFeedback onPress={closeModalAnimated}>
                    <Animated.View
                        style={[styles.backdrop, { opacity: backdropOpacity }]}
                    />
                </TouchableWithoutFeedback>
                <Animated.View style={[styles.modalContainer, animatedStyle]} >
                    <View style={styles.header} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Detail Transaksi</Text>
                            <TouchableOpacity onPress={closeModalAnimated} >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {transaction.status === 'pending' && (
                        <View style={{ alignItems: 'center', backgroundColor: '#fff9c4', paddingVertical: 6 }}>
                            <Text style={{ color: '#f57f17', fontWeight: 'bold', fontSize: 12 }}>⚠️ MENUNGGU PERSETUJUAN (PENDING)</Text>
                        </View>
                    )}
                    {transaction.status === 'approved' && (
                        <View style={{ alignItems: 'center', backgroundColor: '#e8f5e9', paddingVertical: 6 }}>
                            <Text style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 12 }}>✅ SUDAH DISETUJUI (APPROVED)</Text>
                        </View>
                    )}

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.content}
                    >
                        <View style={[styles.amountBox, { backgroundColor: isIncome ? '#e8f5e9' : '#ffebee' }]} >
                            <Text style={styles.labelAmount} >{isIncome ? 'Uang Masuk' : 'Uang Keluar'}</Text>
                            <Text style={styles.amountText} >{formattedAmount}</Text>
                        </View>

                        <View style={styles.infoRow} >
                            <View style={styles.infoItem}>
                                <Text style={styles.label} >Tanggal</Text>
                                <Text style={styles.value} >{formattedDate}</Text>
                            </View>
                            <View style={[styles.infoItem, { alignItems: 'flex-end' }]} >
                                <Text style={styles.label} >Akun</Text>
                                <Text style={[styles.value, { textAlign: 'right' }]} >{transaction.account}</Text>
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
                        {canApprove ? (
                            <TouchableOpacity style={[styles.approveButton, { backgroundColor: '#2e7d32' }]} onPress={handleApprove}>
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                                <Text style={styles.btnTextWhite}>SETUJUI (ACC)</Text>
                            </TouchableOpacity>
                        ) : canEditDelete() ? (
                            <>
                                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                    <Ionicons name="trash-outline" size={20} color="#c62828" />
                                    <Text style={{ color: '#c62828', marginLeft: 5 }}>Hapus</Text>
                                </TouchableOpacity>
                                <View style={styles.separator} />
                                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                                    <Ionicons name="create-outline" size={20} color="#1a5dab" />
                                    <Text style={{ color: '#1a5dab', marginLeft: 5 }}>Edit</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', width: '100%' }}>
                                <Text style={{ color: '#888', fontStyle: 'italic' }}>🔒 Transaksi terkunci (Read Only)</Text>
                            </View>
                        )}
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: -1,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 5, marginBottom: 10 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 50 },
    amountBox: { alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 20 },
    labelAmount: { fontSize: 14, color: '#666', marginBottom: 5 },
    amountText: { fontSize: 24, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', marginBottom: 15 },
    infoItem: { flex: 1 },
    label: { fontSize: 12, color: '#888', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: '#333' },
    section: { marginTop: 15 },
    noteBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    noteText: { color: '#444', lineHeight: 22 },
    proofImage: { width: '100%', height: 300, borderRadius: 10, marginTop: 10, resizeMode: 'contain', backgroundColor: '#000' },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    editButton: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    approveButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, width: '100%', justifyContent: 'center' },
    btnTextWhite: { color: 'white', marginLeft: 5, fontWeight: 'bold' },
    separator: { width: 1, height: 20, backgroundColor: '#ddd', marginHorizontal: 20 }
});

export default TransactionDetailModal;