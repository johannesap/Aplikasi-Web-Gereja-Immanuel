import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { imageUri } from '@/lib/api';
import { dateBadge, formatDate, formatTimeRange, isPast } from '@/lib/date';
import { colors, radius, space, TOUCH } from '@/theme';
import type { ChurchEvent, ChurchProfile } from '@/types';
import { Card, T, useReduceMotion, type IconName } from './ui';

// Ganti assets/logo.png dengan logo resmi, atau unggah logo lewat Dashboard Pengelola → Profil Gereja.
const LOGO = require('../../assets/logo.png');

export function Logo({ uri, size = 48 }: { uri?: string; size?: number }) {
  return (
    <Image
      source={imageUri(uri) ? { uri: imageUri(uri) } : LOGO}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Logo Gereja POUK Immanuel Kopassus"
    />
  );
}

/** Gambar dari server dengan cache disk dan transisi lembut; tidak dirender bila URL kosong. */
export function AppImage({ url, style, label }: { url?: string; style: StyleProp<ImageStyle>; label: string }) {
  const uri = imageUri(url);
  if (!uri) return null;
  return (
    <Image
      source={{ uri }}
      style={[{ backgroundColor: colors.primaryLight }, style]}
      contentFit="cover"
      transition={200}
      cachePolicy="disk"
      accessibilityLabel={label}
    />
  );
}

/** Teks penanda untuk informasi yang belum diisi Sekretariat — tidak pernah mengarang isi. */
export function NotFilled({ what = 'Informasi' }: { what?: string }) {
  return (
    <T color={colors.textMuted} style={{ fontStyle: 'italic' }}>
      {what} belum diisi oleh Sekretariat.
    </T>
  );
}

function MetaLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <T variant="caption" color={colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

export function EventCard({ event, compact }: { event: ChurchEvent; compact?: boolean }) {
  const badge = dateBadge(event.startAt);
  const past = isPast(event.startAt, event.endAt);
  return (
    <Card
      onPress={() => router.push({ pathname: '/events/[id]', params: { id: event._id } })}
      accessibilityLabel={`${event.title}, ${formatDate(event.startAt)}, lihat detail`}
      style={{ padding: 0, overflow: 'hidden' }}
    >
      {!compact && <AppImage url={event.imageUrl} style={{ width: '100%', aspectRatio: 16 / 9 }} label={`Gambar ${event.title}`} />}
      <View style={{ flexDirection: 'row', gap: space.md, padding: space.lg }}>
        <View style={[styles.dateBadge, past && { backgroundColor: colors.border }]}>
          <T variant="title" color={past ? colors.textMuted : colors.primary} style={{ lineHeight: 26 }}>
            {badge.day}
          </T>
          <T variant="caption" color={past ? colors.textMuted : colors.primaryDeep}>
            {badge.month}
          </T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="subtitle" numberOfLines={2}>
            {event.title}
          </T>
          <MetaLine icon="calendar-outline" text={formatDate(event.startAt)} />
          <MetaLine icon="time-outline" text={formatTimeRange(event.startAt, event.endAt)} />
          {!!event.location && <MetaLine icon="location-outline" text={event.location} />}
        </View>
        {compact && event.imageUrl ? (
          <AppImage url={event.imageUrl} style={styles.thumb} label={`Poster ${event.title}`} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ alignSelf: 'center' }} />
        )}
      </View>
    </Card>
  );
}

/** Baris info kontak; bila ada `href` bisa disentuh untuk membuka telepon/email/peta/tautan. */
export function InfoRow({ icon, label, value, href }: { icon: IconName; label: string; value?: string; href?: string }) {
  if (!value) return null;
  const content = (
    <>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="caption" color={colors.textMuted}>
          {label}
        </T>
        <T color={href ? colors.primary : colors.text}>{value}</T>
      </View>
      {href && <Ionicons name="open-outline" size={18} color={colors.textMuted} />}
    </>
  );
  if (!href) return <View style={styles.info}>{content}</View>;
  return (
    <Pressable
      style={styles.info}
      onPress={() => Linking.openURL(href)}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
    >
      {content}
    </Pressable>
  );
}

/** Alamat, kontak, dan media sosial dari profil gereja. Kosong → penanda "belum diisi". */
export function ContactInfo({ profile }: { profile: ChurchProfile }) {
  const { address, mapsUrl, phone, email, website, socials = {} } = profile;
  const hasAny = address || phone || email || website || socials.instagram || socials.facebook || socials.youtube;
  if (!hasAny) return <NotFilled what="Alamat dan kontak" />;
  return (
    <View>
      <InfoRow icon="location-outline" label="Alamat" value={address} href={mapsUrl || undefined} />
      <InfoRow icon="call-outline" label="Telepon" value={phone} href={phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined} />
      <InfoRow icon="mail-outline" label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
      <InfoRow icon="globe-outline" label="Situs web" value={website} href={website} />
      <InfoRow icon="logo-instagram" label="Instagram" value={socials.instagram} href={socials.instagram} />
      <InfoRow icon="logo-facebook" label="Facebook" value={socials.facebook} href={socials.facebook} />
      <InfoRow icon="logo-youtube" label="YouTube" value={socials.youtube} href={socials.youtube} />
    </View>
  );
}

/** Item accordion; letakkan beberapa di dalam satu Card, garis pemisah tipis memisahkan antar-item. */
export function Accordion({ title, children, first }: { title: string; children: ReactNode; first?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const toggle = () => {
    setOpen(!open);
    progress.setValue(open ? 1 : 0);
    Animated.timing(progress, { toValue: open ? 0 : 1, duration: reduce ? 0 : 200, useNativeDriver: true }).start();
  };
  return (
    <View style={!first && styles.divider}>
      <Pressable
        onPress={toggle}
        style={styles.accordionHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <T variant="subtitle" style={{ flex: 1, fontSize: 16 }}>
          {title}
        </T>
        <Animated.View style={{ transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </Animated.View>
      </Pressable>
      {open && (
        <Animated.View
          style={{
            paddingHorizontal: space.lg,
            paddingBottom: space.lg,
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
          }}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    width: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH, paddingVertical: space.sm },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, alignSelf: 'center' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  accordionHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingHorizontal: space.lg, paddingVertical: space.md },
});

export function LinkCard({ icon, title, subtitle, href }: { icon: IconName; title: string; subtitle: string; href: Href }) {
  return (
    <Card onPress={() => router.push(href)} accessibilityLabel={title} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="subtitle" style={{ fontSize: 16 }}>
          {title}
        </T>
        <T variant="caption" color={colors.textMuted}>
          {subtitle}
        </T>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Card>
  );
}
