import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { AppImage } from '@/components/church';
import { EmptyState, ErrorState, Skeleton } from '@/components/states';
import { Card, T } from '@/components/ui';
import { usePaged } from '@/lib/queries';
import { colors, contentWidth, space } from '@/theme';
import type { Commission } from '@/types';

export default function CommissionsScreen() {
  const list = usePaged<Commission>('/api/public/commissions');
  return (
    <FlatList
      style={{ backgroundColor: colors.softBg }}
      contentContainerStyle={{ ...contentWidth, padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
      data={list.items}
      keyExtractor={(c) => c._id}
      renderItem={({ item }) => (
        <Card
          onPress={() => router.push({ pathname: '/commissions/[id]', params: { id: item._id } })}
          accessibilityLabel={`${item.name}, lihat detail`}
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <AppImage url={item.imageUrl} style={{ width: '100%', aspectRatio: 16 / 9 }} label={`Foto ${item.name}`} />
          <View style={{ padding: space.lg, gap: space.sm }}>
            <T variant="subtitle">{item.name}</T>
            {!!item.description && (
              <T color={colors.textMuted} numberOfLines={2}>
                {item.description}
              </T>
            )}
            {/* Seluruh kartu bisa disentuh; label ini penanda visualnya. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <T color={colors.primary} style={{ fontWeight: '600' }}>
                Lihat Detail
              </T>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </View>
          </View>
        </Card>
      )}
      ListEmptyComponent={
        list.isPending ? (
          <Skeleton />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : (
          <EmptyState icon="people-outline" title="Belum ada komisi" message="Daftar komisi akan ditambahkan oleh Sekretariat." />
        )
      }
      ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
      onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={() => list.refetch()} tintColor={colors.primary} colors={[colors.primary]} />}
    />
  );
}
