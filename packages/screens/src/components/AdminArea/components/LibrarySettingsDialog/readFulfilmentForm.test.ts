import { describe, expect, it } from 'vitest';
import { VALENCE, fulfilmentFormOf, readFulfilmentForm } from './readFulfilmentForm';

const APP = '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01';

describe('fulfilmentFormOf', () => {
  it('opens on Valence where nobody else fulfils the library', () => {
    expect(fulfilmentFormOf(null).appId).toBe(VALENCE);
    expect(fulfilmentFormOf({ fulfilment: null }).appId).toBe(VALENCE);
  });

  it('opens on what the library chose in its app', () => {
    expect(
      fulfilmentFormOf({
        fulfilment: {
          appId: APP,
          rootFolderPath: '/music',
          qualityProfileId: 2,
          metadataProfileId: 1,
          searchesOnAdd: false,
        },
      }),
    ).toEqual({
      appId: APP,
      rootFolderPath: '/music',
      qualityProfileId: '2',
      metadataProfileId: '1',
      searchesOnAdd: false,
    });
    expect(
      fulfilmentFormOf({
        fulfilment: {
          appId: APP,
          rootFolderPath: '/movies',
          qualityProfileId: 4,
          metadataProfileId: null,
          searchesOnAdd: true,
        },
      }).metadataProfileId,
    ).toBe('');
  });
});

describe('readFulfilmentForm', () => {
  const FORM = {
    appId: APP,
    rootFolderPath: '/movies',
    qualityProfileId: '4',
    metadataProfileId: '',
    searchesOnAdd: true,
  };

  it('reads Valence as nobody else, and a library no app can take as Valence too', () => {
    expect(readFulfilmentForm({ ...FORM, appId: VALENCE }, 'radarr')).toEqual({
      fulfilment: null,
      problem: null,
    });
    expect(readFulfilmentForm(FORM, null)).toEqual({ fulfilment: null, problem: null });
  });

  it('reads an app with its root folder and quality profile', () => {
    expect(readFulfilmentForm({ ...FORM, metadataProfileId: '1' }, 'radarr')).toEqual({
      fulfilment: {
        appId: APP,
        rootFolderPath: '/movies',
        qualityProfileId: 4,
        metadataProfileId: null,
        searchesOnAdd: true,
      },
      problem: null,
    });
    expect(
      readFulfilmentForm({ ...FORM, metadataProfileId: '1' }, 'lidarr').fulfilment,
    ).toMatchObject({ metadataProfileId: 1 });
  });

  it('says what is still to be chosen', () => {
    expect(readFulfilmentForm({ ...FORM, rootFolderPath: '' }, 'radarr').problem).toBe(
      'Choose a root folder and a quality profile from the app.',
    );
    expect(readFulfilmentForm({ ...FORM, qualityProfileId: '' }, 'radarr').problem).not.toBeNull();
    expect(readFulfilmentForm(FORM, 'lidarr').problem).toBe(
      'Choose a metadata profile for Lidarr.',
    );
  });
});
