import type { ChangelogEntry } from './ChangelogEntry';

const theAppStoreAndHdr: ChangelogEntry = {
  slug: 'the-app-store-and-hdr',
  version: 'v1.6.0',
  date: '2026-10-14',
  title: 'Valence on the App Store',
  summary:
    'Valence 1.6 is the app for iPhone, iPad and Apple TV, now on the App Store. It rebuilds the phone player around stats for nerds and a layout like the big streaming apps, and brings Live TV, Discover, requests and the calendar to the phone.',
  picture: {
    src: '/changelog/the-app-store-and-hdr.webp',
    alt: 'Stats for nerds in the Valence phone player, with cards for the session, the source, the output and the plan for what plays directly',
  },
  sections: [
    {
      title: 'On the App Store',
      body: 'Valence for iPhone, iPad and Apple TV is one download on the App Store, and works with the server you already run.',
    },
    {
      title: 'A new phone player',
      body: 'The phone player is laid out like the big streaming apps. Brightness runs down the left edge, back and forward ten seconds sit either side of play, and Speed, Episodes, Audio and Subtitles, Quality and Next Episode are labelled along the foot, clear of the home indicator. Stats for nerds shows the session, the source, what is being sent and why, read again every second. Panels rise and sink as frosted sheets, the controls can be locked, and AirPlay and picture in picture are a tap away. The next episode plays in the same player, and the subtitle and soundtrack languages you chose carry on to it.',
    },
    {
      title: 'Live TV, Discover, requests and the calendar on the phone',
      body: 'Everything the web gained lately is now on the phone too. Live TV has its own tab, with what is on now and next, favourites, filters and a full screen player. Discover opens on trending films and series and lists each studio’s popular films. Artists, albums and books can be requested as well as films and series, the calendar has its timeline, and titles can be added to collections from their More menu.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'The phone has a copy of the web’s splash screen, with the mark rising and the name opening out letter by letter.',
        'Cards and notifications on the phone open as frosted sheets, and badges and ratings look as they do on the web.',
        'Valence’s loading ring replaces the system spinner throughout the phone app.',
        'Auto quality on the phone moves between every copy the server keeps, as it does on the web.',
        'API keys can be made, turned off and revoked from the phone.',
      ],
    },
  ],
};

export { theAppStoreAndHdr };
