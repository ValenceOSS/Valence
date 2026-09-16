import { describe, expect, it } from 'vitest';
import { narrowedForTest } from '@ValenceServer/visibility/narrowedForTest';
import { reachableByViewer } from './reachableByViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

describe('which libraries an account may reach', () => {
  it('asks whether this account was refused this item’s library', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('not exists');
    expect(sql).toContain('"library_block"');
  });

  it('correlates the refusal to the row outside it, rather than to any refusal at all', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('"library_block"."libraryId" = "media_item"."libraryId"');
  });

  it('narrows to this account, so one person’s refusal is not everybody’s', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('"library_block"."userId"');
  });

  it('asks nothing of an administrator, who reaches everything', () => {
    const sql = narrowedForTest((db) =>
      reachableByViewer(db, { ...WATCHER, isAdministrator: true }),
    );

    expect(sql).not.toContain('"library_block"');
  });

  it('asks nothing of a share guest, whose reach was settled when the link was made', () => {
    const sql = narrowedForTest((db) =>
      reachableByViewer(db, { kind: 'guest', shareId: 'share-1' }),
    );

    expect(sql).not.toContain('"library_block"');
  });

  it('still narrows an account that has no profile, since this half is not the profile’s', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, { ...WATCHER, profileId: null }));

    expect(sql).toContain('"library_block"');
  });
});
