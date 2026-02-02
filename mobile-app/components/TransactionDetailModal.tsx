import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Dimensions, PanResponder, Animated, TouchableWithoutFeedback, Easing,
    Alert, Linking
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
    // Tarik fungsi approve/reject dari Context
    const { userRole, approveTransaction, deleteTransaction, rejectTransaction } = useTransaction();
    
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [showModal, setShowModal] = useState(false);
    
    const backdropOpacity = panY.interpolate({
        inputRange: [0, SCREEN_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    // --- ANIMASI MODAL ---
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

    // --- SAFETY CHECK ---
    if (!transaction) return null;

    // Helper Variables
    const isIncome = transaction.type === 'pemasukan' || transaction.type === 'income';
    
    // Status helpers
    const isPending = transaction.status === 'pending';
    const isVerified = transaction.status === 'waiting_approval_a';  
    const isApproved = transaction.status === 'approved';
    const isRejected = transaction.status === 'rejected';
    const isVoid = transaction.status === 'void';

    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(transaction.amount);

    const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const animatedStyle = {
        transform: [{ translateY: panY }]
    }

    // LOGIC PERIZINAN
    const checkCanApprove = () => {
        if (isApproved || isRejected || isVoid) return false;

        if (userRole === 'finance') {
            return isPending;
        }
        if (userRole === 'admin') {
            return isVerified || (isIncome && isPending);
        }

        return false;
    };
    const showApproveButton = checkCanApprove();

    const getApproveLabel = () => {
        if (userRole === 'finance' && !isIncome) {
            return "Verifikasi (Lanjut ke Direktur)";
        }
        return "SETUJUI TRANSAKSI";
    };

    const canEditDelete = () => {
        if (userRole === 'admin') return true; 
        // Manager/Staff cuma bisa hapus kalo masih pending
        if (isPending && (userRole === 'finance' || userRole === 'staff')) return true;
        return false;
    };

    const handleDelete = () => {
        Alert.alert(
            "Hapus Transaksi?",
            "Yakin mau hapus data ini? Data tidak bisa dikembalikan.",
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
        onClose();
        router.push({
            pathname: '/transaction/create',
            params: { id: transaction.id }
        });
    };

    const handleApprove = () => {
        approveTransaction(transaction.id);
        closeModalAnimated();
        
        const successMsg = userRole === 'finance' && !isIncome 
            ? "Berhasil diverifikasi! Menunggu Direktur." 
            : "Transaksi Berhasil Disetujui! ✅";
        Alert.alert("Sukses", successMsg);
    }

    const handleReject = () => {
        Alert.alert(
            "Tolak Transaksi",
            "Yakin ingin menolak transaksi ini?",
            [
                { text: "Batal", style: "cancel" },
                { 
                    text: "Ya, Tolak", 
                    style: 'destructive',
                    onPress: () => {
                        rejectTransaction(transaction.id);
                        closeModalAnimated();
                    }
                }
            ]
        );
    };

    const handleOpenLink = async () => {
        const link = transaction?.proofLink;
        if (link) {
            const supported = await Linking.canOpenURL(link);
            if (supported) {
                await Linking.openURL(link);
            } else {
                Alert.alert("Error", "Link tidak valid atau tidak bisa dibuka :(");
            }
        } else {
            Alert.alert("Kosong", "Tidak ada link bukti transaksi.");
        }
    };

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
                    {isPending && (
                        <View style={[styles.statusBanner, { backgroundColor: '#fff9c4' }]}>
                            <Text style={{ color: '#f57f17', fontWeight: 'bold', fontSize: 12 }}>
                                ⚠️ MENUNGGU PERSETUJUAN (PENDING)
                            </Text>
                        </View>
                    )}
                    {isVerified && (
                        <View style={[styles.statusBanner, { backgroundColor: '#fff3e0' }]}>
                            <Text style={{ color: '#ef6c00', fontWeight: 'bold', fontSize: 12 }}>
                                ⏳ TERVERIFIKASI - MENUNGGU DIREKTUR
                            </Text>
                        </View>
                    )}
                    {isApproved && (
                        <View style={[styles.statusBanner, { backgroundColor: '#e8f5e9' }]}>
                            <Text style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 12 }}>
                                ✅ SUDAH DISETUJUI (APPROVED)
                            </Text>
                        </View>
                    )}
                    {isRejected && (
                        <View style={[styles.statusBanner, { backgroundColor: '#ffebee' }]}>
                            <Text style={{ color: '#c62828', fontWeight: 'bold', fontSize: 12 }}>
                                ❌ DITOLAK
                            </Text>
                        </View>
                    )}
                    {isVoid && (
                        <View style={[styles.statusBanner, { backgroundColor: '#f5f5f5' }]}>
                            <Text style={{ color: '#757575', fontWeight: 'bold', fontSize: 12 }}>
                                🚫 DIBATALKAN (VOID)
                            </Text>
                        </View>
                    )}

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.content}
                    >
                        {/* Amount Box */}
                        <View style={[styles.amountBox, { backgroundColor: isIncome ? '#e8f5e9' : '#ffebee' }]} >
                            <Text style={styles.labelAmount} >{isIncome ? 'Uang Masuk' : 'Uang Keluar'}</Text>
                            <Text style={styles.amountText} >{formattedAmount}</Text>
                        </View>

                        {/* Detail Info Grid */}
                        <View style={styles.gridRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Tanggal</Text>
                                <Text style={styles.value}>{formattedDate}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.label}>Akun</Text>
                                <Text style={styles.value}>{transaction.account}</Text>
                            </View>
                        </View>

                        <View style={styles.gridRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Kategori</Text>
                                <Text style={styles.value}>{transaction.category}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.label}>Dibuat Oleh</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.value, { fontWeight: 'bold' }]}>
                                        {transaction.createdByName || 'User'}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                                        ({transaction.createdByRole})
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Catatan */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Catatan / Keterangan</Text>
                            <View style={styles.noteBox}>
                                <Text style={styles.noteText}>
                                    {transaction.note ? transaction.note : '- Tidak ada catatan -'}
                                </Text>
                            </View>
                        </View>

                        {/* Bukti Link */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Bukti Transaksi</Text>
                            {transaction.proofLink ? (
                                <TouchableOpacity style={styles.linkCard} onPress={handleOpenLink}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="document-text-outline" size={24} color="#1a5dab" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.linkTitle}>Lampiran Bukti</Text>
                                        <Text style={styles.linkSubtitle} numberOfLines={1}>
                                            {transaction.proofLink}
                                        </Text>
                                    </View>
                                    <Ionicons name="open-outline" size={20} color="#666" />
                                </TouchableOpacity>
                            ) : (
                                <Text style={{ color: '#aaa', fontStyle: 'italic', marginTop: 5 }}>
                                    Tidak ada link bukti dilampirkan.
                                </Text>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        {showApproveButton ? (
                            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                                {/* Tombol Tolak */}
                                <TouchableOpacity 
                                    style={[styles.btn, { backgroundColor: '#c62828', flex: 1 }]} 
                                    onPress={handleReject}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                    <Text style={styles.btnTextWhite}>TOLAK</Text>
                                </TouchableOpacity>

                                {/* Tombol Setuju / Verifikasi */}
                                <TouchableOpacity 
                                    style={[styles.btn, { backgroundColor: '#2e7d32', flex: 2 }]} 
                                    onPress={handleApprove}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                    <Text style={styles.btnTextWhite}>{getApproveLabel()}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : canEditDelete() ? (
                            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                                <TouchableOpacity 
                                    style={[styles.btn, { backgroundColor: '#c62828', flex: 1 }]} 
                                    onPress={handleDelete}
                                >
                                    <Ionicons name="trash-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                    <Text style={styles.btnTextWhite}>Hapus</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.btn, { backgroundColor: '#1a5dab', flex: 1 }]} 
                                    onPress={handleEdit}
                                >
                                    <Ionicons name="create-outline" size={20} color="white" style={{ marginRight: 5 }} />
                                    <Text style={styles.btnTextWhite}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{flexDirection:'row', alignItems:'center', opacity: 0.6}}>
                                <Ionicons name="lock-closed-outline" size={16} color="#555" />
                                <Text style={{ color: '#555', marginLeft: 5 }}>Transaksi Terkunci (Final)</Text>
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
    header: { 
        padding: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20 
    },
    dragHandle: { 
        width: 40, 
        height: 5, 
        backgroundColor: '#ddd', 
        borderRadius: 5, 
        marginBottom: 10 
    },
    headerContent: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        width: '100%', 
        paddingHorizontal: 10, 
        alignItems: 'center' 
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    
    // Banner Style
    statusBanner: {
        alignItems: 'center',
        paddingVertical: 8,
        width: '100%'
    },

    content: { padding: 20, paddingBottom: 50 },
    
    amountBox: { 
        alignItems: 'center', 
        padding: 20, 
        borderRadius: 12, 
        marginBottom: 20 
    },
    labelAmount: { fontSize: 14, color: '#666', marginBottom: 5 },
    amountText: { fontSize: 24, fontWeight: 'bold' },
    
    gridRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 20 
    },
    
    label: { fontSize: 12, color: '#888', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: '#333' },
    
    section: { marginTop: 15 },
    noteBox: { 
        backgroundColor: '#f9f9f9', 
        padding: 15, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: '#eee' 
    },
    noteText: { color: '#444', lineHeight: 22 },
    
    linkCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee',
        gap: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
        marginTop: 8
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center'
    },
    linkTitle: { fontWeight: 'bold', color: '#333', fontSize: 14 },
    linkSubtitle: { color: '#888', fontSize: 12 },

    footer: { 
        padding: 20, 
        borderTopWidth: 1, 
        borderTopColor: '#eee', 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'white',
        paddingBottom: 30
    },
    btn: { 
        paddingVertical: 14, 
        paddingHorizontal: 15,
        borderRadius: 10, 
        alignItems: 'center', 
        justifyContent:'center', 
        flexDirection:'row' 
    },
    btnTextWhite: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 14 
    }
});

export default TransactionDetailModal;