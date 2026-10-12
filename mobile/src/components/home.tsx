import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, space } from '@/theme';
import { AppImage, Logo } from './church';
import { T, type IconName } from './ui';

// Contoh sambutan yang tampil bila Sekretariat belum mengisi "Sambutan di Beranda". Bukan pernyataan resmi gereja.
export const DEFAULT_WELCOME = 'Bertumbuh dalam iman, hidup dalam kasih, dan melayani bersama.';

export function ChurchHeader({ name, logoUrl }: { name?: string; logoUrl?: string }) {
  return (
    <View style={styles.header}>
      <Logo uri={logoUrl} size={44} />
      <View style={{ flex: 1 }}>
        <T variant="caption" color={colors.primary} style={styles.eyebrow}>
          GEREJA
        </T>
        <T variant="subtitle" color={colors.primaryDeep} numberOfLines={1} accessibilityRole="header">
          {name?.replace(/^Gereja\s+/i, '') || 'POUK Immanuel Kopassus'}
        </T>
      </View>
    </View>
  );
}

/** Foto gereja dengan lapisan ungu tipis agar teks putih selalu terbaca; tanpa foto → panel ungu muda. */
export function HeroSection({ name, welcome, imageUrl, logoUrl }: { name: string; welcome?: string; imageUrl?: string; logoUrl?: string }) {
  const onImage = !!imageUrl;
  const fg = onImage ? colors.white : colors.primaryDeep;
  return (
    <View style={styles.hero}>
      {onImage ? (
        <>
          <AppImage url={imageUrl} style={StyleSheet.absoluteFill} label={`Foto ${name}`} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
        </>
      ) : (
        <View style={styles.heroMark} importantForAccessibility="no-hide-descendants">
          <Logo uri={logoUrl} size={120} />
        </View>
      )}
      <View style={{ gap: space.sm }}>
        <T variant="caption" color={onImage ? colors.primaryLight : colors.primary} style={styles.eyebrow}>
          SELAMAT DATANG DI
        </T>
        <T variant="hero" color={fg} style={{ fontSize: 26, lineHeight: 32 }}>
          {name.replace(/^Gereja\s+/i, '')}
        </T>
        <T color={fg} style={{ opacity: 0.92 }}>
          {welcome || DEFAULT_WELCOME}
        </T>
      </View>
    </View>
  );
}

/** Kartu menu utama: ikon ungu di lingkaran ungu muda, sedikit mengecil saat ditekan. */
export function FeatureMenuCard({ icon, label, hint, onPress, wide }: { icon: IconName; label: string; hint: string; onPress: () => void; wide?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <Animated.View style={[wide ? { flexBasis: '100%' } : styles.half, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[styles.menu, wide ? { flexDirection: 'row', alignItems: 'center' } : { flex: 1 }]}
      >
        <View style={styles.menuIcon}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 2 }}>
          <T variant="subtitle" style={{ fontSize: 16 }}>
            {label}
          </T>
          <T variant="caption" color={colors.textMuted} numberOfLines={wide ? 1 : 2}>
            {hint}
          </T>
        </View>
        {wide && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  eyebrow: { fontWeight: '700', letterSpacing: 1.5, fontSize: 12 },
  hero: {
    minHeight: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: space.xl,
    backgroundColor: colors.primaryLight,
  },
  heroMark: { position: 'absolute', right: -16, top: -16, opacity: 0.18 },
  half: { flexBasis: '47%', flexGrow: 1 },
  menu: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
