import { StyleSheet, View } from 'react-native';
import { AppImage, NotFilled } from '@/components/church';
import { Screen } from '@/components/Screen';
import { EmptyState, QueryView } from '@/components/states';
import { T } from '@/components/ui';
import { useHistory } from '@/lib/queries';
import { colors, radius, space } from '@/theme';

export default function HistoryScreen() {
  const history = useHistory();
  return (
    <Screen onRefresh={() => history.refetch()} refreshing={history.isRefetching}>
      <QueryView query={history}>
        {({ intro, items }) => (
          <>
            {intro ? <T>{intro}</T> : <NotFilled what="Pengantar sejarah" />}
            {items.length === 0 ? (
              <EmptyState icon="time-outline" title="Timeline belum tersedia" message="Sejarah gereja akan ditambahkan oleh Sekretariat." />
            ) : (
              <View accessibilityRole="list">
                {items.map((e, i) => (
                  <View key={e._id} style={styles.item}>
                    <View style={styles.rail}>
                      <View style={styles.dot} />
                      {i < items.length - 1 && <View style={styles.line} />}
                    </View>
                    <View style={styles.body}>
                      <View style={styles.year}>
                        <T variant="caption" color={colors.white} style={{ fontWeight: '700' }}>
                          {e.year}
                        </T>
                      </View>
                      <T variant="subtitle">{e.title}</T>
                      {!!e.description && <T color={colors.textMuted}>{e.description}</T>}
                      <AppImage url={e.imageUrl} style={styles.image} label={`Dokumentasi ${e.title}`} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: space.md },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, marginTop: 4, borderWidth: 3, borderColor: colors.white },
  line: { flex: 1, width: 2, backgroundColor: colors.primary, opacity: 0.3, marginVertical: 2 },
  body: { flex: 1, gap: space.xs, paddingBottom: space.xl },
  year: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 2 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, marginTop: space.sm },
});
