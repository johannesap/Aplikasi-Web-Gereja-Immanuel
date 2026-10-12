import { Ionicons } from '@expo/vector-icons';
import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ApiError, NETWORK_ERROR } from '@/lib/api';
import { colors, radius, space } from '@/theme';
import { Button, T, useReduceMotion, type IconName } from './ui';

/** Skeleton ringan: blok abu-ungu yang berdenyut pelan (diam bila Reduce Motion aktif). */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, opacity]);

  return (
    <Animated.View style={{ gap: space.md, opacity }} accessibilityLabel="Memuat" accessibilityRole="progressbar">
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={[styles.block, { height: i === 0 ? 140 : 72 }]} />
      ))}
    </Animated.View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = error instanceof ApiError && error.status === 0;
  const message = error instanceof Error ? error.message : NETWORK_ERROR;
  return (
    <EmptyState
      icon={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
      title={offline ? 'Tidak ada koneksi' : 'Gagal memuat'}
      message={message}
      action={onRetry && <Button title="Coba lagi" icon="refresh" variant="secondary" onPress={onRetry} />}
    />
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <T variant="subtitle" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {!!message && (
        <T color={colors.textMuted} style={{ textAlign: 'center' }}>
          {message}
        </T>
      )}
      {action}
    </View>
  );
}

/** Menampilkan skeleton / error / isi sesuai status query. */
export function QueryView<T>({
  query,
  children,
  lines,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  lines?: number;
}) {
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <Skeleton lines={lines} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.primaryLight, borderRadius: radius.md },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
