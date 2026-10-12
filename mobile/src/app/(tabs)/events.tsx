import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EventCard } from '@/components/church';
import { EmptyState, ErrorState, Skeleton } from '@/components/states';
import { Chips, SearchBar, T } from '@/components/ui';
import { formatDate } from '@/lib/date';
import { usePaged } from '@/lib/queries';
import { colors, contentWidth, radius, space } from '@/theme';
import type { ChurchEvent } from '@/types';

type When = 'all' | 'upcoming' | 'past';

const FILTERS: { value: When; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'upcoming', label: 'Mendatang' },
  { value: 'past', label: 'Selesai' },
];

export default function EventsScreen() {
  const [when, setWhen] = useState<When>('upcoming');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400); // tunggu jeda mengetik
    return () => clearTimeout(t);
  }, [search]);

  const events = usePaged<ChurchEvent>('/api/public/events', { when, q });
  const next = usePaged<ChurchEvent>('/api/public/events', { when: 'upcoming', limit: '1' });
  const total = next.data?.pages[0]?.total ?? 0;

  return (
    <FlatList
      style={{ backgroundColor: colors.softBg }}
      contentContainerStyle={{ ...contentWidth, padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
      data={events.items}
      keyExtractor={(e) => e._id}
      renderItem={({ item }) => <EventCard event={item} />}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.sm }}>
          {total > 0 && (
            <View style={styles.summary} accessibilityRole="summary">
              <T variant="title" color={colors.white}>
                {total} acara mendatang
              </T>
              <T color={colors.primaryLight}>Terdekat: {next.items[0].title} · {formatDate(next.items[0].startAt)}</T>
            </View>
          )}
          <SearchBar value={search} onChangeText={setSearch} placeholder="Cari acara atau lokasi" />
          <Chips options={FILTERS} value={when} onChange={setWhen} />
        </View>
      }
      ListEmptyComponent={
        events.isPending ? (
          <Skeleton />
        ) : events.isError ? (
          <ErrorState error={events.error} onRetry={() => events.refetch()} />
        ) : (
          <EmptyState
            icon="calendar-clear-outline"
            title={q ? 'Acara tidak ditemukan' : when === 'past' ? 'Belum ada acara yang selesai' : 'Belum ada acara'}
            message={q ? 'Coba kata kunci lain.' : 'Informasi acara akan tampil di sini setelah diumumkan.'}
          />
        )
      }
      ListFooterComponent={events.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
      onEndReached={() => events.hasNextPage && !events.isFetchingNextPage && events.fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={events.isRefetching && !events.isFetchingNextPage}
          onRefresh={() => {
            events.refetch();
            next.refetch();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.primary, borderRadius: radius.md, padding: space.lg, gap: space.xs },
});
