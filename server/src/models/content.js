import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Field bersama untuk konten yang bisa draft/published.
const contentFields = {
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
};
const opts = { timestamps: true, versionKey: false };

const historySchema = new mongoose.Schema(
  {
    year: { type: String, required: true, trim: true, maxlength: 20 },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    imageUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    ...contentFields,
  },
  opts,
);
historySchema.index({ status: 1, order: 1 });

const commissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    activities: { type: String, trim: true, maxlength: 3000, default: '' },
    schedule: { type: String, trim: true, maxlength: 1000, default: '' },
    contact: { type: String, trim: true, maxlength: 300, default: '' },
    imageUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    ...contentFields,
  },
  opts,
);
commissionSchema.index({ status: 1, order: 1 });

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    location: { type: String, trim: true, maxlength: 200, default: '' },
    contact: { type: String, trim: true, maxlength: 300, default: '' },
    imageUrl: { type: String, default: '' },
    ...contentFields,
  },
  opts,
);
eventSchema.index({ status: 1, startAt: 1 });

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 3000 },
    category: { type: String, trim: true, maxlength: 60, default: '' },
    order: { type: Number, default: 0 },
    ...contentFields,
  },
  opts,
);
faqSchema.index({ status: 1, order: 1 });

export const ChurchHistory = mongoose.model('ChurchHistory', historySchema);
export const Commission = mongoose.model('Commission', commissionSchema);
export const Event = mongoose.model('Event', eventSchema);
export const Faq = mongoose.model('Faq', faqSchema);
