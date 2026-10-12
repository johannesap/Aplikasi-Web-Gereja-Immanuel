import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import type { IconName } from '@/components/ui';

const icon =
  (name: IconName, active: IconName) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => <Ionicons name={focused ? active : name} size={24} color={color} />;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Tinggi bawaan (49) terlalu sempit untuk label 12 px; area aman bawah tetap ditambahkan.
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, height: 60 + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
        tabBarAllowFontScaling: false,
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.softBg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda', headerShown: false, tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="events" options={{ title: 'Acara', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="about" options={{ title: 'Tentang Gereja', tabBarLabel: 'Tentang', tabBarIcon: icon('business-outline', 'business') }} />
      <Tabs.Screen name="more" options={{ title: 'Lainnya', tabBarIcon: icon('ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle') }} />
    </Tabs>
  );
}
