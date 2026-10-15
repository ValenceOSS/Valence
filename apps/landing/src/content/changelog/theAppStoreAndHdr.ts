import type { ChangelogEntry } from './ChangelogEntry';

const theAppStoreAndHdr: ChangelogEntry = {
  slug: 'the-app-store-and-hdr',
  version: 'v1.6.0',
  date: '2026-10-13',
  title: 'Valence on the App Store, and HDR in the browser that matches the server',
  summary:
    'Valence 1.6 puts the app for iPhone, iPad and Apple TV on the App Store, rebuilds the phone player around stats for nerds and a layout like the big streaming apps, brings Live TV, Discover, requests and the calendar to the phone, and makes HDR played in the browser look the same as HDR the server converts.',
  picture: {
    src: '/changelog/the-app-store-and-hdr.webp',
    alt: 'Stats for nerds in the Valence phone player, with cards for the session, the source, the output and the plan for what plays directly',
  },
  sections: [
    {
      title: 'On the App Store',
      body: 'Valence for iPhone, iPad and Apple TV is one download on the App Store. Safari on an iPhone now offers it through Apple’s own banner above every page of the web app: Open where the app is installed, which takes it straight to your server, and to the television waiting for its code on the page that signs one in, and Get where it is not. Anybody publishing their own build of the app can point the banner at their own listing with IOS_APP_STORE_ID, or leave it empty to offer none.',
    },
    {
      title: 'A new phone player',
      body: 'The phone player is laid out like the big streaming apps. Brightness runs down the left edge, back and forward ten seconds sit either side of play, and Speed, Episodes, Audio and Subtitles, Quality and Next Episode are labelled along the foot, clear of the home indicator. Stats for nerds shows the session, the source, what is being sent and why, read again every second. Panels rise and sink as frosted sheets, the controls can be locked, and AirPlay and picture in picture are a tap away. The next episode plays in the same player, and the subtitle and soundtrack languages you chose carry on to it.',
    },
    {
      title: 'Live TV, Discover, requests and the calendar on the phone',
      body: 'Everything the web gained lately is now on the phone too. Live TV has its own tab, with what is on now and next, favourites, filters and a full screen player. Discover opens on trending films and series and lists each studio’s popular films. Artists, albums and books can be requested as well as films and series, the calendar has its timeline, and titles can be added to collections from their More menu.',
    },
    {
      title: 'HDR in the browser that matches the server',
      body: 'The browser’s own player tone mapped HDR differently from the server, so a film looked darker played in the browser than converted by the server. The two now match. For anybody who finds the result too dark on an ordinary screen, a new HDR brightness setting in the player goes from 50% to 300%, and is remembered on each device. HDR H.265 films on NVIDIA graphics now get Valence’s tone mapping as well, and where Valence cannot do it, Stats for nerds says why.',
    },
    {
      title: 'Blu-ray subtitles read as text',
      body: 'Blu-ray picture subtitles are read into text in the background, the first time a track is listed. Once read, the track is offered as an ordinary text track on every app, so choosing it no longer restarts the stream or burns the subtitles into the picture. The original picture track is still there if you want it.',
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
        'The Docker image reads Blu-ray subtitles in 23 languages.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Behind a reverse proxy with its own content security policy, the browser player claimed DTS and Dolby audio it could not then decode, and fell back to a stereo copy. It now checks first, and the docs say what the proxy needs.',
        'The desktop app could not decode Dolby or DTS audio in its browser player.',
        'HDR H.265 films on NVIDIA graphics were always left to the browser’s darker tone mapping.',
        'The web app drew a blank page after the App Store banner was added.',
      ],
    },
  ],
};

export { theAppStoreAndHdr };
