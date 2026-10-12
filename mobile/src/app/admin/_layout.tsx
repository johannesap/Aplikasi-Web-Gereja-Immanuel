import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors, stackScreenOptions } from '@/theme';

// Penjaga di sisi aplikasi hanya untuk kenyamanan; server tetap memeriksa token dan izin di setiap request.
export default function AdminLayout() {
  const { status, user } = useAuth();
  const segments = useSegments();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (status !== 'authed' || !user) return <Redirect href="/login" />;
  if (user.mustChangePassword && segments[segments.length - 1] !== 'change-password') {
    return <Redirect href="/admin/change-password" />;
  }

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Dashboard Pengelola' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil Gereja' }} />
      <Stack.Screen name="change-password" options={{ title: 'Ganti Kata Sandi' }} />
      <Stack.Screen name="audit" options={{ title: 'Riwayat Aktivitas' }} />
      <Stack.Screen name="users/index" options={{ title: 'Akun Pengelola' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'Akun' }} />
    </Stack>
  );
}
