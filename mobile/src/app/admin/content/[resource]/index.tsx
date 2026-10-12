import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { EmptyState, ErrorState, Skeleton } from '@/components/states';
import { Card, Chips, SearchBar, StatusBadge, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { usePaged } from '@/lib/queries';
import { RESOURCES, isResourceKey } from '@/lib/resources';
import { colors, contentWidth, space, TOUCH } from '@/theme';

type StatusFilter = '' | 'draft' | 'published';
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Tayang' },
];

export default function AdminContentList() {
  const { resource } = useLocalSearchParams<{ resource: string }>();
  const { can } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const def = isResourceKey(resource) ? RESOURCES[resource] : null;
  const list = usePaged<Record<string, any>>(`/api/admin/${def?.key ?? 'events'}`, { status, q }, true);
  if (!def) return <EmptyState icon="alert-circle-outline" title="Jenis konten tidak dikenal" />;

  const open = (id: string) => router.push({ pathname: '/admin/content/[resource]/[id]', params: { resource: def.key, id } });

  return (
    <>
      <Stack.Screen
        options={{
          title: def.title,
          headerRight: can('content:edit')
            ? () => (
                <Pressable
                  onPress={() => open('new')}
                  accessibilityRole="button"
                  accessibilityLabel={`Tambah ${def.singular}`}
                  style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="add-circle" size={30} color={colors.primary} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <FlatList
        style={{ backgroundColor: colors.softBg }}
        contentContainerStyle={{ ...contentWidth, padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
        data={list.items}
        keyExtractor={(i) => i._id}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <SearchBar value={search} onChangeText={setSearch} placeholder={`Cari ${def.singular}`} />
            <Chips options={FILTERS} value={status} onChange={setStatus} />
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => open(item._id)} accessibilityLabel={item[def.labelField]} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="subtitle" style={{ fontSize: 15 }} numberOfLines={2}>
                {item[def.labelField]}
              </T>
              <T variant="caption" color={colors.textMuted}>
                {def.key === 'events' ? formatDate(item.startAt) : def.subtitle?.(item) || `Diubah ${formatDate(item.updatedAt, false)}`}
              </T>
            </View>
            <StatusBadge status={item.status} />
          </Card>
        )}
        ListEmptyComponent={
          list.isPending ? (
            <Skeleton />
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : (
            <EmptyState
              icon={def.icon}
              title={q || status ? 'Tidak ada yang cocok' : `Belum ada ${def.singular}`}
              message={can('content:edit') && !q && !status ? 'Ketuk tombol + di kanan atas untuk menambah.' : undefined}
            />
          )
        }
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={() => list.refetch()} tintColor={colors.primary} colors={[colors.primary]} />}
        keyboardShouldPersistTaps="handled"
      />
    </>
  );
}
