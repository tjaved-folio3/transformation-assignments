import type { Product, ProductListResponse, ProductQuery } from '../types/api.ts';
import { apiRequest } from './client.ts';

/** Turns a ProductQuery into "search=duck&category=ducks…", skipping empty values. */
export function toProductSearchParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.inStock) params.set('inStock', 'true');
  if (query.sort && query.sort !== 'relevance') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  return params;
}

export function fetchProducts(query: ProductQuery, signal?: AbortSignal) {
  const params = toProductSearchParams(query).toString();
  return apiRequest<ProductListResponse>(`/products${params ? `?${params}` : ''}`, { signal });
}

export function fetchProduct(id: string, signal?: AbortSignal) {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}`, { signal });
}
