import { describe, expect, it } from 'vitest';
import { narrowedForTest } from '@ValenceServer/visibility/narrowedForTest';
import { visibleToViewer } from './visibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

describe('what a viewer is shown', () => {
  it('asks both halves at once, which is the only place they are combined', () => {
    const sql = narrowedForTest((db) => visibleToViewer(db, WATCHER));

    expect(sql).toContain('"library_block"');
    expect(sql).toContain('"hidden"');
  });

  it('removes what they hid rather than keeping only it', () => {
    const sql = narrowedForTest((db) => visibleToViewer(db, WATCHER));

    expect(sql).toContain('not exists (select 1 from "hidden"');
  });

  it('shows an administrator everything except what they hid themselves', () => {
    const sql = narrowedForTest((db) => visibleToViewer(db, { ...WATCHER, isAdministrator: true }));

    expect(sql).not.toContain('"library_block"');
    expect(sql).toContain('"hidden"');
  });

  it('narrows a share guest in neither way, their reach having been settled already', () => {
    const sql = narrowedForTest((db) => visibleToViewer(db, { kind: 'guest', shareId: 'share-1' }));

    expect(sql).not.toContain('"library_block"');
    expect(sql).not.toContain('"hidden"');
  });

  it('narrows an account with no profile by what it may reach and nothing more', () => {
    const sql = narrowedForTest((db) => visibleToViewer(db, { ...WATCHER, profileId: null }));

    expect(sql).toContain('"library_block"');
    expect(sql).not.toContain('"hidden"');
  });

  it('leaves a query over an unrestricted administrator with no visibility clause at all', () => {
    const sql = narrowedForTest((db) =>
      visibleToViewer(db, {
        kind: 'account',
        accountId: 'a',
        profileId: null,
        isAdministrator: true,
      }),
    );

    expect(sql).not.toContain('"library_block"');
    expect(sql).not.toContain('"hidden"');
  });
});
