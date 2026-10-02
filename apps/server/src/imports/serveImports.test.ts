import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';
import { createImportService } from './createImportService';
import { serveImports } from './serveImports';
import { someImportServices } from './someImportServices';

const CONTEXT = {
  requires: () => Promise.resolve(true),
  readAccount: () => Promise.resolve(null),
  trustedOrigins: () => Promise.resolve(['http://valence']),
};

describe('serveImports', { timeout: 60_000 }, () => {
  it('puts the import routes on the API, refusing them where the server has no importer', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const served = new OpenAPIHono();
    const without = new OpenAPIHono();

    serveImports(served, CONTEXT, {
      imports: createImportService(someImportServices(db).services),
    });
    serveImports(without, CONTEXT, {});

    expect((await served.request('/api/admin/imports')).status).toBe(200);
    expect((await without.request('/api/admin/imports')).status).toBe(503);
    expect(
      (
        await served.request(
          '/api/admin/imports/runs/00000000-0000-4000-8000-000000000000/setup-links',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', origin: 'http://valence' },
            body: '{}',
          },
        )
      ).status,
    ).toBe(404);
  });

  it('refuses somebody who is not an administrator before saying there is no importer', async () => {
    const without = new OpenAPIHono();

    serveImports(without, { ...CONTEXT, requires: () => Promise.resolve(false) }, {});

    expect((await without.request('/api/admin/imports')).status).toBe(403);
  });
});
