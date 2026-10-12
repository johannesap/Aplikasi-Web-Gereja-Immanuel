import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: '' },
    action: { type: String, required: true }, // create, update, delete, status, login, login_failed, ...
    entity: { type: String, required: true }, // events, faqs, users, auth, ...
    entityId: { type: String },
    summary: { type: String, default: '' },
    changes: { before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed },
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);
auditSchema.index({ createdAt: -1 });
auditSchema.index({ entity: 1, entityId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditSchema);
