import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { z } from 'zod';
import { FormError, TextField } from '@/components/form';
import { Screen } from '@/components/Screen';
import { EmptyState, QueryView } from '@/components/states';
import { Button, Card, Chips, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatClock, formatDate } from '@/lib/date';
import { colors, space } from '@/theme';
import type { AdminUser, Role } from '@/types';

const ROLES: { value: Role; label: string }[] = [
  { value: 'sekretariat', label: 'Sekretariat' },
  { value: 'majelis', label: 'Majelis' },
];

const showTempPassword = (email: string, tempPassword: string) =>
  Alert.alert(
    'Kata sandi sementara',
    `${email}\n\n${tempPassword}\n\nCatat dan berikan secara pribadi. Kata sandi ini hanya ditampilkan sekali dan wajib diganti saat login pertama.`,
  );

const schema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  role: z.enum(['majelis', 'sekretariat']),
});

function NewUser() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: 'sekretariat' },
  });
  const submit = handleSubmit(async (body) => {
    setError(null);
    try {
      const res = await api<{ user: AdminUser; tempPassword: string }>('/api/admin/users', { method: 'POST', body, auth: true });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showTempPassword(res.user.email, res.tempPassword);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat akun');
    }
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Tambah Pengelola' }} />
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField label="Nama lengkap" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      <View style={{ gap: space.sm }}>
        <T variant="caption" style={{ fontWeight: '600' }}>
          Role
        </T>
        <Controller control={control} name="role" render={({ field }) => <Chips options={ROLES} value={field.value} onChange={field.onChange} />} />
      </View>
      <FormError message={error} />
      <Button title="Buat akun" icon="person-add-outline" loading={formState.isSubmitting} onPress={submit} />
      <T variant="caption" color={colors.textMuted}>
        Akun baru mendapat kata sandi sementara. Hak super admin tidak dapat diberikan dari aplikasi.
      </T>
    </Screen>
  );
}

function ExistingUser({ id }: { id: string }) {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  // Tidak ada endpoint detail; daftar 15 akun sudah kecil dan ter-cache.
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api<{ items: AdminUser[] }>('/api/admin/users', { auth: true }),
  });

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Silakan coba lagi.');
    } finally {
      setBusy(null);
    }
  };
  const patch = (body: object) => api(`/api/admin/users/${id}`, { method: 'PATCH', body, auth: true });
  const confirm = (title: string, message: string, onOk: () => void) =>
    Alert.alert(title, message, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Lanjutkan', style: 'destructive', onPress: onOk },
    ]);

  return (
    <Screen onRefresh={() => users.refetch()} refreshing={users.isRefetching}>
      <QueryView query={users}>
        {({ items }) => {
          const u = items.find((x) => x._id === id);
          if (!u) return <EmptyState icon="person-outline" title="Akun tidak ditemukan" />;
          const isSelf = u._id === me?._id;
          return (
            <>
              <Stack.Screen options={{ title: u.name }} />
              <Card style={{ gap: space.xs }}>
                <T variant="subtitle">{u.name}</T>
                <T color={colors.textMuted}>{u.email}</T>
                <T variant="caption" color={colors.textMuted}>
                  {u.isActive ? `Aktif · kursi ${u.seat}` : 'Nonaktif'}
                  {u.isSuperAdmin ? ' · Super admin' : ''}
                </T>
                <T variant="caption" color={colors.textMuted}>
                  Login terakhir: {u.lastLoginAt ? `${formatDate(u.lastLoginAt)} ${formatClock(u.lastLoginAt)} WIB` : 'belum pernah'}
                </T>
              </Card>

              <View style={{ gap: space.sm }}>
                <T variant="caption" style={{ fontWeight: '600' }}>
                  Role
                </T>
                {isSelf ? (
                  <T color={colors.textMuted}>Anda tidak dapat mengubah role akun sendiri.</T>
                ) : (
                  <Chips options={ROLES} value={u.role} onChange={(role) => run('role', () => patch({ role }))} />
                )}
              </View>

              {!isSelf && (
                <Button
                  title={u.isActive ? 'Nonaktifkan akun' : 'Aktifkan kembali'}
                  icon={u.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  variant={u.isActive ? 'danger' : 'primary'}
                  loading={busy === 'active'}
                  onPress={() =>
                    u.isActive
                      ? confirm('Nonaktifkan akun?', `${u.name} akan langsung dikeluarkan dari semua perangkat dan kursinya dilepas.`, () =>
                          run('active', () => patch({ isActive: false })),
                        )
                      : run('active', () => patch({ isActive: true }))
                  }
                />
              )}
              <Button
                title="Atur ulang kata sandi"
                icon="key-outline"
                variant="secondary"
                loading={busy === 'reset'}
                onPress={() =>
                  confirm('Atur ulang kata sandi?', 'Kata sandi lama tidak berlaku dan semua sesi dikeluarkan.', () =>
                    run('reset', async () => {
                      const res = await api<{ tempPassword: string }>(`/api/admin/users/${id}/reset-password`, { method: 'POST', auth: true });
                      showTempPassword(u.email, res.tempPassword);
                    }),
                  )
                }
              />
              <Button
                title="Keluarkan dari semua perangkat"
                icon="phone-portrait-outline"
                variant="secondary"
                loading={busy === 'revoke'}
                onPress={() =>
                  confirm('Keluarkan sesi?', `${u.name} harus login ulang di semua perangkat.`, () =>
                    run('revoke', () => api(`/api/admin/users/${id}/revoke-sessions`, { method: 'POST', auth: true })),
                  )
                }
              />
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return id === 'new' ? <NewUser /> : <ExistingUser id={id} />;
}
