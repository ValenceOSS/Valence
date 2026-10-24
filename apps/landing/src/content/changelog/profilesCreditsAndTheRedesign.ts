import type { ChangelogEntry } from './ChangelogEntry';

const profilesCreditsAndTheRedesign: ChangelogEntry = {
  slug: 'profiles-credits-and-the-redesign',
  version: 'v1.7.0',
  date: '2026-10-24',
  title: 'A new look, profiles for everyone in the house, and credits found in everything',
  summary:
    'Valence 1.7 redesigns the interface and the admin area, gives one account several profiles with children’s accounts a parent looks after, finds the end credits in every film and episode, makes HDR in the browser match the server, and adds Whisper subtitles, MPEG-DASH, libraries in S3 buckets and white-labelling.',
  picture: {
    src: '/changelog/profiles-credits-and-the-redesign.webp',
    alt: 'The redesigned admin overview: live processor, memory, graphics and storage, what is waiting on the administrator, the server’s load over the last week, disk use by library, and the libraries',
  },
  sections: [
    {
      title: 'A new look',
      body: 'The interface is redesigned throughout, set in an open font Valence can give away with the app. The admin area has new pages for statistics, the audit log, backups and updates, a get-started checklist, hardware details with live cores, and notices as cards. Admin tabs open on what they showed last time and then check for changes, and title cards, cast members, the places in the bar and admin panels are real links, so they open in a new tab.',
    },
    {
      title: 'Profiles for everyone in the house',
      body: 'One account can hold several profiles, and only its owner profile changes the account itself. Children’s accounts are looked after by a parent and signed in with a tap or a PIN. Several accounts can stay signed in on one browser and be switched between, and the sign-in screen shows each account’s owner by their picture and name. A library can be locked behind a password or PIN until it is unlocked on a device, and titles show their content advisories on their page and as they start playing.',
    },
    {
      title: 'Credits, chapters and the timeline',
      body: 'Valence now finds the end credits in every film and episode, not only in libraries imported from elsewhere. Stopping in the credits counts as watched, the player’s timeline names the intro, recap or credits under the pointer, named chapters show on every client, and one episode fades into the next, picture and sound together.',
    },
    {
      title: 'HDR in the browser that matches the server',
      body: 'The browser’s own player tone mapped HDR differently from the server, so a film looked darker played in the browser than converted by the server. The two now match. For anybody who finds the result too dark on an ordinary screen, an HDR brightness setting in the player goes from 50% to 300% and is remembered on each device. HDR H.265 films on NVIDIA graphics now get Valence’s tone mapping as well, and where Valence can’t do it, Stats for nerds says why.',
    },
    {
      title: 'Subtitles, read and written',
      body: 'Blu-ray picture subtitles are read into text in the background the first time a track is listed, so choosing one no longer restarts the stream or burns it into the picture; the original picture track is still there. Films and episodes with no subtitles at all can have them written by Whisper.',
    },
    {
      title: 'Streaming and libraries',
      body: 'Conversions stream as MPEG-DASH as well as HLS, from the same segments, and the browser fetches several segments at once. Administrators can set bitrate ceilings and simultaneous stream limits per account and per role. Libraries can live in S3-compatible buckets, mounted as folders with rclone, a film kept as several files plays as one, and films and programmes can be filtered by audio language, format and channel layout.',
    },
    {
      title: 'Your server, under your name',
      body: 'White-labelling gives the server your own name, logo, accent and description. Administrators can post announcements over every page and the phone, put a message on the sign-in page, and play a short pre-roll clip before a film or episode.',
    },
    {
      title: 'Requests and plugins',
      body: 'Anime is asked for and found by its cours, however its releases number them, a whole book series can be requested, and audiobooks in parts are checked whole. Every indexer is paced, indexers can be chosen per library, title or search, magnet links can be pasted, and 1080p is asked for when no quality is chosen. Plugins get API 1.3, with sealed secrets kept for each person, and a server installs the newest version of a plugin it can run, from publishers its administrator trusts.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Watch parties have an optional chat, on the web and the phone.',
        'Search finds people by name, and what of theirs is here, and the best answers come first across every library.',
        'Clicking or tapping the picture plays or pauses, and a double click goes full screen.',
        'The player’s episode menu lists every season, one line per episode that opens out.',
        'Playback errors fill the player with a plain message and a code, and reach the admin.',
        'Safari on an iPhone offers the App Store app through Apple’s own banner, and anybody publishing their own build can point it at their own listing with IOS_APP_STORE_ID.',
        'The desktop app shows an installing window while it restarts for an update.',
        'The chosen hardware acceleration can be tested on a short real transcode.',
        'Notifications no longer ping for every old episode, or twice for a request.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Only an administrator can add an account, and the server refuses to start in production with the placeholder secret.',
        'API keys can no longer manage keys or sessions, and request bodies are capped.',
        'The scanner reads 1x01 numbering, Blu-ray folders and dated episodes, and keeps a missing file for 30 days before letting it go.',
        'A MySQL or MariaDB server could not finish updating its database since 1.6.0.',
        'Behind a reverse proxy with its own content security policy, the browser player claimed DTS and Dolby audio it couldn’t decode. It now checks first, and the desktop app decodes both.',
        'A film with a piece of its file missing no longer freezes the app.',
        'Unhandled failures no longer stop the server, and realtime messages are no longer dropped.',
        'Downloads that were healthy or kept are no longer deleted, and upgrades and removals keep what they should.',
      ],
    },
  ],
};

export { profilesCreditsAndTheRedesign };
