import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';  

export default function TabLayout() {
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
        name="laporan" 
        options={{
          title: 'Laporan',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}