import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import FloatingInput from '@/components/FloatingInput';
import { useTransaction } from '@/context/TransactionContext';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({email: '', password: ''});
  const validate = () => {
    let valid = true;
    let newErrors = {email: '', password: ''};

    if (!email) {
      newErrors.email = 'Email Wajib diisi!';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { 
      newErrors.email = 'Format email tidak sesuai!';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi!';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }
  // cek token pas app mulai
  useEffect(() => {
    checkloginStatus();
  }, []);

  const checkloginStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        router.replace('/(tabs)');
      }

    } catch (error) {
      console.log("Error Reading token", error);
    } finally {
      setIsLoading(false)
    }
  }

const { setUserRole, setUserName, recordLog, refreshTransactions } = useTransaction();
const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      
      // console.log("Login Sukses:", data); 

      const roleDiterima = data.user.role || 'staff';
      const namaDiterima = data.user.name;
      setUserRole(roleDiterima as any); 
      setUserName(namaDiterima);
      
      // Refresh transaksi setelah login berhasil
      await refreshTransactions();
      
      await recordLog('LOGIN', 
          'System', 
          `${namaDiterima} (${roleDiterima}) login ke aplikasi`,
          namaDiterima, 
          roleDiterima);

      setEmail('');
      setPassword('');
      router.replace('/(tabs)');

    } catch (error: any) {
      // console.error("Login Gagal:", error);
      Alert.alert("Login Gagal", typeof error === 'string' ? error : "Periksa email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#1a5dab" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>E-CashBook Login</Text>
        <Text style={styles.subtitle}>Masuk sebagai Admin/Bendahara</Text>

        <FloatingInput
          style={styles.input}
          label="Email"
          value={email}
          onChangeText={(text) => {setEmail(text); setErrors({...errors, email: ''});}}
          autoCapitalize="none"
          keyboardType='email-address'
          errorText={errors.email}
        />

        <FloatingInput
          style={styles.input}
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {setPassword(text); setErrors({...errors, password: ''});}}
          errorText={errors.password}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>MASUK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0f2f5' },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 15, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a5dab', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'gray', marginBottom: 25, textAlign: 'center' },
  label: { marginBottom: 5, fontWeight: '600', color: '#333' },
  input: {
    // borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    // padding: 12, marginBottom: 15, backgroundColor: '#fafafa'
  },
  button: {
    backgroundColor: '#1a5dab', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});