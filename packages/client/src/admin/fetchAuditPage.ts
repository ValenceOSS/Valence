import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AuditPageSchema } from '@ValenceContracts/schemas/Audit';
import type {
  AuditAction,
  AuditCategory,
  AuditOrder,
  AuditPage,
} from '@ValenceContracts/schemas/Audit';

type AuditFilter = {
  action?: AuditAction;
  category?: AuditCategory;
  actorId?: string;
  search?: string;
  sinceMs?: number;
  untilMs?: number;
  order?: AuditOrder;
};

/**
 * Reads a page of who changed what on the server, newest first unless asked for oldest first.
 *
 * @param filter - What kind of change, whose, when or with which words to narrow it to, and which
 *   end to read from.
 * @param cursor - Where the previous page ended, for the next.
 * @returns The page, and where the next one starts.
 */
const fetchAuditPage = (filter: AuditFilter, cursor?: string): Promise<AuditPage> => {
  const query = new URLSearchParams({
    ...(filter.action === undefined ? {} : { action: filter.action }),
    ...(filter.category === undefined ? {} : { category: filter.category }),
    ...(filter.actorId === undefined ? {} : { actorId: filter.actorId }),
    ...(filter.search === undefined || filter.search.trim() === ''
      ? {}
      : { search: filter.search.trim() }),
    ...(filter.sinceMs === undefined ? {} : { sinceMs: filter.sinceMs.toString() }),
    ...(filter.untilMs === undefined ? {} : { untilMs: filter.untilMs.toString() }),
    ...(filter.order === undefined || filter.order === 'newest' ? {} : { order: filter.order }),
    ...(cursor === undefined ? {} : { cursor }),
  });

  return readFromServer(`/api/admin/audit?${query.toString()}`, AuditPageSchema);
};

export type { AuditFilter };

export { fetchAuditPage };
