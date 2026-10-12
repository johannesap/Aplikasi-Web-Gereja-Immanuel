import Constants from 'expo-constants';
import { View } from 'react-native';
import { ContactInfo, LinkCard } from '@/components/church';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { Section, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/queries';
import { colors, space } from '@/theme';

export default function MoreScreen() {
  const profile = useProfile();
  const { status, user } = useAuth();

  return (
    <Screen onRefresh={() => profile.refetch()} refreshing={profile.isRefetching}>
      <View style={{ gap: space.md }}>
        <LinkCard icon="help-circle-outline" title="FAQ" subtitle="Pertanyaan yang sering diajukan" href="/faq" />
      </View>

      <Section title="Kontak Gereja">
        <QueryView query={profile} lines={2}>
          {(p) => <ContactInfo profile={p} />}
        </QueryView>
      </Section>

      <Section title="Pengelola">
        {status === 'authed' && user ? (
          <LinkCard icon="grid-outline" title="Dashboard Pengelola" subtitle={`Masuk sebagai ${user.name}`} href="/admin" />
        ) : (
          <LinkCard icon="lock-closed-outline" title="Login Pengelola" subtitle="Khusus Majelis dan Sekretariat" href="/login" />
        )}
      </Section>

      <T variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Versi {Constants.expoConfig?.version ?? '1.0.0'}
      </T>
    </Screen>
  );
}
