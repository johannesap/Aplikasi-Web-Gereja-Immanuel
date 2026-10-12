// Design system ungu–putih. Ubah warna/ukuran di sini, bukan di layar masing-masing.
export const colors = {
  primary: '#5B2A86',
  primaryDeep: '#3B185F',
  primaryLight: '#F2EAF8',
  gold: '#C9A227', // aksen liturgis; hanya untuk garis/ikon, jangan untuk teks di latar putih (kontras rendah)
  goldLight: '#FBF4DE',
  white: '#FFFFFF',
  softBg: '#FAF8FC',
  text: '#241C2B',
  textMuted: '#756B7D',
  border: '#E7DFED',
  danger: '#B3261E',
  success: '#1E7A46',
  overlay: 'rgba(59, 24, 95, 0.55)', // ungu tua transparan agar teks putih terbaca di atas foto
};

// Kelipatan 4/8.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, button: 14, md: 16, lg: 20, pill: 999 };

// Font sistem (SF Pro di iOS, Roboto di Android): tanpa unduhan font, langsung tampil.
export const font = {
  caption: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 16, lineHeight: 24 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '700' as const },
  hero: { fontSize: 28, lineHeight: 35, fontWeight: '700' as const },
};

export const shadow = {
  shadowColor: '#3B185F',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};

// Area sentuh minimal (dp) sesuai pedoman aksesibilitas Android/iOS.
export const TOUCH = 48;

// Di tablet/layar lebar, isi tetap satu kolom yang nyaman dibaca.
export const contentWidth = { width: '100%' as const, maxWidth: 720, alignSelf: 'center' as const };

// Header bawaan untuk semua Stack (halaman detail publik dan area pengelola).
export const stackScreenOptions = {
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
  headerStyle: { backgroundColor: colors.white },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: colors.softBg },
};
