import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, RefreshControl, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, space } from '@/theme';
import { useReduceMotion } from './ui';

/** Fade-in singkat saat halaman dibuka (dilewati bila Reduce Motion aktif). */
export function useFadeIn() {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: reduce ? 0 : 220, useNativeDriver: true }).start();
  }, [opacity, reduce]);
  return opacity;
}

/** Kontainer halaman bergulir dengan pull-to-refresh dan safe area bawah. */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  topInset = false,
  contentStyle,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  topInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useFadeIn();
  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: colors.softBg, opacity }}
      contentContainerStyle={[
        contentWidth,
        { padding: space.lg, gap: space.xl, paddingTop: (topInset ? insets.top : 0) + space.lg, paddingBottom: insets.bottom + space.xxl },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh && <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      {children}
    </Animated.ScrollView>
  );
}
