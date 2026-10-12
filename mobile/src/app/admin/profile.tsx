import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { FieldsForm } from '@/components/form';
import { Screen } from '@/components/Screen';
import { QueryView } from '@/components/states';
import { T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PROFILE_FIELDS } from '@/lib/resources';
import { colors } from '@/theme';
import type { ChurchProfile } from '@/types';

export default function AdminProfile() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: () => api<ChurchProfile>('/api/admin/church-profile', { auth: true }),
  });

  const save = async (data: Record<string, any>) => {
    await api('/api/admin/church-profile', { method: 'PUT', body: data, auth: true });
    await queryClient.invalidateQueries();
    Alert.alert('Tersimpan', 'Profil gereja diperbarui dan langsung tampil untuk jemaat.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        {!can('profile:edit') && (
          <T variant="caption" color={colors.textMuted}>
            Mode baca saja: Anda tidak memiliki izin mengubah profil gereja.
          </T>
        )}
        <QueryView query={profile}>
          {(p) => <FieldsForm key={p.updatedAt} fields={PROFILE_FIELDS} item={p} readOnly={!can('profile:edit')} onSubmit={save} onCancel={router.back} />}
        </QueryView>
      </Screen>
    </KeyboardAvoidingView>
  );
}
