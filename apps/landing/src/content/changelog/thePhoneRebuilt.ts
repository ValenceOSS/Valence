import type { ChangelogEntry } from './ChangelogEntry';

const thePhoneRebuilt: ChangelogEntry = {
  slug: 'the-phone-rebuilt',
  version: 'v1.8.0',
  date: '2026-11-01',
  title: 'The phone rebuilt, a remote for the television, and gapless music',
  summary:
    'Valence 1.8 rebuilds the phone app with native cards, a new music player and Chromecast, turns the phone into a remote for the television, brings live TV to the TV app, and gives music gapless playback, crossfade and smart playlists. Films that need the server’s help start playing sooner.',
  sections: [
    {
      title: 'The phone, rebuilt',
      body: 'Titles, programmes, people and your account open as native cards that bounce at the top and close with a drag or a swipe back. Music pages and the player are redrawn to match. Cast to Chromecast from the phone, get push notifications on iPhone, and download music and audiobooks to listen to offline on the phone and the desktop app. Discover titles open as a library title does, with their trailer. The book reader has a page strip along the bottom, tap to turn, and a colour around the page.',
    },
    {
      title: 'The phone as a remote',
      body: 'When a television on your profile starts playing, the phone follows it. A bar above the tabs opens into a full remote: scrub, skip ten seconds, move between episodes or chapters, and skip the intro or credits. Choose the television’s speed, sound, subtitles and quality from the phone, or tap Play here to bring the film back to it. The TV app now has your account, the calendar and requests too.',
    },
    {
      title: 'Live TV on the television',
      body: 'The TV app has live TV, with a guide grid and a player that changes channel.',
    },
    {
      title: 'Music that flows',
      body: 'Volume levelling, crossfade and gapless playback on every client, and episodes play gaplessly too. Smart playlists fill themselves from rules: likes, artists you follow, genre, years, plays and more. Smart collections do the same for films and shows. The mini player shows playing bars.',
    },
    {
      title: 'More to watch',
      body: 'Every film and show has More like this, and the home page has Because you watched rows. A title can be removed from Continue watching without marking it watched.',
    },
    {
      title: 'Faster, and steadier',
      body: 'Films that need the server’s help start playing sooner. Long jobs no longer stop the server answering, credit detection on a long season among them, and scans, guides and clean ups no longer stall. A server with more than one graphics card spreads its streams across them, with a limit on each, and Dolby Vision profile 5 and HLG are tone mapped on Intel graphics instead of the processor.',
    },
    {
      title: 'Plugins',
      body: 'Plugins can add download clients, play films straight from a source, add home page rows that people choose, and sit panels on books. They can hear pauses, sessions and requests, queue jobs that Valence retries, browse the library, and answer apps outside Valence that sign in with app passwords.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Requests show their activity as live steps while they are fetched.',
        'Films are searched by title and year, and a request can be searched by hand from its Interactive search.',
        'Each device is named by what it is and how it reaches Valence, and a device can be signed out from the sessions page.',
        'Webhook messages are tidied into a title, a sentence and labelled details, with five more formats for chat and notification services.',
        'Anonymous daily statistics, sent only once an owner turns them on, with a public stats site at metrics.getvalence.app.',
        'The paused screen shows the title’s logo.',
        'The interface is set in Outfit, with a quieter focus ring, and the way in and the home screen work from a keyboard.',
        'Splash screens use the server’s own name and logo.',
        'Server and requests images are published for arm64 as well as amd64.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Requests no longer download season packs again for episodes their files don’t hold.',
        'HDR films play on iPhones that can’t show HDR and fill the screen, and large films load on iPhones.',
        'Discord’s status keeps up when the next episode plays, with its poster.',
        'The admin sidebar stays still when a notice appears or goes away.',
        'Music plays from a library mounted outside /media.',
        'Searches no longer remember failed lookups, and say why a site couldn’t answer.',
        'Choosing an anime library on the shows page showed every library’s shows.',
        'The AirPlay button in the phone player is a single circle.',
      ],
    },
  ],
};

export { thePhoneRebuilt };
