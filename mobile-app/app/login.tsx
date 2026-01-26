import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import FloatingInput from '@/components/FloatingInput';
import { useTransaction, UserRole } from '@/context/TransactionContext';

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
  });

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

  // Simulasi Role 
const { setUserRole, setUserName, recordLog } = useTransaction();
const handleLogin = async() => {
    if (validate()) {
      setIsLoading(true);
      
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dummyToken = "abc-123-token-rahasia";

      let role: UserRole = 'staff'; 
      let name = 'User'; 
      const lowerEmail = email.toLowerCase();
      
      if(lowerEmail.includes('admin')) {
          role = 'admin';
          name = 'Pak Bos (Administrator)'; 
      } else if(lowerEmail.includes('finance')) {
          role = 'finance';
          name = 'Bu Bendahara'; 
      } else {
          // Kalau staff, ambil nama dari depan email (misal: budi@gmail.com -> Budi)
          const nameFromEmail = email.split('@')[0];
          name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      }

      // Simpan ke HP (SecureStore)
      await SecureStore.setItemAsync('userToken', dummyToken);
      await SecureStore.setItemAsync('userRole', role);
      await SecureStore.setItemAsync('userName', name);
      
      recordLog('LOGIN', 'System', `${name} (${role}) berhasil login ke aplikasi`)
      setUserRole(role); 
      setUserName(name);
      
      // Pindah ke Dashboard
      setIsLoading(false);
      setEmail('');
      setPassword('');
      router.replace('/(tabs)');
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