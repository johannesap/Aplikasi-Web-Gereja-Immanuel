import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { colors, space } from '@/theme';
import { Logo } from './church';
import { T } from './ui';

/**
 * Lanjutan splash native: logo muncul lembut lalu layar memudar ke Beranda (±1,2 detik).
 * Beranda sudah mulai memuat data di belakang layar ini.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const screen = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    SplashScreen.hideAsync();
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        logo.setValue(1);
        text.setValue(1);
        setTimeout(onDone, 500);
        return;
      }
      const t = (v: Animated.Value, toValue: number, duration: number) =>
        Animated.timing(v, { toValue, duration, useNativeDriver: true });
      Animated.sequence([
        t(logo, 1, 450),
        t(text, 1, 300),
        Animated.delay(250),
        t(screen, 0, 300),
      ]).start(() => onDone());
    });
    return () => {
      cancelled = true;
    };
  }, [logo, text, screen, onDone]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: screen }]} pointerEvents="none">
      <Animated.View
        style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }] }}
      >
        <Logo size={120} />
      </Animated.View>
      <Animated.View
        style={{ opacity: text, alignItems: 'center', transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
      >
        <T variant="caption" color={colors.primary} style={{ letterSpacing: 2, fontWeight: '600' }}>
          GEREJA
        </T>
        <T variant="title" color={colors.primaryDeep} style={{ textAlign: 'center' }}>
          POUK Immanuel Kopassus
        </T>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: space.xl },
});
