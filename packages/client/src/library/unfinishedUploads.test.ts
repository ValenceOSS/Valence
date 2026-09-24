import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  forgetUnfinishedUpload,
  keyOfUpload,
  readUnfinishedUploads,
  rememberUnfinishedUpload,
} from './unfinishedUploads';

const upload = (key: string, libraryId = 'films') => ({
  key,
  libraryId,
  path: `${key}.mkv`,
  bytes: 10,
  uploadId: `id-${key}`,
  pieceBytes: 5,
  startedAt: '2026-09-24T00:00:00.000Z',
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('unfinished uploads', () => {
  it('remembers an upload, once per file, and reads them back by library', () => {
    rememberUnfinishedUpload(upload('a'));
    rememberUnfinishedUpload(upload('b', 'shows'));
    rememberUnfinishedUpload({ ...upload('a'), uploadId: 'id-again' });

    expect(readUnfinishedUploads().map((one) => one.uploadId)).toEqual(['id-b', 'id-again']);
    expect(readUnfinishedUploads('films').map((one) => one.key)).toEqual(['a']);
  });

  it('forgets one, and leaves nothing behind once the last is gone', () => {
    const platform = aFakePlatform();

    installPlatform(platform);
    rememberUnfinishedUpload(upload('a'));
    forgetUnfinishedUpload('a');

    expect(readUnfinishedUploads()).toEqual([]);
    expect(platform.store.read('valence.unfinishedUploads')).toBeNull();
  });

  it('reads nothing where what was kept cannot be read', () => {
    const platform = aFakePlatform();

    installPlatform(platform);
    platform.store.write('valence.unfinishedUploads', '{"not":"a list"}');

    expect(readUnfinishedUploads()).toEqual([]);
  });

  it('tells a file apart by where it is going, its size and when it last changed', () => {
    const film = new File(['x'], 'Arrival.mkv', { lastModified: 1 });
    const edited = new File(['x'], 'Arrival.mkv', { lastModified: 2 });

    expect(keyOfUpload('films', 'Arrival.mkv', film)).not.toBe(
      keyOfUpload('films', 'Arrival.mkv', edited),
    );
    expect(keyOfUpload('films', 'Arrival.mkv', film)).toBe(
      keyOfUpload('films', 'Arrival.mkv', new File(['y'], 'other', { lastModified: 1 })),
    );
  });
});
