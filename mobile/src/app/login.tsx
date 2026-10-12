import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { z } from 'zod';
import { Logo } from '@/components/church';
import { FormError, TextField } from '@/components/form';
import { Screen } from '@/components/Screen';
import { Button, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/theme';

const schema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});
type Values = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login, status } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'authed' && !formState.isSubmitting) return <Redirect href="/admin" />;

  const submit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      const user = await login(email, password);
      router.replace(user.mustChangePassword ? '/admin/change-password' : '/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    }
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ paddingTop: space.xxl }}>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <Logo size={80} />
          <T variant="title" color={colors.primaryDeep}>
            Login Pengelola
          </T>
          <T color={colors.textMuted} style={{ textAlign: 'center' }}>
            Khusus Majelis dan Sekretariat. Jemaat tidak perlu login untuk melihat informasi gereja.
          </T>
        </View>
        <View style={{ gap: space.lg }}>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                label="Email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                ref={passwordRef}
                label="Kata sandi"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                secureToggle
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            )}
          />
          <FormError message={error} />
          <Button title="Masuk" icon="log-in-outline" loading={formState.isSubmitting} onPress={submit} />
          <T variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Lupa kata sandi? Hubungi administrator gereja untuk mengatur ulang.
          </T>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
