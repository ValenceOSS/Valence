import { AUDIT_CATEGORIES } from '@ValenceContracts/schemas/Audit';
import type { AuditAction, AuditCategory } from '@ValenceContracts/schemas/Audit';

/**
 * Which kind of change an audit entry is, read from the part of its action before the dot, which
 * is how the log is narrowed to sign-ins, accounts, libraries and the rest.
 *
 * @param action - What was done.
 * @returns The kind of change it is.
 */
const auditCategoryOf = (action: AuditAction): AuditCategory =>
  AUDIT_CATEGORIES.find((category) => action.startsWith(`${category}.`)) ?? 'settings';

export { auditCategoryOf };
