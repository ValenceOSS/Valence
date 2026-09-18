import { describe, expect, it } from 'vitest';
import { subjectOfRequest } from './subjectOfRequest';

const ITEM = '9c858901-8a57-4791-81fe-4c455b099bc9';
const SERIES = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('what a request is about', () => {
  it('names the item behind its own page', () => {
    expect(subjectOfRequest(`/api/media/${ITEM}`)).toEqual({ kind: 'item', mediaId: ITEM });
  });

  it('names the track behind a stream or its lyrics, so a blocked song cannot be heard or read', () => {
    expect(subjectOfRequest(`/api/music/tracks/${ITEM}/stream`)).toEqual({
      kind: 'item',
      mediaId: ITEM,
    });
    expect(subjectOfRequest(`/api/music/tracks/${ITEM}/lyrics`)).toEqual({
      kind: 'item',
      mediaId: ITEM,
    });
  });

  it.each([
    ['artwork', `/api/media/${ITEM}/image/backdrop`],
    ['a preview clip', `/api/media/${ITEM}/preview`],
    ['subtitles', `/api/media/${ITEM}/subtitles`],
    ['one subtitle track', `/api/media/${ITEM}/subtitles/3`],
    ['the cues of one', `/api/media/${ITEM}/subtitles/3/cues`],
    ['segments', `/api/media/${ITEM}/segments`],
    ['progress', `/api/media/${ITEM}/progress`],
    ['a favourite', `/api/media/${ITEM}/favourite`],
    ['a rating', `/api/media/${ITEM}/rating`],
    ['what the house gave it', `/api/media/${ITEM}/rating/household`],
    ['a download', `/api/media/${ITEM}/downloads`],
    ['what playing it would cost', `/api/playback/${ITEM}/explain`],
    ['a session', `/api/playback/${ITEM}/session`],
    ['the file itself', `/api/playback/${ITEM}/file`],
    ['a sheet of thumbnails', `/api/playback/${ITEM}/trickplay`],
    ['a single frame', `/api/playback/${ITEM}/frame`],
  ])('names the item behind %s', (_what, path) => {
    expect(subjectOfRequest(path)).toEqual({ kind: 'item', mediaId: ITEM });
  });

  it('covers an address nobody has written yet, being matched by prefix', () => {
    expect(subjectOfRequest(`/api/media/${ITEM}/something-invented-later`)).toEqual({
      kind: 'item',
      mediaId: ITEM,
    });
  });

  it('names the programme behind a series address', () => {
    expect(subjectOfRequest(`/api/series/${SERIES}/rating`)).toEqual({
      kind: 'series',
      seriesId: SERIES,
    });
  });

  it.each([
    ['a session file, which names an artefact', '/api/playback/session/direct-abc/index.m3u8'],
    ['a sheet of thumbnails by its own id', '/api/playback/trickplay/abc/sheet-0.jpg'],
    ['the library listing', '/api/libraries'],
    ['a library’s items', '/api/libraries/3f2504e0-4f89-41d3-9a0c-0305e82c3301/items'],
    ['somebody’s favourites', '/api/favourites'],
    ['a person', '/api/people/500'],
    ['health', '/api/health'],
  ])('says nothing about %s', (_what, path) => {
    expect(subjectOfRequest(path)).toEqual({ kind: 'none' });
  });

  it('is not fooled by something that merely starts like an identifier', () => {
    expect(subjectOfRequest('/api/media/not-a-real-identifier/image/poster')).toEqual({
      kind: 'none',
    });
  });
});
