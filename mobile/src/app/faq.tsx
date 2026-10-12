import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Accordion } from '@/components/church';
import { Screen } from '@/components/Screen';
import { EmptyState, QueryView } from '@/components/states';
import { Card, SearchBar, T } from '@/components/ui';
import { filterFaqs, groupFaqs } from '@/lib/filters';
import { useFaqs } from '@/lib/queries';
import { colors, space } from '@/theme';

export default function FaqScreen() {
  const faqs = useFaqs();
  const [q, setQ] = useState('');
  const groups = useMemo(() => groupFaqs(filterFaqs(faqs.data?.items ?? [], q)), [faqs.data, q]);

  return (
    <Screen onRefresh={() => faqs.refetch()} refreshing={faqs.isRefetching}>
      <SearchBar value={q} onChangeText={setQ} placeholder="Cari pertanyaan" />
      <QueryView query={faqs}>
        {({ items }) =>
          items.length === 0 ? (
            <EmptyState icon="help-circle-outline" title="Belum ada FAQ" message="Pertanyaan umum akan ditambahkan oleh Sekretariat." />
          ) : groups.length === 0 ? (
            <EmptyState icon="search-outline" title="Tidak ditemukan" message={`Tidak ada pertanyaan yang cocok dengan "${q}".`} />
          ) : (
            groups.map((g) => (
              <View key={g.title} style={{ gap: space.sm }}>
                <T variant="caption" color={colors.primary} style={{ fontWeight: '700', letterSpacing: 1 }} accessibilityRole="header">
                  {g.title.toUpperCase()}
                </T>
                <Card style={{ padding: 0 }}>
                  {g.data.map((f, i) => (
                    <Accordion key={f._id} title={f.question} first={i === 0}>
                      <T color={colors.textMuted}>{f.answer}</T>
                    </Accordion>
                  ))}
                </Card>
              </View>
            ))
          )
        }
      </QueryView>
    </Screen>
  );
}
