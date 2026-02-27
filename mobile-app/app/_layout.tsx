import { Stack, useRouter, useSegments } from "expo-router";
import { TransactionProvider } from "@/context/TransactionContext";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import {storage} from "@/services/storage";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkTokenAndNavigate();
  }, []);

  const checkTokenAndNavigate = async () => {
    try {
      const token = await storage.getItemAsync('userToken');
      
      if (!token) {
        const inAuthGroup = segments[0] === 'login';
        if (!inAuthGroup) {
          router.replace('/login');
        }
        setIsChecking(false);
        return;
      }

      const isExpired = await authService.checkAndAutoLogout();
      
      if (isExpired) {
        console.log("Token expired, redirecting to login...");
        router.replace('/login');
      }
      
      setIsChecking(false);
    } catch (error) {
      console.error("Error checking token:", error);
      setIsChecking(false);
    }
  };

  return (
    <TransactionProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
          />
        
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
          />
      </Stack>
    </TransactionProvider>
  );
}