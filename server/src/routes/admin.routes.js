import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import * as content from '../controllers/content.controller.js';
import * as users from '../controllers/users.controller.js';
import { requireAuth, requirePasswordChanged, requirePermission as allow } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { imageUpload } from '../services/storage.js';
import { contentSchemas, createUserSchema, profileSchema, statusSchema, updateUserSchema } from '../validators/schemas.js';
import { notFound } from '../utils/errors.js';

const validateContent = (req, res, next) => {
  const schema = contentSchemas[req.params.resource];
  if (!schema) return next(notFound('Jenis konten tidak dikenal'));
  validate(schema)(req, res, next);
};

export const adminRoutes = Router()
  .use(requireAuth, requirePasswordChanged)
  .get('/dashboard', allow('content:read'), admin.dashboard)

  .get('/church-profile', allow('content:read'), admin.getChurchProfile)
  .put('/church-profile', allow('profile:edit'), validate(profileSchema), admin.updateChurchProfile)

  .post('/uploads', allow('upload'), imageUpload.single('image'), admin.upload)
  .get('/audit-logs', allow('audit:read'), admin.auditLogs)

  .get('/users', allow('users:manage'), users.list)
  .post('/users', allow('users:manage'), validate(createUserSchema), users.create)
  .patch('/users/:id', allow('users:manage'), validate(updateUserSchema), users.update)
  .post('/users/:id/reset-password', allow('users:manage'), users.resetPassword)
  .post('/users/:id/revoke-sessions', allow('users:manage'), users.revokeSessions)

  // :resource = church-history | commissions | events | faqs
  .get('/:resource', allow('content:read'), content.list)
  .get('/:resource/:id', allow('content:read'), content.get)
  .post('/:resource', allow('content:edit'), validateContent, content.create)
  .put('/:resource/:id', allow('content:edit'), validateContent, content.update)
  .patch('/:resource/:id/status', allow('content:publish'), validate(statusSchema), content.setStatus)
  .delete('/:resource/:id', allow('content:delete'), content.remove);
