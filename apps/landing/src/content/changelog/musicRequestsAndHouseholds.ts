import type { ChangelogEntry } from './ChangelogEntry';

const musicRequestsAndHouseholds: ChangelogEntry = {
  slug: 'music-requests-and-households',
  version: 'v1.0.0',
  date: '2026-09-21',
  title: 'Music, requests, and a household that is safe for everyone in it',
  summary:
    'Valence 1.0 brings music libraries with a player that follows you, ebooks, a requests service that finds what you do not have yet, and the controls that make one server safe to share with a family.',
  picture: {
    src: '/changelog/music-requests-and-households.png',
    alt: 'An album in Valence, its tracks listed beneath its cover and the player along the foot of the page',
  },
  sections: [
    {
      title: 'Music',
      body: 'Point Valence at your music and it reads the tags, not the folders: artists, albums, discs and the guests on every track. The player follows you from page to page, keeps a queue, shows lyrics in time with the song, and playlists belong to whoever made them.',
    },
    {
      title: 'Ask for what is missing',
      body: 'An optional requests service searches your indexers, sends the right release to your download client and follows it all the way into the library. Anybody can ask; an administrator can approve. Quality profiles decide what the right release is, so nobody picks through a list of file names.',
      picture: {
        src: '/changelog/music-requests-and-households-requests.png',
        alt: 'The requests page in Valence, showing what has been asked for and how far along each one is',
      },
    },
    {
      title: 'A household, not an account',
      body: 'Each account can be limited to the libraries it may see and a ceiling on age certificates that a child cannot lift. Titles can be hidden for good. The first sign-in walks through setting the household up.',
    },
    {
      title: 'Books',
      body: 'Ebooks have a reader of their own, and are kept, rated, shared and found like films.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Admin and profile are full pages with sidebars.',
        'Jobs have a history, and run on the libraries you choose.',
        'Trailers on a title’s page.',
        'Re-encode media to reclaim space, or keep an extra rendition for downloads.',
        'Choose where an item’s hover preview is cut from.',
        'Icons moved to Keyline, with the active ones filled.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Title logos are picked by rating, not by width.',
        'Guests show in active sessions, and a closing tab no longer hides a live one.',
        'Files the browser can play itself are played directly, without waiting on a keyframe scan.',
        'An administrator can no longer lock the operator out of their own server.',
        'The still-watching countdown stops at nought.',
      ],
    },
  ],
};

export { musicRequestsAndHouseholds };
