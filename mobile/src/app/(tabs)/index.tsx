import { router } from 'expo-router';
import { View } from 'react-native';
import { ContactInfo, EventCard } from '@/components/church';
import { ChurchHeader, FeatureMenuCard, HeroSection } from '@/components/home';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, QueryView, Skeleton } from '@/components/states';
import { Button, Card, Section } from '@/components/ui';
import { usePaged, useProfile } from '@/lib/queries';
import { space } from '@/theme';
import type { ChurchEvent } from '@/types';

const DEFAULT_NAME = 'Gereja POUK Immanuel Kopassus';

export default function HomeScreen() {
  const profile = useProfile();
  const upcoming = usePaged<ChurchEvent>('/api/public/events', { when: 'upcoming', limit: '3' });
  const p = profile.data;

  const refresh = () => {
    profile.refetch();
    upcoming.refetch();
  };

  return (
    <Screen topInset onRefresh={refresh} refreshing={profile.isRefetching || upcoming.isRefetching}>
      <ChurchHeader name={p?.name} logoUrl={p?.logoUrl} />

      <HeroSection name={p?.name || DEFAULT_NAME} welcome={p?.welcomeMessage} imageUrl={p?.heroImageUrl || p?.photoUrl} logoUrl={p?.logoUrl} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <FeatureMenuCard icon="business-outline" label="Profil Gereja" hint="Identitas dan kontak" onPress={() => router.push('/profile')} />
        <FeatureMenuCard icon="time-outline" label="Sejarah" hint="Perjalanan gereja" onPress={() => router.push('/history')} />
        <FeatureMenuCard icon="people-outline" label="Komisi" hint="Bidang pelayanan" onPress={() => router.push('/commissions')} />
        <FeatureMenuCard icon="calendar-outline" label="Acara" hint="Jadwal kegiatan" onPress={() => router.push('/events')} />
        <FeatureMenuCard wide icon="help-circle-outline" label="FAQ" hint="Pertanyaan yang sering diajukan" onPress={() => router.push('/faq')} />
      </View>

      <Section
        title="Acara Mendatang"
        action={<Button title="Lihat Semua" variant="ghost" onPress={() => router.push('/events')} style={{ paddingHorizontal: space.sm }} />}
      >
        {upcoming.isPending ? (
          <Skeleton lines={2} />
        ) : upcoming.isError ? (
          <ErrorState error={upcoming.error} onRetry={() => upcoming.refetch()} />
        ) : upcoming.items.length ? (
          <View style={{ gap: space.md }}>
            {upcoming.items.slice(0, 3).map((e) => (
              <EventCard key={e._id} event={e} compact />
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState icon="calendar-clear-outline" title="Belum ada acara terjadwal" message="Kegiatan gereja berikutnya akan tampil di sini setelah diumumkan." />
          </Card>
        )}
      </Section>

      <Section title="Informasi Gereja">
        <Card>
          <QueryView query={profile} lines={2}>
            {(data) => <ContactInfo profile={data} />}
          </QueryView>
        </Card>
      </Section>
    </Screen>
  );
}
