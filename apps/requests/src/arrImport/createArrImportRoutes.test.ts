import { describe, expect, it, vi } from 'vitest';
import type { ArrImportApplied, ArrImportPlan } from '@ValenceContracts/schemas/ArrImport';
import { createArrImportRoutes } from './createArrImportRoutes';

const A_PLAN: ArrImportPlan = {
  sources: [],
  clients: [],
  indexers: [],
  prowlarr: null,
  profiles: [],
  libraries: [],
  unplacedFolders: [],
  wanted: { films: 0, series: 0, artists: 0, requests: 0, unaskable: 0 },
  secrets: [],
};

const APPLIED: ArrImportApplied = {
  clients: { added: 1, kept: 0 },
  indexers: { added: 0, kept: 0 },
  profiles: { added: 0, kept: 0 },
  apps: { added: 0, kept: 0 },
  prowlarr: null,
  libraries: [],
  wanted: [],
  problems: [],
};

const ORDER = { sources: [{ kind: 'radarr', url: 'http://radarr:7878', apiKey: 'key' }] };

/**
 * The routes over an import that answers with the plan and outcome above.
 */
const aRouter = () => {
  const imports = {
    plan: vi.fn(() => Promise.resolve(A_PLAN)),
    apply: vi.fn(() => Promise.resolve(APPLIED)),
  };

  return { routes: createArrImportRoutes({ imports }), imports };
};

/**
 * Posts a body to one of the routes.
 */
const post = (routes: ReturnType<typeof aRouter>['routes'], path: string, body: object) =>
  routes.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('createArrImportRoutes', () => {
  it('plans and applies what it is asked to, with the defaults filled in', async () => {
    const { routes, imports } = aRouter();

    expect(await (await post(routes, '/imports/arr/plan', ORDER)).json()).toEqual(A_PLAN);
    expect(await (await post(routes, '/imports/arr/apply', ORDER)).json()).toEqual(APPLIED);
    expect(imports.apply).toHaveBeenCalledWith({
      ...ORDER,
      pathMappings: [],
      secrets: {},
      choices: {},
      libraries: [],
    });
  });

  it('refuses something that is not a setup to bring in', async () => {
    const { routes, imports } = aRouter();
    const response = await post(routes, '/imports/arr/plan', { sources: [] });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'error.arrImport.thatIsNotASetupToBringIn',
    });
    expect(imports.plan).not.toHaveBeenCalled();
    expect((await post(routes, '/imports/arr/apply', {})).status).toBe(400);
  });
});
