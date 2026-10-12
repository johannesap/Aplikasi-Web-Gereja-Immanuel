import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { forwardRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { parseWibInput, toWibInput } from '@/lib/date';
import type { FieldDef } from '@/lib/resources';
import { colors, font, radius, space, TOUCH } from '@/theme';
import { AppImage } from './church';
import { Button, T } from './ui';

export const TextField = forwardRef<
  TextInput,
  TextInputProps & { label: string; error?: string; hint?: string; secureToggle?: boolean }
>(function TextField({ label, error, hint, secureToggle, multiline, style, ...props }, ref) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: space.xs }}>
      <T variant="caption" style={{ fontWeight: '600' }}>
        {label}
      </T>
      <View style={[styles.inputWrap, !!error && { borderColor: colors.danger }, props.editable === false && styles.readOnly]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={1.4}
          accessibilityLabel={label}
          accessibilityHint={error || hint}
          multiline={multiline}
          secureTextEntry={secureToggle && hidden}
          style={[font.body, styles.input, multiline && { minHeight: 110, textAlignVertical: 'top' }, style]}
          {...props}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden(!hidden)}
            style={styles.eye}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <T variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : hint ? (
        <T variant="caption" color={colors.textMuted}>
          {hint}
        </T>
      ) : null}
    </View>
  );
});

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.formError} accessibilityLiveRegion="assertive">
      <Ionicons name="alert-circle" size={20} color={colors.danger} />
      <T color={colors.danger} style={{ flex: 1 }}>
        {message}
      </T>
    </View>
  );
}

/** Memilih gambar dari galeri, memperkecilnya (lebar maks 1280 px, JPEG 75%), lalu mengunggah ke server. */
function ImageInput({ value, onChange, label, editable }: { value: string; onChange: (v: string) => void; label: string; editable: boolean }) {
  const [uploading, setUploading] = useState(false);
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1280) context.resize({ width: 1280, height: null });
      const image = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.75 });
      const form = new FormData();
      form.append('image', { uri: image.uri, name: 'gambar.jpg', type: 'image/jpeg' } as unknown as Blob);
      const res = await api<{ url: string }>('/api/admin/uploads', { method: 'POST', form, auth: true });
      onChange(res.url);
    } catch (err) {
      Alert.alert('Gagal mengunggah', err instanceof Error ? err.message : 'Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };
  return (
    <View style={{ gap: space.sm }}>
      <T variant="caption" style={{ fontWeight: '600' }}>
        {label}
      </T>
      {value ? (
        <AppImage url={value} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md }} label={label} />
      ) : (
        <View style={styles.imageEmpty}>
          <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          <T variant="caption" color={colors.textMuted}>
            Belum ada gambar
          </T>
        </View>
      )}
      {editable && (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title={value ? 'Ganti gambar' : 'Pilih gambar'}
            icon="image-outline"
            variant="secondary"
            loading={uploading}
            onPress={pick}
            style={{ flex: 1 }}
          />
          {!!value && <Button title="Hapus" variant="ghost" onPress={() => onChange('')} accessibilityLabel={`Hapus ${label}`} />}
        </View>
      )}
    </View>
  );
}

// Nama field bertitik (socials.instagram) disimpan datar di form agar validasi tetap sederhana.
const key = (f: FieldDef) => f.name.replace(/\./g, '__');
const getPath = (obj: Record<string, any> | undefined, path: string) =>
  path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);

function fieldSchema(f: FieldDef) {
  const required = (s: z.ZodString) => (f.required ? s.min(1, `${f.label} wajib diisi`) : s);
  switch (f.type) {
    case 'number':
      return z.string().trim().regex(/^\d*$/, 'Harus berupa angka bulat');
    case 'datetime':
      return required(z.string().trim()).refine(
        (v) => (!f.required && v === '') || parseWibInput(v) !== null,
        'Format: TTTT-BB-HH JJ:MM, mis. 2026-12-24 18:00',
      );
    case 'email':
      return z.string().trim().refine((v) => v === '' || z.email().safeParse(v).success, 'Format email tidak valid');
    case 'url':
      return z.string().trim().refine((v) => v === '' || /^https?:\/\//.test(v), 'Tautan harus diawali https://');
    default:
      return required(z.string().trim().max(f.max ?? 5000, `Maksimal ${f.max} karakter`));
  }
}

export function toFormValues(fields: FieldDef[], item?: Record<string, any>) {
  return Object.fromEntries(
    fields.map((f) => {
      const v = getPath(item, f.name);
      if (f.type === 'datetime') return [key(f), v ? toWibInput(v) : ''];
      return [key(f), v == null ? '' : String(v)];
    }),
  );
}

export function fromFormValues(fields: FieldDef[], values: Record<string, string>) {
  const out: Record<string, any> = {};
  for (const f of fields) {
    const raw = values[key(f)] ?? '';
    let v: unknown = raw;
    if (f.type === 'number') v = raw === '' ? undefined : Number(raw);
    if (f.type === 'datetime') v = raw === '' ? null : parseWibInput(raw);
    if (v === undefined) continue;
    const parts = f.name.split('.');
    let target = out;
    for (const p of parts.slice(0, -1)) target = target[p] ??= {};
    target[parts[parts.length - 1]] = v;
  }
  return out;
}

const KEYBOARD: Partial<Record<FieldDef['type'], TextInputProps['keyboardType']>> = {
  number: 'number-pad',
  email: 'email-address',
  url: 'url',
  phone: 'phone-pad',
};

/** Form generik dari daftar FieldDef. `onSubmit` menerima objek siap kirim ke API. */
export function FieldsForm({
  fields,
  item,
  readOnly,
  submitLabel = 'Simpan',
  onCancel,
  onSubmit,
}: {
  fields: FieldDef[];
  item?: Record<string, any>;
  readOnly?: boolean;
  submitLabel?: string;
  onSubmit: (data: Record<string, any>) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = z.object(Object.fromEntries(fields.map((f) => [key(f), fieldSchema(f)])));
  const { control, handleSubmit, formState } = useForm<Record<string, string>>({
    resolver: zodResolver(schema) as any,
    defaultValues: toFormValues(fields, item),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(fromFormValues(fields, values));
    } catch (err) {
      setServerError(err instanceof ApiError || err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  });

  return (
    <View style={{ gap: space.lg }}>
      {fields.map((f) => (
        <Controller
          key={f.name}
          control={control}
          name={key(f)}
          render={({ field, fieldState }) =>
            f.type === 'image' ? (
              <ImageInput value={field.value} onChange={field.onChange} label={f.label} editable={!readOnly} />
            ) : (
              <TextField
                label={f.label + (f.required ? ' *' : '')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                hint={f.type === 'datetime' ? `${f.hint ? f.hint + '. ' : ''}Format: 2026-12-24 18:00` : f.hint}
                placeholder={f.type === 'datetime' ? 'TTTT-BB-HH JJ:MM' : undefined}
                multiline={f.type === 'multiline'}
                keyboardType={KEYBOARD[f.type]}
                autoCapitalize={f.type === 'email' || f.type === 'url' ? 'none' : 'sentences'}
                maxLength={f.max}
                editable={!readOnly}
              />
            )
          }
        />
      ))}
      <FormError message={serverError} />
      {!readOnly && (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {onCancel && <Button title="Batal" variant="secondary" onPress={onCancel} disabled={formState.isSubmitting} style={{ flex: 1 }} />}
          <Button title={submitLabel} icon="save-outline" loading={formState.isSubmitting} onPress={submit} style={{ flex: 2 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.white,
  },
  readOnly: { backgroundColor: '#FAF7FC' },
  input: { flex: 1, minHeight: TOUCH, paddingHorizontal: space.lg, paddingVertical: space.md, color: colors.text },
  eye: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  formError: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: '#FCEDEC',
  },
  imageEmpty: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
});
