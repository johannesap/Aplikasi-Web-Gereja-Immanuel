export function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export async function paged(model, filter, sort, query, projection) {
  const { page, limit, skip } = paginate(query);
  const [items, total] = await Promise.all([
    model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);
  return { items, page, limit, total, hasMore: skip + items.length < total };
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
