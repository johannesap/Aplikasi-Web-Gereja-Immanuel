import { View } from 'react-native';
import { AppImage, ContactInfo, Logo, NotFilled } from '@/components/church';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { Card, Section, T } from '@/components/ui';
import { useProfile } from '@/lib/queries';
import { colors, radius, space } from '@/theme';

export default function ProfileScreen() {
  const profile = useProfile();
  return (
    <Screen onRefresh={() => profile.refetch()} refreshing={profile.isRefetching}>
      <QueryView query={profile}>
        {(p) => (
          <>
            <AppImage url={p.photoUrl} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg }} label="Foto gereja" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Logo uri={p.logoUrl} size={64} />
              <View style={{ flex: 1, gap: space.xs }}>
                <T variant="title" color={colors.primaryDeep} accessibilityRole="header">
                  {p.name}
                </T>
                {!!p.shortDescription && <T color={colors.textMuted}>{p.shortDescription}</T>}
              </View>
            </View>
            <Section title="Tentang Gereja">{p.description ? <T>{p.description}</T> : <NotFilled what="Deskripsi gereja" />}</Section>
            <Section title="Alamat & Kontak">
              <Card style={{ paddingVertical: space.sm }}>
                <ContactInfo profile={p} />
              </Card>
            </Section>
            {!!p.additionalInfo && (
              <Section title="Informasi Tambahan">
                <T>{p.additionalInfo}</T>
              </Section>
            )}
          </>
        )}
      </QueryView>
    </Screen>
  );
}
