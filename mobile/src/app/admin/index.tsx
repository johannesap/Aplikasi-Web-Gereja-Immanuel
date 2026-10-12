import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LinkCard } from '@/components/church';
import { ChurchHeader } from '@/components/home';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { Button, Card, Section, StatusBadge, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatClock } from '@/lib/date';
import { useProfile } from '@/lib/queries';
import { RESOURCES, type ResourceDef } from '@/lib/resources';
import { colors, radius, space } from '@/theme';
import type { Status } from '@/types';

interface Dashboard {
  counts: Record<ResourceDef['key'], { total: number; published: number; draft: number }>;
  upcomingEvents: { _id: string; title: string; startAt: string; status: Status }[];
  recentlyUpdated: { resource: ResourceDef['key']; id: string; title: string; status: Status; updatedAt: string }[];
}

const ROLE_LABEL = { majelis: 'Majelis', sekretariat: 'Sekretariat' };

const openItem = (resource: string, id: string) =>
  router.push({ pathname: '/admin/content/[resource]/[id]', params: { resource, id } });

export default function AdminDashboard() {
  const { user, can, logout } = useAuth();
  const profile = useProfile();
  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<Dashboard>('/api/admin/dashboard', { auth: true }),
  });

  const confirmLogout = () =>
    Alert.alert('Keluar', 'Keluar dari akun pengelola di perangkat ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/more');
        },
      },
    ]);

  return (
    <Screen onRefresh={() => dashboard.refetch()} refreshing={dashboard.isRefetching}>
      <ChurchHeader name={profile.data?.name} logoUrl={profile.data?.logoUrl} />
      <View style={styles.greeting}>
        <T variant="title" color={colors.white}>
          Shalom, {user?.name}
        </T>
        <T color={colors.primaryLight}>
          {user ? ROLE_LABEL[user.role] : ''}
          {user?.isSuperAdmin ? ' · Super admin' : ''}
        </T>
      </View>

      <QueryView query={dashboard} lines={2}>
        {(d) => (
          <>
            <View style={styles.grid}>
              {Object.values(RESOURCES).map((r) => (
                <Pressable
                  key={r.key}
                  style={styles.stat}
                  onPress={() => router.push({ pathname: '/admin/content/[resource]', params: { resource: r.key } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}: ${d.counts[r.key].total} total, ${d.counts[r.key].draft} draft`}
                >
                  <T variant="hero" color={colors.primary}>
                    {d.counts[r.key].total}
                  </T>
                  <T variant="subtitle" style={{ fontSize: 15 }}>
                    {r.title}
                  </T>
                  <T variant="caption" color={colors.textMuted}>
                    {d.counts[r.key].published} tayang · {d.counts[r.key].draft} draft
                  </T>
                </Pressable>
              ))}
            </View>

            {d.upcomingEvents.length > 0 && (
              <Section title="Acara Mendatang">
                {d.upcomingEvents.map((e) => (
                  <Card key={e._id} onPress={() => openItem('events', e._id)} accessibilityLabel={e.title} style={styles.rowCard}>
                    <View style={{ flex: 1 }}>
                      <T variant="subtitle" style={{ fontSize: 15 }} numberOfLines={1}>
                        {e.title}
                      </T>
                      <T variant="caption" color={colors.textMuted}>
                        {formatDate(e.startAt)} · {formatClock(e.startAt)} WIB
                      </T>
                    </View>
                    <StatusBadge status={e.status} />
                  </Card>
                ))}
              </Section>
            )}

            {d.recentlyUpdated.length > 0 && (
              <Section title="Terakhir Diperbarui">
                {d.recentlyUpdated.map((i) => (
                  <Card key={i.id} onPress={() => openItem(i.resource, i.id)} accessibilityLabel={i.title} style={styles.rowCard}>
                    <View style={{ flex: 1 }}>
                      <T variant="subtitle" style={{ fontSize: 15 }} numberOfLines={1}>
                        {i.title}
                      </T>
                      <T variant="caption" color={colors.textMuted}>
                        {RESOURCES[i.resource].title} · {formatDate(i.updatedAt, false)}
                      </T>
                    </View>
                    <StatusBadge status={i.status} />
                  </Card>
                ))}
              </Section>
            )}
          </>
        )}
      </QueryView>

      <Section title="Kelola">
        <View style={{ gap: space.md }}>
          <LinkCard icon="business-outline" title="Profil Gereja" subtitle="Identitas, sambutan, alamat, kontak" href="/admin/profile" />
          {Object.values(RESOURCES).map((r) => (
            <LinkCard
              key={r.key}
              icon={r.icon}
              title={r.title}
              subtitle={can('content:edit') ? `Tambah, ubah, publikasi ${r.singular}` : `Tinjau dan publikasi ${r.singular}`}
              href={{ pathname: '/admin/content/[resource]', params: { resource: r.key } }}
            />
          ))}
          {can('users:manage') && <LinkCard icon="people-circle-outline" title="Akun Pengelola" subtitle="Maksimal 15 akun aktif" href="/admin/users" />}
          {can('audit:read') && <LinkCard icon="document-text-outline" title="Riwayat Aktivitas" subtitle="Siapa mengubah apa dan kapan" href="/admin/audit" />}
          <LinkCard icon="key-outline" title="Ganti Kata Sandi" subtitle="Perbarui kata sandi akun Anda" href="/admin/change-password" />
        </View>
      </Section>

      <Button title="Keluar" icon="log-out-outline" variant="secondary" onPress={confirmLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { backgroundColor: colors.primary, borderRadius: radius.md, padding: space.lg, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
