import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { keptArtworkName } from '@ValenceClient/downloads/filesOfKeptListening';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import {
  forgetTheKeptListening,
  theKeptListening,
} from '@ValenceClient/downloads/theKeptListening';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { fetchEveryFileOf } from '@ValenceClient/testing/fetchEveryFileOf';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { useAudiobookDownloadAction } from './useAudiobookDownloadAction';

const DETAIL = anAudiobook();

const ARTWORK = keptArtworkName({ kind: 'audiobook', id: DETAIL.book.id });

let fake = aFakeListeningFiles();

beforeEach(() => {
  fake = aFakeListeningFiles();
  installATestClient({ listeningFiles: fake.files });
  forgetTheKeptListening();
});

describe('useAudiobookDownloadAction', () => {
  it('offers nothing before the book has been read', () => {
    const { result } = renderHook(() => useAudiobookDownloadAction(null));

    expect(result.current).toBeNull();
  });

  it('offers nothing for a book with nothing to hear', () => {
    const { result } = renderHook(() =>
      useAudiobookDownloadAction(anAudiobook({ hasAudio: false })),
    );

    expect(result.current).toBeNull();
  });

  it('offers nothing where this client keeps no files', () => {
    installATestClient({ canKeepFiles: () => false, listeningFiles: fake.files });

    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    expect(result.current).toBeNull();
  });

  it('offers a download, with nothing more to choose, and keeps the book when chosen', async () => {
    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    expect([result.current?.label, result.current?.choices]).toEqual(['Download', undefined]);

    act(() => {
      result.current?.onChoose();
    });

    await waitFor(() => {
      expect(fake.asked).toEqual([ARTWORK]);
    });
    expect(theKeptListening().shelf().kept[0]?.id).toBe(DETAIL.book.id);
  });

  it('says how far the download has got once begun, and pauses it from its choices', async () => {
    await theKeptListening().keep(keptListeningOf({ kind: 'audiobook', detail: DETAIL }));

    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    expect(result.current?.label).toBe('Downloading 0 of 2');

    act(() => {
      result.current?.choices?.find((choice) => choice.id === 'pause')?.onChoose();
    });

    await waitFor(() => {
      expect(result.current?.label).toBe('Paused at 0 of 2');
    });
    expect(fake.stopped).toEqual([ARTWORK]);
  });

  it('offers to fetch it again or take it off once begun', async () => {
    await theKeptListening().keep(keptListeningOf({ kind: 'audiobook', detail: DETAIL }));

    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    expect(result.current?.choices?.map((choice) => choice.label)).toEqual([
      `Pause ${DETAIL.book.title}`,
      'Download it again',
      'Remove the download',
    ]);
  });

  it('says it has arrived, and offers no pause once it has', async () => {
    const kept = keptListeningOf({ kind: 'audiobook', detail: DETAIL });

    await theKeptListening().keep(kept);
    await fetchEveryFileOf(fake, kept);

    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    await waitFor(() => {
      expect(result.current?.label).toBe('Downloaded');
    });

    expect(result.current?.choices?.map((choice) => choice.id)).toEqual(['again', 'remove']);
    expect(fake.stopped).toEqual([]);
    expect(theKeptListening().shelf().kept).toHaveLength(1);
  });

  it('takes the book off the device', async () => {
    const kept = keptListeningOf({ kind: 'audiobook', detail: DETAIL });

    await theKeptListening().keep(kept);
    await fetchEveryFileOf(fake, kept);

    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    act(() => {
      result.current?.choices?.find((choice) => choice.id === 'remove')?.onChoose();
    });

    await waitFor(() => {
      expect(result.current?.label).toBe('Download');
    });
    expect(fake.dropped).toHaveLength(3);
  });

  it('fetches it again when asked', async () => {
    await theKeptListening().keep(keptListeningOf({ kind: 'audiobook', detail: DETAIL }));
    await theKeptListening().pause('audiobook', DETAIL.book.id, true);

    const { result } = renderHook(() => useAudiobookDownloadAction(DETAIL));

    act(() => {
      result.current?.choices?.find((choice) => choice.id === 'again')?.onChoose();
    });

    await waitFor(() => {
      expect(result.current?.label).toBe('Downloading 0 of 2');
    });
  });
});
