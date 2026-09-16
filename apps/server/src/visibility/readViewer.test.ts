import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import { PROFILE_HEADER, readViewer } from './readViewer';
import type { ReadsViewers } from './readViewer';

const WHEN = new Date('2026-01-01T00:00:00.000Z');

const ACCOUNT = {
  id: 'account-1',
  name: 'Dan',
  email: 'dan@valence.local',
  emailVerified: true,
  image: null,
  createdAt: WHEN,
  updatedAt: WHEN,
  twoFactorEnabled: false,
  banned: false,
};

const SESSION = {
  id: 'session-1',
  createdAt: WHEN,
  updatedAt: WHEN,
  userId: ACCOUNT.id,
  expiresAt: WHEN,
  token: 'a-token',
};

const belongsTo = vi.fn<(userId: string, profileId: string) => Promise<boolean>>();
const list = vi.fn<(userId: string) => Promise<readonly { id: string }[]>>();
const resolve = vi.fn<(userId: string) => Promise<ReadonlySet<Permission>>>();

const reads = (signedIn: boolean, withProfiles = true): ReadsViewers => ({
  auth: {
    api: {
      getSession: () => Promise.resolve(signedIn ? { user: ACCOUNT, session: SESSION } : null),
    },
  },
  permissions: { resolve },
  ...(withProfiles ? { profiles: { belongsTo, list } } : {}),
});

beforeEach(() => {
  belongsTo.mockReset().mockResolvedValue(false);
  list.mockReset().mockResolvedValue([{ id: 'the-default' }]);
  resolve.mockReset().mockResolvedValue(new Set<Permission>());
});

describe('who a request is for', () => {
  it('answers with nobody where nobody is signed in', async () => {
    await expect(readViewer(reads(false), new Headers())).resolves.toBeNull();
  });

  it('carries the account and the face, since the two halves need different ones', async () => {
    belongsTo.mockResolvedValue(true);

    const viewer = await readViewer(reads(true), new Headers({ [PROFILE_HEADER]: 'kid' }));

    expect(viewer).toEqual({
      kind: 'account',
      accountId: 'account-1',
      profileId: 'kid',
      isAdministrator: false,
    });
  });

  it('checks the named face belongs to the account before believing it', async () => {
    belongsTo.mockResolvedValue(false);

    const viewer = await readViewer(
      reads(true),
      new Headers({ [PROFILE_HEADER]: 'somebody-else' }),
    );

    expect(belongsTo).toHaveBeenCalledWith('account-1', 'somebody-else');
    expect(viewer?.kind === 'account' && viewer.profileId).toBe('the-default');
  });

  it('falls back to the account’s own face where the header names nobody', async () => {
    const viewer = await readViewer(reads(true), new Headers());

    expect(viewer?.kind === 'account' && viewer.profileId).toBe('the-default');
  });

  it('never makes a face, since a page of posters would race fifty requests to make the same one', async () => {
    list.mockResolvedValue([]);

    const viewer = await readViewer(reads(true), new Headers());

    expect(viewer?.kind === 'account' && viewer.profileId).toBeNull();
    expect(viewer?.kind === 'account' && viewer.accountId).toBe('account-1');
  });

  it('answers with an account and no face where the server keeps no profiles', async () => {
    const viewer = await readViewer(reads(true, false), new Headers());

    expect(viewer?.kind === 'account' && viewer.profileId).toBeNull();
    expect(viewer?.kind === 'account' && viewer.accountId).toBe('account-1');
  });

  it('records an administrator as one, so enforcement can stand aside for them', async () => {
    resolve.mockResolvedValue(new Set<Permission>([ADMINISTRATOR]));

    const viewer = await readViewer(reads(true), new Headers());

    expect(viewer?.kind === 'account' && viewer.isAdministrator).toBe(true);
  });

  it('does not make an administrator of somebody holding other permissions', async () => {
    resolve.mockResolvedValue(new Set<Permission>(['library.create', 'jobs.run']));

    const viewer = await readViewer(reads(true), new Headers());

    expect(viewer?.kind === 'account' && viewer.isAdministrator).toBe(false);
  });

  it('works it out once per request rather than once per question', async () => {
    const headers = new Headers();
    const asking = reads(true);

    await Promise.all([readViewer(asking, headers), readViewer(asking, headers)]);
    await readViewer(asking, headers);

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('works it out again for a different request', async () => {
    const asking = reads(true);

    await readViewer(asking, new Headers());
    await readViewer(asking, new Headers());

    expect(resolve).toHaveBeenCalledTimes(2);
  });
});
