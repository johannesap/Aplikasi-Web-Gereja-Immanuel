import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { z } from 'zod';
import { FormError, TextField } from '@/components/form';
import { Screen } from '@/components/Screen';
import { Button, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

// Aturan sama dengan server (validators/schemas.js → password).
const schema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    newPassword: z
      .string()
      .min(10, 'Minimal 10 karakter')
      .regex(/[A-Za-z]/, 'Harus mengandung huruf')
      .regex(/[0-9]/, 'Harus mengandung angka'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { message: 'Konfirmasi tidak sama', path: ['confirm'] });
type Values = z.infer<typeof schema>;

const FIELDS: { name: keyof Values; label: string; autoComplete: 'current-password' | 'new-password' }[] = [
  { name: 'currentPassword', label: 'Kata sandi saat ini', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Kata sandi baru', autoComplete: 'new-password' },
  { name: 'confirm', label: 'Ulangi kata sandi baru', autoComplete: 'new-password' },
];

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const submit = handleSubmit(async (v) => {
    setError(null);
    try {
      await changePassword(v.currentPassword, v.newPassword);
      Alert.alert('Berhasil', 'Kata sandi diperbarui. Sesi di perangkat lain telah dikeluarkan.');
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengganti kata sandi');
    }
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        {user?.mustChangePassword && (
          <T color={colors.primaryDeep}>Anda masuk dengan kata sandi sementara. Silakan buat kata sandi baru sebelum melanjutkan.</T>
        )}
        <T variant="caption" color={colors.textMuted}>
          Minimal 10 karakter, berisi huruf dan angka.
        </T>
        {FIELDS.map((f) => (
          <Controller
            key={f.name}
            control={control}
            name={f.name}
            render={({ field, fieldState }) => (
              <TextField
                label={f.label}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                secureToggle
                autoCapitalize="none"
                autoComplete={f.autoComplete}
              />
            )}
          />
        ))}
        <FormError message={error} />
        <Button title="Simpan kata sandi" icon="key-outline" loading={formState.isSubmitting} onPress={submit} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
