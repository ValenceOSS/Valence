import { describe, expect, it } from 'vitest';
import { narrowedForTest } from '@ValenceServer/visibility/narrowedForTest';
import { hiddenFromViewer } from './hiddenFromViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

describe('the list somebody brings things back from', () => {
  it('keeps what they hid rather than removing it', () => {
    const sql = narrowedForTest((db) => hiddenFromViewer(db, WATCHER));

    expect(sql).toContain('exists (select 1 from "hidden"');
    expect(sql).not.toContain('not exists (select 1 from "hidden"');
  });

  it('still refuses to name what their account may not reach', () => {
    const sql = narrowedForTest((db) => hiddenFromViewer(db, WATCHER));

    expect(sql).toContain('not exists (select 1 from "library_block"');
  });

  it('lists nothing at all, rather than everything, where there is no profile', () => {
    const sql = narrowedForTest((db) => hiddenFromViewer(db, { ...WATCHER, profileId: null }));

    expect(sql).toContain('false');
    expect(sql).not.toContain('"hidden"');
  });

  it('lists nothing for a share guest', () => {
    const sql = narrowedForTest((db) =>
      hiddenFromViewer(db, { kind: 'guest', shareId: 'share-1' }),
    );

    expect(sql).toContain('false');
  });

  it('lists an administrator only what they hid, unnarrowed by reach', () => {
    const sql = narrowedForTest((db) =>
      hiddenFromViewer(db, { ...WATCHER, isAdministrator: true }),
    );

    expect(sql).toContain('"hidden"');
    expect(sql).not.toContain('"library_block"');
  });
});
