import { View } from 'react-native';
import { AppImage, LinkCard, Logo, NotFilled } from '@/components/church';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { T } from '@/components/ui';
import { useProfile } from '@/lib/queries';
import { colors, radius, space } from '@/theme';

export default function AboutScreen() {
  const profile = useProfile();
  return (
    <Screen onRefresh={() => profile.refetch()} refreshing={profile.isRefetching}>
      <QueryView query={profile} lines={2}>
        {(p) => (
          <View style={{ gap: space.lg }}>
            {p.photoUrl ? (
              <AppImage url={p.photoUrl} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg }} label="Foto gereja" />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Logo uri={p.logoUrl} size={56} />
              <T variant="title" color={colors.primaryDeep} style={{ flex: 1 }}>
                {p.name}
              </T>
            </View>
            {p.shortDescription ? <T>{p.shortDescription}</T> : <NotFilled what="Deskripsi singkat" />}
          </View>
        )}
      </QueryView>
      <View style={{ gap: space.md }}>
        <LinkCard icon="business-outline" title="Profil Gereja" subtitle="Identitas, deskripsi, dan kontak" href="/profile" />
        <LinkCard icon="time-outline" title="Sejarah Gereja" subtitle="Perjalanan gereja dari masa ke masa" href="/history" />
        <LinkCard icon="people-outline" title="Komisi-Komisi" subtitle="Pelayanan dan kegiatan komisi" href="/commissions" />
      </View>
    </Screen>
  );
}
