import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Intro } from '@/components/Intro';
import { AuthProvider } from '@/lib/auth';
import { colors, stackScreenOptions } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000, // konten gereja jarang berubah; hemat kuota dan baterai
      gcTime: 24 * 60 * 60_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Stack screenOptions={stackScreenOptions}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Beranda' }} />
              <Stack.Screen name="profile" options={{ title: 'Profil Gereja' }} />
              <Stack.Screen name="history" options={{ title: 'Sejarah Gereja' }} />
              <Stack.Screen name="commissions/index" options={{ title: 'Komisi-Komisi' }} />
              <Stack.Screen name="commissions/[id]" options={{ title: 'Komisi' }} />
              <Stack.Screen name="events/[id]" options={{ title: 'Detail Acara' }} />
              <Stack.Screen name="faq" options={{ title: 'FAQ' }} />
              <Stack.Screen name="login" options={{ title: 'Login Pengelola' }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
            </Stack>
            {!introDone && <Intro onDone={finishIntro} />}
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
