import mongoose from 'mongoose';

// Satu dokumen saja. Field kosong ditampilkan sebagai "belum diisi" di aplikasi, tidak pernah dikarang.
const str = (maxlength) => ({ type: String, trim: true, maxlength, default: '' });

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 150, default: 'Gereja POUK Immanuel Kopassus' },
    shortDescription: str(300),
    description: str(5000),
    welcomeMessage: str(500),
    historyIntro: str(5000),
    logoUrl: str(500),
    photoUrl: str(500),
    heroImageUrl: str(500),
    address: str(300),
    phone: str(50),
    email: str(200),
    website: str(200),
    mapsUrl: str(500),
    socials: { instagram: str(200), facebook: str(200), youtube: str(200) },
    additionalInfo: str(3000),
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

export const ChurchProfile = mongoose.model('ChurchProfile', profileSchema);

export async function getProfile() {
  return ChurchProfile.findOneAndUpdate({}, {}, { upsert: true, returnDocument: 'after' }).lean();
}
