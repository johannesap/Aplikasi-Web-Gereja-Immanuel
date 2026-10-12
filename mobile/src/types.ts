export type Status = 'draft' | 'published';

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ChurchProfile {
  _id: string;
  name: string;
  shortDescription: string;
  description: string;
  welcomeMessage: string;
  historyIntro: string;
  logoUrl: string;
  photoUrl: string;
  heroImageUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  mapsUrl: string;
  socials: { instagram?: string; facebook?: string; youtube?: string };
  additionalInfo: string;
  updatedAt: string;
}

export interface HistoryEntry {
  _id: string;
  year: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  status: Status;
}

export interface Commission {
  _id: string;
  name: string;
  slug: string;
  description: string;
  activities: string;
  schedule: string;
  contact: string;
  imageUrl: string;
  order: number;
  status: Status;
}

export interface ChurchEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startAt: string;
  endAt?: string | null;
  location: string;
  contact: string;
  imageUrl: string;
  status: Status;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  status: Status;
}

export type Permission =
  | 'content:read'
  | 'content:edit'
  | 'content:publish'
  | 'content:delete'
  | 'profile:edit'
  | 'upload'
  | 'audit:read'
  | 'users:manage';

export type Role = 'majelis' | 'sekretariat';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isSuperAdmin: boolean;
  isActive: boolean;
  seat?: number;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  permissions?: Permission[];
}

export interface AuditEntry {
  _id: string;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  createdAt: string;
}
