import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authService } from '@/services/authService';

export default function TabLayout() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      
      const isExpired = await authService.checkAndAutoLogout();
      if (isExpired) {
        console.log("Token expired when returning to app, redirecting to login...");
        router.replace('/login');
      }
    }
    appState.current = nextAppState;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: '#1a5dab', 
        tabBarInactiveTintColor: 'gray', 
        tabBarStyle: {
          height: 100,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="uang_masuk"
        options={{
          title: 'Uang Masuk',
          tabBarIcon: ({ color }) => <Ionicons name="arrow-down-circle" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="uang_keluar" 
        options={{
          title: 'Uang Keluar',
          tabBarIcon: ({ color }) => <Ionicons name="arrow-up-circle" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="transfer" 
        options={{
          title: 'Transfer',
          tabBarIcon: ({ color }) => <Ionicons name="swap-horizontal" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="laporan" 
        options={{
          title: 'Laporan',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}