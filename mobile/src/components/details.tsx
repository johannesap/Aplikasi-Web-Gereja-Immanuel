import { View } from 'react-native';
import { formatDate, formatTimeRange, isPast } from '@/lib/date';
import { colors, radius, space } from '@/theme';
import type { ChurchEvent, Commission } from '@/types';
import { AppImage, InfoRow } from './church';
import { Card, Section, T } from './ui';

// Dipakai halaman detail publik dan pratinjau pengelola, supaya pratinjau sama persis dengan yang dilihat jemaat.

export function EventDetailView({ event: e }: { event: ChurchEvent }) {
  return (
    <>
      <AppImage url={e.imageUrl} style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: radius.lg }} label={`Poster ${e.title}`} />
      <View style={{ gap: space.sm }}>
        {isPast(e.startAt, e.endAt) && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 2 }}>
            <T variant="caption" color={colors.textMuted} style={{ fontWeight: '600' }}>
              Acara telah selesai
            </T>
          </View>
        )}
        <T variant="title" color={colors.primaryDeep} accessibilityRole="header">
          {e.title}
        </T>
      </View>
      <Card style={{ paddingVertical: space.sm }}>
        <InfoRow icon="calendar-outline" label="Tanggal" value={formatDate(e.startAt)} />
        <InfoRow icon="time-outline" label="Waktu" value={formatTimeRange(e.startAt, e.endAt)} />
        <InfoRow icon="location-outline" label="Lokasi" value={e.location} />
        <InfoRow icon="call-outline" label="Kontak panitia" value={e.contact} />
      </Card>
      {!!e.description && (
        <Section title="Deskripsi">
          <T>{e.description}</T>
        </Section>
      )}
    </>
  );
}

export function CommissionDetailView({ commission: c }: { commission: Commission }) {
  return (
    <>
      <AppImage url={c.imageUrl} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg }} label={`Foto ${c.name}`} />
      <T variant="title" color={colors.primaryDeep} accessibilityRole="header">
        {c.name}
      </T>
      {!!c.description && <T>{c.description}</T>}
      {!!c.activities && (
        <Section title="Kegiatan Utama">
          <T>{c.activities}</T>
        </Section>
      )}
      {!!c.schedule && (
        <Section title="Jadwal Kegiatan">
          <T>{c.schedule}</T>
        </Section>
      )}
      {!!c.contact && (
        <Section title="Kontak / Penanggung Jawab">
          <T>{c.contact}</T>
        </Section>
      )}
    </>
  );
}
