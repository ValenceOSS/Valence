/* oxlint-disable valence/no-hard-coded-strings -- a Jellyfin server's answers, for tests */
import { aJellyfinEpisode } from '@ValenceClient/jellyfin/testing/aJellyfinEpisode';
import { aJellyfinFilm } from '@ValenceClient/jellyfin/testing/aJellyfinFilm';

const ADDRESS = 'http://jellyfin.test';

const USER = {
  Id: 'f84099b104f7cc449c39c6564a016cfc',
  Name: 'marnie',
  Policy: { IsAdministrator: false },
};

const VIEWS = [
  {
    Id: 'db4c1708cbb5dd1676284a40f2950aba',
    Name: 'Films',
    Type: 'CollectionFolder',
    CollectionType: 'movies',
    ChildCount: 1,
  },
  {
    Id: 'a656b907eb3a73532e40e44b968d0225',
    Name: 'Shows',
    Type: 'CollectionFolder',
    CollectionType: 'tvshows',
    ChildCount: 1,
  },
  {
    Id: '00000000000000000000000000000001',
    Name: 'Music',
    Type: 'CollectionFolder',
    CollectionType: 'music',
  },
];

const SERIES = {
  Id: '8fda75b958575a5b48cb9ffb2a2fbff6',
  Name: 'Twin Peaks',
  Type: 'Series',
  ChildCount: 2,
  RecursiveItemCount: 2,
  DateCreated: '2026-11-14T00:15:20Z',
  ImageTags: { Primary: '6ab1420089ea60ced44e3362006921c4' },
  BackdropImageTags: ['178f6be5c72ab9be5a579ed67d09d266'],
  UserData: { UnplayedItemCount: 2 },
};

/**
 * A JSON answer.
 *
 * @param value - What to answer with.
 * @param status - Its status.
 * @returns The answer.
 */
const json = (value: object | null, status = 200): Response =>
  new Response(value === null ? null : JSON.stringify(value), { status });

/**
 * A Jellyfin 10.10 server holding one film and one series of two episodes, for one user whose
 * password is `right`, answering the way a real one does and recording what it was asked.
 *
 * @returns How to ask it, its address, and what it was asked.
 */
const aFakeJellyfin = () => {
  const asked: {
    method: string;
    path: string;
    body: string | null;
    authorization: string | null;
  }[] = [];
  const film = aJellyfinFilm();
  const episodes = [
    aJellyfinEpisode(),
    aJellyfinEpisode({
      Id: '60dbe0dbb3a77acbb287ace1dc595db1',
      Name: 'Traces to Nowhere',
      ParentIndexNumber: 2,
      IndexNumber: 1,
    }),
  ];

  const answer = (input: string, init?: RequestInit): Response => {
    const url = new URL(input);
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? init.body : null;
    const headers = new Headers(init?.headers);
    const path = url.pathname;
    const types = url.searchParams.get('IncludeItemTypes') ?? '';

    asked.push({ method, path, body, authorization: headers.get('authorization') });

    if (path === '/System/Info/Public') {
      return json({
        Id: '14d5b3a0e1c640f5a457f06c1d708343',
        ServerName: 'Den',
        Version: '10.10.7',
        ProductName: 'Jellyfin Server',
      });
    }

    if (path === '/Users/AuthenticateByName') {
      return body?.includes('"Pw":"right"') === true
        ? json({ AccessToken: 'jellyfin-token', ServerId: 's', User: USER })
        : json(null, 401);
    }

    if (!(headers.get('authorization') ?? '').includes('Token="jellyfin-token"')) {
      return json(null, 401);
    }

    if (path === '/Users/Me') {
      return json(USER);
    }

    if (path === '/UserViews') {
      return json({ Items: VIEWS, TotalRecordCount: VIEWS.length });
    }

    if (path === '/Items' && types === 'Series') {
      return json({ Items: [SERIES], TotalRecordCount: 1 });
    }

    if (path === '/Items' && url.searchParams.get('Filters') === 'IsResumable') {
      return json({ Items: [film], TotalRecordCount: 1 });
    }

    if (path === '/Items' && url.searchParams.has('Filters')) {
      return json({ Items: [], TotalRecordCount: 0 });
    }

    if (path === '/Items') {
      const parent = url.searchParams.get('ParentId');
      const listed = parent === VIEWS[0]?.Id ? [film] : parent === VIEWS[1]?.Id ? episodes : [];

      return json({ Items: listed, TotalRecordCount: listed.length });
    }

    if (path === `/Users/${USER.Id}/Items/${SERIES.Id}`) {
      return json(SERIES);
    }

    if (path.startsWith(`/Users/${USER.Id}/Items/`)) {
      const found = [film, ...episodes].find((one) => path.endsWith(one.Id));

      return found === undefined ? json(null, 404) : json(found);
    }

    if (path.endsWith('/Ancestors')) {
      return json(path.includes(film.Id) ? [VIEWS[0]] : [SERIES, VIEWS[1]]);
    }

    if (path === `/Shows/${SERIES.Id}/Episodes`) {
      return json({ Items: episodes, TotalRecordCount: episodes.length });
    }

    if (path === '/Shows/NextUp') {
      return json({
        Items: url.searchParams.get('ParentId') === VIEWS[1]?.Id ? [episodes[1]] : [],
        TotalRecordCount: 1,
      });
    }

    if (path.endsWith('/PlaybackInfo')) {
      const takesMkv = body?.includes('"Container":"mkv"') === true;

      return json({
        PlaySessionId: 'play-1',
        MediaSources: [
          {
            Id: 'source-1',
            SupportsDirectPlay: takesMkv,
            ...(takesMkv ? {} : { TranscodingUrl: '/videos/x/master.m3u8?api_key=jellyfin-token' }),
          },
        ],
      });
    }

    return json(null, method === 'GET' ? 404 : 204);
  };

  const send = (input: string, init?: RequestInit): Promise<Response> =>
    Promise.resolve(answer(input, init));

  return {
    send,
    address: ADDRESS,
    asked,
    film,
    episodes,
    series: SERIES,
    views: VIEWS,
    user: USER,
  };
};

export { aFakeJellyfin };
