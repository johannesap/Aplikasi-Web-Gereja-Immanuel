import { Router } from 'express';
import * as c from '../controllers/public.controller.js';

export const publicRoutes = Router()
  .get('/church-profile', c.churchProfile)
  .get('/church-history', c.churchHistory)
  .get('/commissions', c.commissions)
  .get('/commissions/:id', c.commission)
  .get('/events', c.events)
  .get('/events/:id', c.event)
  .get('/faqs', c.faqs);
