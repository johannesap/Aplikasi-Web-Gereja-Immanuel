import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { EmptyState, ErrorState, Skeleton } from '@/components/states';
import { Card, T } from '@/components/ui';
import { formatClock, formatDate } from '@/lib/date';
import { usePaged } from '@/lib/queries';
import { colors, contentWidth, space } from '@/theme';
import type { AuditEntry } from '@/types';

const ACTIONS: Record<string, string> = {
  create: 'Menambah',
  update: 'Mengubah',
  delete: 'Menghapus',
  status: 'Mengubah status',
  upload: 'Mengunggah gambar',
  login: 'Login',
  login_failed: 'Login gagal',
  account_locked: 'Akun dikunci',
  password_changed: 'Mengganti kata sandi',
  reset_password: 'Mengatur ulang kata sandi',
  revoke_sessions: 'Mengeluarkan sesi',
};

const ENTITIES: Record<string, string> = {
  events: 'acara',
  commissions: 'komisi',
  faqs: 'FAQ',
  'church-history': 'sejarah',
  'church-profile': 'profil gereja',
  users: 'akun',
  uploads: '',
  auth: '',
};

export default function AuditScreen() {
  const logs = usePaged<AuditEntry>('/api/admin/audit-logs', {}, true);
  return (
    <FlatList
      style={{ backgroundColor: colors.softBg }}
      contentContainerStyle={{ ...contentWidth, padding: space.lg, gap: space.sm, paddingBottom: space.xxl }}
      data={logs.items}
      keyExtractor={(l) => l._id}
      renderItem={({ item }) => {
        const fields = Object.keys(item.changes?.after ?? item.changes?.before ?? {});
        return (
          <Card style={{ gap: 2, paddingVertical: space.md }}>
            <T variant="subtitle" style={{ fontSize: 15 }}>
              {ACTIONS[item.action] ?? item.action} {ENTITIES[item.entity] ?? item.entity}
            </T>
            {!!item.summary && (
              <T color={colors.textMuted} numberOfLines={2}>
                {item.summary}
              </T>
            )}
            {item.action === 'update' && fields.length > 0 && (
              <T variant="caption" color={colors.textMuted}>
                Field: {fields.join(', ')}
              </T>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs }}>
              <T variant="caption" color={colors.primary}>
                {item.actorName || 'Tidak dikenal'}
              </T>
              <T variant="caption" color={colors.textMuted}>
                {formatDate(item.createdAt, false)} {formatClock(item.createdAt)}
              </T>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={
        logs.isPending ? (
          <Skeleton />
        ) : logs.isError ? (
          <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
        ) : (
          <EmptyState icon="document-text-outline" title="Belum ada aktivitas" />
        )
      }
      ListFooterComponent={logs.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
      onEndReached={() => logs.hasNextPage && !logs.isFetchingNextPage && logs.fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={logs.isRefetching && !logs.isFetchingNextPage} onRefresh={() => logs.refetch()} tintColor={colors.primary} colors={[colors.primary]} />}
    />
  );
}
