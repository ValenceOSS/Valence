import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  forgetTheKeptListening,
  theKeptListening,
} from '@ValenceClient/downloads/theKeptListening';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { useKeptListening } from './useKeptListening';

const SERVER = 'https://valence.example';

beforeEach(() => {
  installPlatform(
    aFakePlatform({ listeningFiles: aFakeListeningFiles().files, serverAddress: () => SERVER }),
  );
});

afterEach(() => {
  forgetTheKeptListening();
});

describe('useKeptListening', () => {
  it('starts with nothing kept', () => {
    expect(renderHook(() => useKeptListening()).result.current).toEqual({
      kept: [],
      files: [],
      here: [],
    });
  });

  it('follows the shelf as something is kept', async () => {
    const { result } = renderHook(() => useKeptListening());

    await act(async () => {
      await theKeptListening().keep(aKeptListening({ server: SERVER }));
    });

    expect(result.current.kept.map((kept) => kept.title)).toEqual(['Even In Arcadia']);
    expect(result.current.files).toHaveLength(3);
  });

  it('lists as here only what was kept from this server, or from no server in particular', async () => {
    const { result } = renderHook(() => useKeptListening());

    await act(async () => {
      await theKeptListening().keep(aKeptListening({ id: 'from-here', server: SERVER }));
      await theKeptListening().keep(
        aKeptListening({ id: 'from-elsewhere', server: 'https://elsewhere.example' }),
      );
      await theKeptListening().keep(aKeptListening({ id: 'from-anywhere', server: null }));
    });

    expect(result.current.kept).toHaveLength(3);
    expect(result.current.here.map((kept) => kept.id)).toEqual(['from-anywhere', 'from-here']);
  });

  it('stops following the shelf once the screen goes', async () => {
    const { result, unmount } = renderHook(() => useKeptListening());

    unmount();

    await act(async () => {
      await theKeptListening().keep(aKeptListening());
    });

    expect(result.current.kept).toEqual([]);
  });
});
