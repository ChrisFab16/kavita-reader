import type { PaginationMetadata } from '../types/kavita';

type PaginationHeaderJson = {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  pageSize?: number;
  hasNextPage?: boolean;
};

/** Kavita sends pagination in the `Pagination` response header (JSON, camelCase).
 *  @see specs/contracts/kavita-pagination.md
 */
export function parsePaginationHeader(
  headers: Record<string, unknown> | null | undefined
): PaginationMetadata | null {
  if (!headers) {
    return null;
  }

  const raw =
    headers.pagination ??
    headers.Pagination ??
    (headers as { get?: (name: string) => unknown }).get?.('pagination') ??
    (headers as { get?: (name: string) => unknown }).get?.('Pagination');

  if (raw == null) {
    return null;
  }

  try {
    const parsed: PaginationHeaderJson =
      typeof raw === 'string' ? JSON.parse(raw) : (raw as PaginationHeaderJson);
    return normalizePaginationMetadata(parsed);
  } catch {
    return null;
  }
}

export function normalizePaginationMetadata(
  parsed: PaginationHeaderJson | PaginationMetadata | null | undefined
): PaginationMetadata | null {
  if (!parsed || parsed.currentPage == null || parsed.totalPages == null) {
    return null;
  }

  const pageSize = parsed.pageSize ?? (parsed as PaginationHeaderJson).itemsPerPage ?? 0;
  const hasNextPage =
    parsed.hasNextPage ?? parsed.currentPage < parsed.totalPages;

  return {
    currentPage: parsed.currentPage,
    totalPages: parsed.totalPages,
    totalItems: parsed.totalItems ?? 0,
    pageSize,
    hasNextPage,
  };
}
