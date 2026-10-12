import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { Button, Card, T } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, radius, space } from '@/theme';
import type { AdminUser } from '@/types';

const ROLE_LABEL = { majelis: 'Majelis', sekretariat: 'Sekretariat' };

export default function UsersScreen() {
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api<{ items: AdminUser[]; activeCount: number; maxAccounts: number }>('/api/admin/users', { auth: true }),
  });

  return (
    <Screen onRefresh={() => users.refetch()} refreshing={users.isRefetching}>
      <QueryView query={users}>
        {({ items, activeCount, maxAccounts }) => (
          <>
            <Card style={{ backgroundColor: colors.primaryLight, borderColor: colors.primaryLight, gap: space.xs }}>
              <T variant="hero" color={colors.primary}>
                {activeCount}/{maxAccounts}
              </T>
              <T color={colors.primaryDeep}>akun pengelola aktif</T>
            </Card>
            <Button
              title="Tambah pengelola"
              icon="person-add-outline"
              disabled={activeCount >= maxAccounts}
              onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: 'new' } })}
            />
            {activeCount >= maxAccounts && (
              <T variant="caption" color={colors.textMuted}>
                Batas tercapai. Nonaktifkan akun yang tidak dipakai untuk menambah akun baru.
              </T>
            )}
            <View style={{ gap: space.md }}>
              {items.map((u) => (
                <Card
                  key={u._id}
                  onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: u._id } })}
                  accessibilityLabel={`${u.name}, ${ROLE_LABEL[u.role]}${u.isActive ? '' : ', nonaktif'}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: u.isActive ? 1 : 0.6 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <T variant="subtitle" color={colors.primary}>
                      {u.name.charAt(0).toUpperCase()}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="subtitle" style={{ fontSize: 15 }}>
                      {u.name}
                    </T>
                    <T variant="caption" color={colors.textMuted}>
                      {ROLE_LABEL[u.role]}
                      {u.isSuperAdmin ? ' · Super admin' : ''}
                      {u.isActive ? '' : ' · Nonaktif'}
                    </T>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}
      </QueryView>
    </Screen>
  );
}
