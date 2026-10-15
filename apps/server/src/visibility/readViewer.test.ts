import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import { readViewer } from './readViewer';
import type { ReadsViewers } from './readViewer';

const acting = vi.fn<(headers: Headers) => Promise<Acting | null>>();
const grants = vi.fn<(headers: Headers) => Promise<ReadonlySet<GrantedPermission>>>();
const lockedLibraries = vi.fn<(headers: Headers, holder: string) => Promise<readonly string[]>>();

const KID: Acting = {
  account: { id: 'account-1', name: 'Dan', email: 'dan@valence.local' },
  sessionId: 'session-1',
  isViaKey: false,
  profile: { id: 'kid', name: 'Kid', isOwner: false, mayRequest: true },
  mustChoose: false,
};

const reads = (withLocks = false): ReadsViewers => ({
  acting,
  grants,
  ...(withLocks ? { lockedLibraries } : {}),
});

beforeEach(() => {
  acting.mockReset().mockResolvedValue(KID);
  grants.mockReset().mockResolvedValue(new Set<GrantedPermission>());
  lockedLibraries.mockReset().mockResolvedValue([]);
});

describe('who a request is for', () => {
  it('answers with nobody where nobody is signed in', async () => {
    acting.mockResolvedValue(null);

    await expect(readViewer(reads(), new Headers())).resolves.toBeNull();
  });

  it('carries the account and the profile acting for it', async () => {
    await expect(readViewer(reads(), new Headers())).resolves.toEqual({
      kind: 'account',
      accountId: 'account-1',
      profileId: 'kid',
      isAdministrator: false,
    });
  });

  it('carries no profile for a session that has not chosen one', async () => {
    acting.mockResolvedValue({ ...KID, profile: null, mustChoose: true });

    const viewer = await readViewer(reads(), new Headers());

    expect(viewer?.kind === 'account' && viewer.profileId).toBeNull();
  });

  it('records an administrator only where the profile acting holds it', async () => {
    grants.mockResolvedValue(new Set<GrantedPermission>([ADMINISTRATOR]));

    const viewer = await readViewer(reads(), new Headers());

    expect(viewer?.kind === 'account' && viewer.isAdministrator).toBe(true);
  });

  it('does not make an administrator of somebody holding other permissions', async () => {
    grants.mockResolvedValue(new Set<GrantedPermission>(['library.edit']));

    const viewer = await readViewer(reads(), new Headers());

    expect(viewer?.kind === 'account' && viewer.isAdministrator).toBe(false);
  });

  it('asks which libraries are locked for this profile on this account', async () => {
    lockedLibraries.mockResolvedValue(['films']);

    const viewer = await readViewer(reads(true), new Headers());

    expect(lockedLibraries).toHaveBeenCalledWith(expect.any(Headers), 'account-1/kid');
    expect(viewer).toMatchObject({ lockedLibraries: ['films'] });
  });

  it('works it out once per request rather than once per question', async () => {
    const headers = new Headers();

    await readViewer(reads(), headers);
    await readViewer(reads(), headers);

    expect(acting).toHaveBeenCalledTimes(1);
  });

  it('works it out again for a different request', async () => {
    await readViewer(reads(), new Headers());
    await readViewer(reads(), new Headers());

    expect(acting).toHaveBeenCalledTimes(2);
  });
});
