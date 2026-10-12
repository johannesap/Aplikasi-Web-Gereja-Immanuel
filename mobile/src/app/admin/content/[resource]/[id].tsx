import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { CommissionDetailView, EventDetailView } from '@/components/details';
import { FieldsForm } from '@/components/form';
import { Screen } from '@/components/Screen';
import { EmptyState, QueryView } from '@/components/states';
import { Button, Card, Chips, StatusBadge, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RESOURCES, isResourceKey } from '@/lib/resources';
import { colors, space } from '@/theme';

// Pratinjau tersedia untuk konten yang punya halaman detail sendiri.
const PREVIEW: Partial<Record<string, (data: any) => ReactNode>> = {
  events: (data) => <EventDetailView event={data} />,
  commissions: (data) => <CommissionDetailView commission={data} />,
};

export default function AdminContentEdit() {
  const { resource, id } = useLocalSearchParams<{ resource: string; id: string }>();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'form' | 'preview'>('form');
  const isNew = id === 'new';
  const def = isResourceKey(resource) ? RESOURCES[resource] : null;
  const path = `/api/admin/${def?.key}/${id}`;

  const item = useQuery({
    queryKey: ['admin', 'item', def?.key, id],
    queryFn: () => api<Record<string, any>>(path, { auth: true }),
    enabled: !!def && !isNew,
  });

  if (!def) return <EmptyState icon="alert-circle-outline" title="Jenis konten tidak dikenal" />;

  // Semua cache (publik & admin) disegarkan supaya perubahan langsung terlihat di aplikasi.
  const refreshAll = () => queryClient.invalidateQueries();

  const save = async (data: Record<string, any>) => {
    await api(isNew ? `/api/admin/${def.key}` : path, { method: isNew ? 'POST' : 'PUT', body: data, auth: true });
    await refreshAll();
    Alert.alert('Tersimpan', isNew ? `${def.title} disimpan sebagai draft.` : 'Perubahan disimpan.');
    router.back();
  };

  const setStatus = async (status: 'draft' | 'published') => {
    setBusy(true);
    try {
      await api(`${path}/status`, { method: 'PATCH', body: { status }, auth: true });
      await refreshAll();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(`Hapus ${def.singular}?`, 'Data yang dihapus tidak dapat dikembalikan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(path, { method: 'DELETE', auth: true });
            await refreshAll();
            router.back();
          } catch (err) {
            Alert.alert('Gagal menghapus', err instanceof Error ? err.message : 'Silakan coba lagi.');
          }
        },
      },
    ]);

  const title = isNew ? `Tambah ${def.singular}` : `Ubah ${def.singular}`;

  if (isNew) {
    if (!can('content:edit')) return <EmptyState icon="lock-closed-outline" title="Anda tidak memiliki izin menambah konten" />;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen options={{ title }} />
        <Screen>
          <FieldsForm fields={def.fields} onSubmit={save} onCancel={router.back} submitLabel="Simpan sebagai draft" />
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title }} />
      <Screen onRefresh={() => item.refetch()} refreshing={item.isRefetching}>
        <QueryView query={item}>
          {(data) => {
            const published = data.status === 'published';
            // Sama dengan aturan server: konten tayang hanya boleh diubah oleh pemegang izin publikasi.
            const editable = can('content:edit') && (!published || can('content:publish'));
            return (
              <>
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <T variant="subtitle" style={{ fontSize: 15 }}>
                      Status
                    </T>
                    <StatusBadge status={data.status} />
                  </View>
                  <T variant="caption" color={colors.textMuted}>
                    {published ? 'Konten ini tampil untuk jemaat.' : 'Draft hanya terlihat oleh pengelola.'}
                  </T>
                  {can('content:publish') && (
                    <Button
                      title={published ? 'Tarik dari publikasi' : 'Publikasikan'}
                      icon={published ? 'eye-off-outline' : 'checkmark-circle-outline'}
                      variant={published ? 'secondary' : 'primary'}
                      loading={busy}
                      onPress={() => setStatus(published ? 'draft' : 'published')}
                    />
                  )}
                </Card>
                {!editable && (
                  <T variant="caption" color={colors.textMuted}>
                    Mode baca saja: Anda tidak memiliki izin mengubah {published ? 'konten yang sudah tayang' : 'konten ini'}.
                  </T>
                )}
                {PREVIEW[def.key] && (
                  <Chips
                    options={[
                      { value: 'form', label: 'Formulir' },
                      { value: 'preview', label: 'Pratinjau' },
                    ]}
                    value={mode}
                    onChange={setMode}
                  />
                )}
                {mode === 'preview' && PREVIEW[def.key] ? (
                  <>
                    <T variant="caption" color={colors.textMuted}>
                      Tampilan untuk jemaat dari data yang sudah tersimpan. Simpan perubahan dahulu untuk melihat hasil terbaru.
                    </T>
                    {PREVIEW[def.key]!(data)}
                  </>
                ) : (
                  <FieldsForm key={data.updatedAt} fields={def.fields} item={data} readOnly={!editable} onSubmit={save} onCancel={router.back} />
                )}
                {can('content:delete') && <Button title={`Hapus ${def.singular}`} icon="trash-outline" variant="danger" onPress={confirmDelete} />}
              </>
            );
          }}
        </QueryView>
      </Screen>
    </KeyboardAvoidingView>
  );
}
