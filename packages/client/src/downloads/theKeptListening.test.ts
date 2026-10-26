import { afterEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { forgetTheKeptListening, theKeptListening } from './theKeptListening';

afterEach(() => {
  forgetTheKeptListening();
});

describe('theKeptListening', () => {
  it('is one shelf for the whole client', () => {
    expect(theKeptListening()).toBe(theKeptListening());
  });

  it('starts from nothing once it has been forgotten', () => {
    const before = theKeptListening();

    forgetTheKeptListening();

    expect(theKeptListening()).not.toBe(before);
  });

  it('carries on fetching what it was fetching when the app last closed', () => {
    const files = aFakeListeningFiles();
    const platform = aFakePlatform({ listeningFiles: files.files });
    const kept = aKeptListening({ artworkFrom: null, tracks: [aTrack(1)] });
    const name = `track-${aTrack(1).id}-lossless.flac`;

    platform.store.write(
      'valence.kept.listening',
      JSON.stringify({
        kept: [kept],
        files: [{ name, from: '/api/music/tracks', state: 'fetching' }],
      }),
    );
    installPlatform(platform);

    expect(theKeptListening().shelf().kept).toEqual([kept]);
    expect(files.asked).toEqual([name]);
  });

  it('keeps for the server the platform says is in use', async () => {
    const files = aFakeListeningFiles();

    installPlatform(
      aFakePlatform({
        listeningFiles: files.files,
        serverAddress: () => 'https://valence.example',
      }),
    );
    await theKeptListening().keep(aKeptListening({ server: 'https://elsewhere.example' }));

    expect(files.asked).toEqual([]);
  });
});
