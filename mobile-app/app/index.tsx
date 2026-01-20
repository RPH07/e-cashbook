import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function SplashScreen() {
  
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token = await SecureStore.getItemAsync('userToken');
      
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    } catch (e) {
      console.error("error", e)
      router.replace('/login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#1a5dab" />
    </View>
  );
}