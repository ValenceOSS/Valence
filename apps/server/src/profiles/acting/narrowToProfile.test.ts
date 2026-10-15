import { describe, expect, it } from 'vitest';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import { narrowToProfile } from './narrowToProfile';

const HELD = new Set<GrantedPermission>([
  ADMINISTRATOR,
  'library.edit',
  'sharing.link',
  'sharing.party',
  'download.media',
  'requests.ask',
  'requests.askMusic',
  'requests.viewAll',
]);

const profile = (isOwner: boolean, mayRequest = true) => ({
  id: 'kid',
  name: 'Kid',
  isOwner,
  mayRequest,
});

describe('narrowToProfile', () => {
  it('gives the account’s owner everything the account holds', () => {
    expect(narrowToProfile(HELD, { profile: profile(true), mustChoose: false })).toBe(HELD);
  });

  it('gives the account everything where no profile stands for it', () => {
    expect(narrowToProfile(HELD, { profile: null, mustChoose: false })).toBe(HELD);
  });

  it('gives nothing to a session that has not chosen who is watching', () => {
    expect(narrowToProfile(HELD, { profile: null, mustChoose: true })).toEqual(new Set());
  });

  it('gives nothing to a session that must choose, even carrying the owner', () => {
    expect(narrowToProfile(HELD, { profile: profile(true), mustChoose: true })).toEqual(new Set());
  });

  it('gives any other profile only the everyday things every profile may do', () => {
    expect(narrowToProfile(HELD, { profile: profile(false), mustChoose: false })).toEqual(
      new Set([
        'sharing.link',
        'sharing.party',
        'download.media',
        'requests.ask',
        'requests.askMusic',
        'requests.viewAll',
      ]),
    );
  });

  it('takes asking for things away from a profile the owner stopped requesting', () => {
    expect(narrowToProfile(HELD, { profile: profile(false, false), mustChoose: false })).toEqual(
      new Set(['sharing.link', 'sharing.party', 'download.media', 'requests.viewAll']),
    );
  });

  it('never gives a profile more than its account holds', () => {
    const held = new Set<GrantedPermission>(['sharing.link']);

    expect(narrowToProfile(held, { profile: profile(false), mustChoose: false })).toEqual(
      new Set(['sharing.link']),
    );
  });

  it('leaves the owner able to request whatever the switch says', () => {
    expect(
      narrowToProfile(HELD, { profile: profile(true, false), mustChoose: false }).has(
        'requests.ask',
      ),
    ).toBe(true);
  });
});
