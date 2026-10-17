import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { AuditPageSchema, AuditQuerySchema } from '@ValenceContracts/schemas/Audit';

const AuditError = RefusalSchema.openapi('AuditError');

const listAuditRoute = createRoute({
  method: 'get',
  path: '/api/admin/audit',
  tags: ['Admin'],
  summary: 'Read who changed what on this server, newest first',
  request: { query: AuditQuerySchema },
  responses: {
    200: {
      description: 'A page of changes, and where the next page starts',
      content: { 'application/json': { schema: AuditPageSchema } },
    },
    403: {
      description: 'This account may not read the audit log',
      content: { 'application/json': { schema: AuditError } },
    },
  },
});

export { listAuditRoute };
