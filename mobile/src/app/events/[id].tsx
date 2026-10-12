import { useLocalSearchParams } from 'expo-router';
import { EventDetailView } from '@/components/details';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { useEvent } from '@/lib/queries';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useEvent(id);
  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <QueryView query={query}>{(e) => <EventDetailView event={e} />}</QueryView>
    </Screen>
  );
}
