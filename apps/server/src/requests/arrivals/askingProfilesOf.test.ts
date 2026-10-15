import { describe, expect, it } from 'vitest';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';
import { askingProfilesOf } from './askingProfilesOf';

const DAD = '00000000-0000-4000-8000-000000000001';
const KID = '00000000-0000-4000-8000-000000000002';

const asking = (id: string, profileId?: string): Requester => ({
  id,
  name: id,
  ...(profileId === undefined ? {} : { askingProfile: { profileId, name: profileId } }),
});

describe('askingProfilesOf', () => {
  it('names the profiles that asked on each account', () => {
    expect(
      askingProfilesOf([asking('home', KID), asking('home', DAD), asking('next', DAD)]),
    ).toEqual(
      new Map([
        ['home', [KID, DAD]],
        ['next', [DAD]],
      ]),
    );
  });

  it('names a profile once however often it asked', () => {
    expect(askingProfilesOf([asking('home', KID), asking('home', KID)])).toEqual(
      new Map([['home', [KID]]]),
    );
  });

  it('leaves out an account that asked before profiles were recorded, so all of it is told', () => {
    expect(askingProfilesOf([asking('home', KID), asking('home')]).has('home')).toBe(false);
  });

  it('leaves out an asker whose profile is not recorded', () => {
    expect(askingProfilesOf([asking('home')])).toEqual(new Map());
  });
});
