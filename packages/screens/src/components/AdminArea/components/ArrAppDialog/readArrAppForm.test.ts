import { describe, expect, it } from 'vitest';
import { ARR_APP_NAMES } from '@ValenceScreens/components/AdminArea/ARR_APP_NAMES';
import { arrAppFormFor, choosingArrKind } from './readArrAppForm';

const APP = {
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Films',
  kind: 'radarr' as const,
  url: 'http://radarr:7878',
  hasApiKey: true,
  remotePath: '/movies',
  localPath: '/media/Films',
  isEnabled: false,
  isWorking: null,
  version: null,
  lastCheckedAt: null,
  lastProblem: null,
  lastProblemCode: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

describe('arrAppFormFor', () => {
  it('opens on a Radarr at its usual address, or on the app being changed with no key shown', () => {
    expect(arrAppFormFor(null, ARR_APP_NAMES)).toMatchObject({
      kind: 'radarr',
      name: 'Radarr',
      url: 'http://radarr:7878',
    });
    expect(arrAppFormFor(APP, ARR_APP_NAMES)).toMatchObject({
      name: 'Films',
      apiKey: '',
      remotePath: '/movies',
      isEnabled: false,
    });
  });
});

describe('choosingArrKind', () => {
  it('brings the kind’s name and address, unless somebody typed their own', () => {
    const form = arrAppFormFor(null, ARR_APP_NAMES);

    expect(choosingArrKind(form, 'prowlarr', ARR_APP_NAMES)).toEqual({
      kind: 'prowlarr',
      name: 'Prowlarr',
      url: 'http://prowlarr:9696',
    });
    expect(
      choosingArrKind(
        { ...form, name: 'Mine', url: 'https://tv.example' },
        'sonarr',
        ARR_APP_NAMES,
      ),
    ).toEqual({ kind: 'sonarr', name: 'Mine', url: 'https://tv.example' });
  });
});
