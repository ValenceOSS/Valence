import { describe, expect, it } from 'vitest';
import {
  LibrarySchema,
  MediaDetailSchema,
  MediaPageSchema,
} from '@ValenceContracts/schemas/Library';
import { ShowDetailSchema, ShowListSchema, UpNextSchema } from '@ValenceContracts/schemas/Show';
import { WatchProgressListSchema } from '@ValenceContracts/schemas/WatchProgress';
import { ViewerProfileListSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { GetSessionResponseSchema, SignInResponseSchema } from '@ValenceContracts/schemas/Session';
import { z } from 'zod';
import { createJellyfinAnswers } from './createJellyfinAnswers';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { jellyfinLinks } from './jellyfinLinks';
import { aFakeJellyfin } from './testing/aFakeJellyfin';
import { aFakeStore } from './testing/aFakeStore';

const PROFILE = {
  schemaVersion: 1,
  name: 'A phone',
  maxWidth: 1920,
  maxHeight: 1080,
  maxAudioChannels: 2,
  supportedVideoRanges: ['SDR'],
  supportedSubtitleFormats: ['webvtt'],
  transcodingProfiles: [
    { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

/**
 * The answers over a fake Jellyfin server, linked but not yet signed in.
 *
 * @returns How to ask, and the fake server.
 */
const answersOver = () => {
  const jellyfin = aFakeJellyfin();
  const store = aFakeStore();
  const links = jellyfinLinks(store);
  const book = createJellyfinIdBook(store);
  const answers = createJellyfinAnswers({
    links,
    book,
    send: jellyfin.send,
    device: () => ({
      app: 'Valence',
      device: 'A phone',
      deviceId: 'phone-1234567',
      version: '1.0',
    }),
  });
  const link = {
    address: jellyfin.address,
    serverId: 's',
    serverName: 'Den',
    token: null,
    userId: null,
    userName: null,
    isAdministrator: false,
  };

  links.keep(link);

  const call = async (method: string, path: string, body?: object) => {
    const answer = await answers.answer(
      link,
      new Request(`${jellyfin.address}${path}`, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
    const text = await answer.text();

    return { status: answer.status, value: z.json().parse(text === '' ? null : JSON.parse(text)) };
  };

  const signIn = () =>
    call('POST', '/api/auth/sign-in/username', { username: 'marnie', password: 'right' });

  return { call, signIn, jellyfin, book, links };
};

describe('createJellyfinAnswers', () => {
  it('says it is up and does little, before anybody signs in', async () => {
    const { call } = answersOver();

    expect((await call('GET', '/api/health')).status).toBe(200);
    expect(JSON.stringify((await call('GET', '/api/about')).value)).toContain('library.upNext');
    expect((await call('GET', '/api/auth/get-session')).value).toBeNull();
    expect((await call('GET', '/api/libraries')).status).toBe(401);
  });

  it('signs in as a Jellyfin user, and keeps the token for this server', async () => {
    const { signIn, call, links, jellyfin } = answersOver();
    const signed = await signIn();

    expect(signed.status).toBe(200);
    expect(SignInResponseSchema.safeParse(signed.value).success).toBe(true);
    expect(links.of(jellyfin.address)?.token).toBe('jellyfin-token');
    expect(
      GetSessionResponseSchema.parse((await call('GET', '/api/auth/get-session')).value)?.user.name,
    ).toBe('marnie');
  });

  it('refuses a wrong password', async () => {
    const { call } = answersOver();

    expect(
      (await call('POST', '/api/auth/sign-in/email', { email: 'm@x.test', password: 'wrong' }))
        .status,
    ).toBe(401);
  });

  it('answers with the signed-in user as the one profile', async () => {
    const { signIn, call } = answersOver();

    await signIn();

    const profiles = ViewerProfileListSchema.parse((await call('GET', '/api/profiles')).value);

    expect(profiles.profiles.map((one) => one.name)).toEqual(['marnie']);
    expect(profiles.chosenProfileId).toBe(profiles.profiles[0]?.id);
  });

  it('lists the film and programme views as libraries, and leaves music out', async () => {
    const { signIn, call } = answersOver();

    await signIn();

    const libraries = z.array(LibrarySchema).parse((await call('GET', '/api/libraries')).value);

    expect(libraries.map((one) => [one.name, one.kind])).toEqual([
      ['Films', 'movies'],
      ['Shows', 'shows'],
    ]);
  });

  it('lists a library’s films, a programme and its seasons, and one item, in Valence’s shapes', async () => {
    const { signIn, call } = answersOver();

    await signIn();

    const [films, shows] = z
      .array(LibrarySchema)
      .parse((await call('GET', '/api/libraries')).value);
    const page = MediaPageSchema.parse(
      (await call('GET', `/api/libraries/${films?.id ?? ''}/items`)).value,
    );
    const list = ShowListSchema.parse(
      (await call('GET', `/api/libraries/${shows?.id ?? ''}/shows`)).value,
    );
    const show = ShowDetailSchema.parse(
      (await call('GET', `/api/libraries/${shows?.id ?? ''}/shows/${list.shows[0]?.id ?? ''}`))
        .value,
    );
    const episode = show.seasons[0]?.episodes[0];
    const detail = MediaDetailSchema.parse(
      (await call('GET', `/api/media/${episode?.id ?? ''}`)).value,
    );

    expect(page.items.map((one) => one.title)).toEqual(['Sneakers']);
    expect(show.seasons.map((one) => one.seasonNumber)).toEqual([1, 2]);
    expect(detail).toMatchObject({ title: 'Pilot', container: 'mkv', libraryId: shows?.id });
    expect(detail.subtitleStreams).toMatchObject([{ index: 2, format: 'srt', language: 'eng' }]);
  });

  it('answers what is next and how far somebody got', async () => {
    const { signIn, call } = answersOver();

    await signIn();

    const next = UpNextSchema.parse((await call('GET', '/api/up-next')).value);
    const progress = WatchProgressListSchema.parse((await call('GET', '/api/progress')).value);

    expect(next.episodes.map((one) => one.episode.title)).toEqual(['Traces to Nowhere']);
    expect(progress.progress).toMatchObject([{ positionSeconds: 30, isFinished: false }]);
  });

  it('plays the file directly where the app takes it, and Jellyfin’s stream where it does not', async () => {
    const { signIn, call, jellyfin, book } = answersOver();

    await signIn();

    const mediaId = book.valenceIdOf(jellyfin.film.Id);
    const direct = await call('POST', `/api/playback/${mediaId}/session`, {
      deviceProfile: {
        ...PROFILE,
        directPlayProfiles: [{ container: 'mkv', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
      },
    });
    const converted = await call('POST', `/api/playback/${mediaId}/session`, {
      deviceProfile: {
        ...PROFILE,
        directPlayProfiles: [{ container: 'mp4', videoCodecs: ['hevc'], audioCodecs: ['aac'] }],
      },
    });

    expect(direct.value).toMatchObject({ mode: 'DirectPlay', delivery: { kind: 'direct' } });
    expect(JSON.stringify(direct.value)).toContain(
      '/Videos/87d216619130f7261a2f6c054af5ff81/stream?static=true',
    );
    expect(converted.value).toMatchObject({
      mode: 'Transcode',
      delivery: {
        kind: 'hls',
        manifestUrl: 'http://jellyfin.test/videos/x/master.m3u8?api_key=jellyfin-token',
      },
    });
  });

  it('tells Jellyfin where playback got to, that it was finished, and that it stopped', async () => {
    const { signIn, call, jellyfin, book } = answersOver();

    await signIn();

    const mediaId = book.valenceIdOf(jellyfin.film.Id);

    await call('POST', `/api/playback/${mediaId}/session`, {
      deviceProfile: {
        ...PROFILE,
        directPlayProfiles: [{ container: 'mkv', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
      },
    });
    await call('PUT', `/api/media/${mediaId}/progress`, {
      positionSeconds: 42,
      durationSeconds: 60,
    });
    await call('PUT', `/api/media/${mediaId}/progress`, {
      positionSeconds: 60,
      durationSeconds: 60,
      isFinished: true,
    });
    await call('DELETE', '/api/playback/session/play-1');

    const writes = jellyfin.asked.filter((one) => one.method === 'POST').map((one) => one.path);

    for (const written of [
      '/Sessions/Playing',
      `/UserItems/${jellyfin.film.Id}/UserData`,
      `/UserPlayedItems/${jellyfin.film.Id}`,
      '/Sessions/Playing/Stopped',
    ]) {
      expect(writes).toContain(written);
    }
    expect(jellyfin.asked.find((one) => one.path === '/Sessions/Playing/Stopped')?.body).toContain(
      '"PositionTicks":600000000',
    );
  });

  it('keeps and drops favourites on Jellyfin', async () => {
    const { signIn, call, jellyfin, book } = answersOver();

    await signIn();
    await call('PUT', `/api/media/${book.valenceIdOf(jellyfin.film.Id)}/favourite`);

    expect(jellyfin.asked.at(-1)).toMatchObject({
      method: 'POST',
      path: `/UserFavoriteItems/${jellyfin.film.Id}`,
    });
  });

  it('signs out of Jellyfin and forgets the token', async () => {
    const { signIn, call, links, jellyfin } = answersOver();

    await signIn();
    await call('POST', '/api/auth/sign-out');

    expect(links.of(jellyfin.address)?.token).toBeNull();
    expect(jellyfin.asked.some((one) => one.path === '/Sessions/Logout')).toBe(true);
  });

  it('refuses what only Valence does', async () => {
    const { signIn, call } = answersOver();

    await signIn();

    expect(await call('GET', '/api/requests')).toMatchObject({
      status: 404,
      value: { code: 'client.jellyfin.aJellyfinServerDoesNotDoThat' },
    });
  });
});
