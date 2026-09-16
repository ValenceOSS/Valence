import { describe, expect, it } from 'vitest';
import { narrowedForTest } from '@ValenceServer/visibility/narrowedForTest';
import { hiddenByViewer } from './hiddenByViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

describe('what a profile has put out of its own sight', () => {
  it('asks whether this profile hid it', () => {
    const sql = narrowedForTest((db) => hiddenByViewer(db, WATCHER));

    expect(sql).toContain('exists');
    expect(sql).toContain('"hidden"."profileId"');
  });

  it('catches all three things a row can name', () => {
    const sql = narrowedForTest((db) => hiddenByViewer(db, WATCHER));

    expect(sql).toContain('"hidden"."mediaItemId" = "media_item"."id"');
    expect(sql).toContain('"hidden"."seriesId" = "media_item"."seriesId"');
    expect(sql).toContain('"hidden"."libraryId" = "media_item"."libraryId"');
  });

  it('asks for any one of them rather than all of them', () => {
    const sql = narrowedForTest((db) => hiddenByViewer(db, WATCHER));

    expect(sql).toContain('or "hidden"."seriesId"');
  });

  it('still applies to an administrator, since hiding is a preference and not a permission', () => {
    const sql = narrowedForTest((db) => hiddenByViewer(db, { ...WATCHER, isAdministrator: true }));

    expect(sql).toContain('"hidden"');
  });

  it('asks nothing of a share guest, who has no face to have hidden anything with', () => {
    const sql = narrowedForTest((db) => hiddenByViewer(db, { kind: 'guest', shareId: 'share-1' }));

    expect(sql).not.toContain('"hidden"');
  });

  it('asks nothing where the server keeps no profiles at all', () => {
    const sql = narrowedForTest((db) => hiddenByViewer(db, { ...WATCHER, profileId: null }));

    expect(sql).not.toContain('"hidden"');
  });
});
