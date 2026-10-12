import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, space } from '@/theme';
import { AppImage, Logo } from './church';
import { T, type IconName } from './ui';

// Contoh sambutan yang tampil bila Sekretariat belum mengisi "Sambutan di Beranda". Bukan pernyataan resmi gereja.
export const DEFAULT_WELCOME = 'Bertumbuh dalam iman, hidup dalam kasih, dan melayani bersama.';

function greeting(hour = new Date().getHours()) {
  if (hour < 11) return 'SELAMAT PAGI';
  if (hour < 15) return 'SELAMAT SIANG';
  if (hour < 18) return 'SELAMAT SORE';
  return 'SELAMAT MALAM';
}

// ponytail: daftar tetap (TB) bergilir per hari; pindahkan ke konten admin bila Sekretariat ingin mengatur sendiri.
const VERSES = [
  { text: 'TUHAN adalah gembalaku, takkan kekurangan aku.', ref: 'Mazmur 23:1' },
  { text: 'Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.', ref: 'Filipi 4:13' },
  { text: 'Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu.', ref: 'Matius 11:28' },
  { text: 'Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri.', ref: 'Amsal 3:5' },
  { text: 'Barangsiapa tidak mengasihi, ia tidak mengenal Allah, sebab Allah adalah kasih.', ref: '1 Yohanes 4:8' },
  {
    text: 'Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.',
    ref: 'Yohanes 3:16',
  },
  { text: 'Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti.', ref: 'Mazmur 46:2' },
];

export function VerseCard() {
  const verse = VERSES[Math.floor(Date.now() / 86_400_000) % VERSES.length];
  return (
    <View style={styles.verse} accessible accessibilityLabel={`Firman hari ini, ${verse.ref}: ${verse.text}`}>
      <View style={styles.header}>
        <Ionicons name="book" size={18} color={colors.gold} />
        <T variant="caption" color={colors.primaryDeep} style={styles.eyebrow}>
          FIRMAN HARI INI
        </T>
      </View>
      <T variant="subtitle" color={colors.text} style={{ fontStyle: 'italic', fontWeight: '500' }}>
        “{verse.text}”
      </T>
      <T variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
        {verse.ref}
      </T>
    </View>
  );
}

export function ChurchHeader({ name, logoUrl }: { name?: string; logoUrl?: string }) {
  return (
    <View style={styles.header}>
      <Logo uri={logoUrl} size={44} />
      <View style={{ flex: 1 }}>
        <T variant="caption" color={colors.primary} style={styles.eyebrow}>
          {greeting()}
        </T>
        <T variant="subtitle" color={colors.primaryDeep} numberOfLines={1} accessibilityRole="header">
          {name?.replace(/^Gereja\s+/i, '') || 'POUK Immanuel Kopassus'}
        </T>
      </View>
    </View>
  );
}

/** Foto gereja dengan lapisan ungu agar teks putih selalu terbaca; tanpa foto → panel ungu tua dengan logo samar. */
export function HeroSection({ name, welcome, imageUrl, logoUrl }: { name: string; welcome?: string; imageUrl?: string; logoUrl?: string }) {
  const fg = colors.white;
  return (
    <View style={styles.hero}>
      {imageUrl ? (
        <>
          <AppImage url={imageUrl} style={StyleSheet.absoluteFill} label={`Foto ${name}`} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
        </>
      ) : (
        <View style={styles.heroMark} importantForAccessibility="no-hide-descendants">
          <Logo uri={logoUrl} size={160} />
        </View>
      )}
      <View style={{ gap: space.sm }}>
        <T variant="caption" color={colors.primaryLight} style={styles.eyebrow}>
          SELAMAT DATANG DI
        </T>
        <T variant="hero" color={fg} style={{ fontSize: 26, lineHeight: 32 }}>
          {name.replace(/^Gereja\s+/i, '')}
        </T>
        <View style={styles.goldRule} />
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
    minHeight: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: space.xl,
    backgroundColor: colors.primaryDeep,
  },
  heroMark: { position: 'absolute', right: -24, top: -24, opacity: 0.12 },
  goldRule: { width: 48, height: 3, borderRadius: 2, backgroundColor: colors.gold },
  verse: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.goldLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
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
