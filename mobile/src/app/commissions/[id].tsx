import { Stack, useLocalSearchParams } from 'expo-router';
import { CommissionDetailView } from '@/components/details';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { useCommission } from '@/lib/queries';

export default function CommissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useCommission(id);
  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <QueryView query={query}>
        {(c) => (
          <>
            <Stack.Screen options={{ title: c.name }} />
            <CommissionDetailView commission={c} />
          </>
        )}
      </QueryView>
    </Screen>
  );
}
