import { describe, expect, it } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { createProfileRoutes } from './createProfileRoutes';
import { createProfileService } from './createProfileService';
import { QualityProfileSchema } from '@ValenceContracts/schemas/QualityProfile';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * The routes over no profiles to begin with.
 */
const theRoutes = () => {
  const routes = createProfileRoutes(
    createProfileService({ store: createMemoryRecordStore<QualityProfile>() }),
  );

  return (path: string, method = 'GET', body?: object) =>
    routes.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
};

describe('createProfileRoutes', () => {
  it('adds, lists, changes and removes profiles', async () => {
    const ask = theRoutes();
    const added = await ask('/profiles', 'POST', { name: 'HD', kind: 'video' });
    const { id } = QualityProfileSchema.parse(await added.json());

    expect(added.status).toBe(201);
    expect(await (await ask('/profiles')).json()).toHaveLength(1);
    expect((await ask(`/profiles/${id}`, 'PATCH', { name: 'UHD' })).status).toBe(200);
    expect((await ask(`/profiles/${id}`, 'DELETE')).status).toBe(204);
    expect((await ask(`/profiles/${id}`, 'DELETE')).status).toBe(404);
  });

  it('refuses what is not a profile, and a change to one that is not there', async () => {
    const ask = theRoutes();

    expect((await ask('/profiles', 'POST', { name: 'HD' })).status).toBe(400);
    expect((await ask('/profiles/nothing', 'PATCH', { resolutions: ['8k'] })).status).toBe(400);
    expect((await ask('/profiles/nothing', 'PATCH', { name: 'x' })).status).toBe(404);
  });
});
