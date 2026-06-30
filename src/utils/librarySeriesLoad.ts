import type { PaginationMetadata } from '../types/kavita';

/**
 * When the HTTP call succeeds but the grid is empty, distinguish a likely API/filter
 * failure from a legitimately empty library.
 */
export function describeEmptyLibraryLoad(
  pagination: PaginationMetadata | null,
  options?: { isCollection?: boolean }
): string | null {
  if (options?.isCollection) {
    return null;
  }

  if (pagination?.totalItems != null && pagination.totalItems > 0) {
    return 'The server reported series in this library but none were returned. Tap Retry.';
  }

  if (pagination == null) {
    return 'Could not load series (empty response from server). Tap Retry or check your connection.';
  }

  // totalItems === 0 — library is empty on the server
  return null;
}
