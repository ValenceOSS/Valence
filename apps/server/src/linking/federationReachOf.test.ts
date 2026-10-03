import { describe, expect, it } from 'vitest';
import { federationReachOf } from './federationReachOf';

const A_TITLE = '00000000-0000-4000-8000-000000000001';

const A_CHAPTER = '00000000-0000-4000-8000-000000000002';

const AT = '/api/federation/v1';

describe('federationReachOf', () => {
  it('passes the pairing routes through, since they check their own tokens', () => {
    expect(federationReachOf('GET', `${AT}/server`)).toEqual({ kind: 'pairing' });
    expect(federationReachOf('POST', `${AT}/pair`)).toEqual({ kind: 'pairing' });
    expect(federationReachOf('GET', `${AT}/pair/${A_TITLE}`)).toEqual({ kind: 'pairing' });
    expect(federationReachOf('POST', `${AT}/unlink`)).toEqual({ kind: 'pairing' });
  });

  it('passes a player streaming directly with a ticket through, as far as the ticket', () => {
    expect(federationReachOf('GET', `${AT}/direct/${'a'.repeat(43)}/index.m3u8`)).toEqual({
      kind: 'ticket',
    });
    expect(federationReachOf('GET', `${AT}/direct/short/index.m3u8`)).toEqual({
      kind: 'refused',
    });
  });

  it('names what is asked of this server as a whole', () => {
    expect(federationReachOf('GET', `${AT}/libraries`)).toEqual({
      kind: 'server',
      action: 'libraries',
    });
    expect(federationReachOf('get', `${AT}/activity`)).toEqual({
      kind: 'server',
      action: 'activity',
    });
    expect(federationReachOf('POST', `${AT}/parties/say`)).toEqual({
      kind: 'server',
      action: 'parties',
    });
    expect(federationReachOf('POST', `${AT}/requests`)).toEqual({
      kind: 'server',
      action: 'requests',
    });
    expect(federationReachOf('POST', `${AT}/direct`)).toEqual({ kind: 'server', action: 'media' });
  });

  it('names the library whose catalogue is asked for', () => {
    expect(federationReachOf('GET', `${AT}/catalogue/${A_TITLE}`)).toEqual({
      kind: 'catalogue',
      action: 'catalogue',
      libraryId: A_TITLE,
    });
  });

  it('names the title, book, album or artist a passed-through request reaches', () => {
    expect(federationReachOf('GET', `${AT}/api/media/${A_TITLE}/image/poster`)).toEqual({
      kind: 'subject',
      action: 'media',
      subject: { kind: 'item', id: A_TITLE },
      inner: `/api/media/${A_TITLE}/image/poster`,
    });
    expect(federationReachOf('POST', `${AT}/api/playback/${A_TITLE}/session`)).toMatchObject({
      subject: { kind: 'item', id: A_TITLE },
    });
    expect(
      federationReachOf('GET', `${AT}/api/books/${A_TITLE}/chapters/${A_CHAPTER}/pages/3`),
    ).toMatchObject({ subject: { kind: 'book', id: A_TITLE } });
    expect(federationReachOf('GET', `${AT}/api/music/albums/${A_TITLE}/artwork`)).toMatchObject({
      subject: { kind: 'album', id: A_TITLE },
    });
    expect(federationReachOf('GET', `${AT}/api/music/artists/${A_TITLE}/image`)).toMatchObject({
      subject: { kind: 'artist', id: A_TITLE },
    });
  });

  it('names a session or set of thumbnails the asking server started', () => {
    expect(federationReachOf('GET', `${AT}/api/playback/session/abc/index.m3u8`)).toEqual({
      kind: 'claimed',
      action: 'media',
      claim: 'session',
      id: 'abc',
      inner: '/api/playback/session/abc/index.m3u8',
    });
    expect(federationReachOf('DELETE', `${AT}/api/playback/session/abc`)).toMatchObject({
      claim: 'session',
      id: 'abc',
    });
    expect(federationReachOf('GET', `${AT}/api/playback/trickplay/xyz/0.jpg`)).toMatchObject({
      claim: 'trickplay',
      id: 'xyz',
    });
  });

  it('refuses everything it does not name, and the right path asked the wrong way', () => {
    expect(federationReachOf('GET', `${AT}/accounts`)).toEqual({ kind: 'refused' });
    expect(federationReachOf('POST', `${AT}/libraries`)).toEqual({ kind: 'refused' });
    expect(federationReachOf('GET', `${AT}/api/libraries`)).toEqual({ kind: 'refused' });
    expect(federationReachOf('DELETE', `${AT}/api/media/${A_TITLE}/image/poster`)).toEqual({
      kind: 'refused',
    });
    expect(federationReachOf('GET', `${AT}/api/media/not-an-id/image/poster`)).toEqual({
      kind: 'refused',
    });
    expect(federationReachOf('GET', '/api/libraries')).toEqual({ kind: 'refused' });
  });
});
