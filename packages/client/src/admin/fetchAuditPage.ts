import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AuditPageSchema } from '@ValenceContracts/schemas/Audit';
import type { AuditAction, AuditPage } from '@ValenceContracts/schemas/Audit';

type AuditFilter = {
  action?: AuditAction;
  actorId?: string;
};

/**
 * Reads a page of who changed what on the server, newest first.
 *
 * @param filter - What kind of change, or whose, to narrow it to.
 * @param cursor - Where the previous page ended, for the next.
 * @returns The page, and where the next one starts.
 */
const fetchAuditPage = (filter: AuditFilter, cursor?: string): Promise<AuditPage> => {
  const query = new URLSearchParams({
    ...(filter.action === undefined ? {} : { action: filter.action }),
    ...(filter.actorId === undefined ? {} : { actorId: filter.actorId }),
    ...(cursor === undefined ? {} : { cursor }),
  });

  return readFromServer(`/api/admin/audit?${query.toString()}`, AuditPageSchema);
};

export type { AuditFilter };

export { fetchAuditPage };
