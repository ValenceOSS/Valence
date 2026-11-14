import { describe, expect, it } from 'vitest';
import { createEveryTitleGate } from './createEveryTitleGate';
import type { AgeCeiling } from '@ValenceServer/library/LibraryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const SOMEBODY: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: null,
  isAdministrator: false,
};

const A_CEILING: AgeCeiling = {
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  maximumAge: 12,
  allowsUnrated: false,
};

/**
 * The gate, over somebody who may or may not override titles and has the limits given.
 */
const gate = (
  options: {
    overrides?: boolean;
    viewer?: Viewer | null;
    refused?: string[];
    ceilings?: AgeCeiling[];
  } = {},
) =>
  createEveryTitleGate({
    requires: () => Promise.resolve(options.overrides ?? true),
    viewerOf: () => Promise.resolve(options.viewer === undefined ? SOMEBODY : options.viewer),
    library: {
      refusedLibraries: () => Promise.resolve(options.refused ?? []),
      ceilingsFor: () => Promise.resolve(options.ceilings ?? []),
    },
  })(new Headers());

describe('createEveryTitleGate', () => {
  it('lets somebody who may override titles and sees every library in', async () => {
    expect(await gate()).toBe(true);
  });

  it('keeps out somebody kept from a library or held to an age', async () => {
    expect(await gate({ refused: ['3f2504e0-4f89-41d3-9a0c-0305e82c3301'] })).toBe(false);
    expect(await gate({ ceilings: [A_CEILING] })).toBe(false);
  });

  it('lets an administrator in whatever is recorded against them', async () => {
    expect(
      await gate({ viewer: { ...SOMEBODY, isAdministrator: true }, refused: ['anything'] }),
    ).toBe(true);
  });

  it('keeps out somebody who may not override titles, or nobody at all', async () => {
    expect(await gate({ overrides: false })).toBe(false);
    expect(await gate({ viewer: null })).toBe(false);
  });
});
