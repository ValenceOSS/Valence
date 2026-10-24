import type { FeatureGroup } from './FeatureGroup';

const FEATURE_GROUPS: readonly FeatureGroup[] = [
  {
    id: 'watching',
    title: 'Watching',
    features: [
      {
        title: 'Direct play, remux or transcode',
        description:
          'Each device is given what it can actually play, decided per device rather than per server. A file that plays as it is never gets converted.',
        isOnByDefault: true,
      },
      {
        title: 'Hardware transcoding',
        description:
          'Converts on Intel, AMD, NVIDIA, Apple and Windows on Arm graphics. Automatic uses whichever the machine has proved it can do, and falls back to the processor.',
        isOnByDefault: true,
      },
      {
        title: 'HDR tone mapping',
        description:
          'HDR10, HLG and Dolby Vision are tone mapped to SDR only when the screen needs it, on the graphics card where there is one.',
        isOnByDefault: true,
      },
      {
        title: 'Play more in the browser',
        description:
          'A browser with WebGPU plays DTS, TrueHD, 7.1, HDR and DVD films itself, repackaged and decoded on your device so the server converts nothing.',
        isOnByDefault: false,
        turnOn: 'Profile settings',
      },
      {
        title: 'HDR brightness',
        description:
          'Brighten or dim an HDR film on an ordinary screen, from 50% to 300%, remembered on each device.',
        isOnByDefault: true,
      },
      {
        title: 'Skip intro, recap and credits',
        description:
          'Intros are found by fingerprinting the audio across episodes and end credits by reading the picture, so the skip button appears without anybody typing timestamps. Recaps come from an import from Jellyfin or Emby.',
        isOnByDefault: true,
      },
      {
        title: 'The next episode',
        description:
          'The next episode starts as the credits roll, in the same player, and Valence asks whether you are still watching after a few in a row.',
        isOnByDefault: true,
      },
      {
        title: 'Quality and Auto',
        description:
          'Pick a quality for your connection, or let Auto move between the copies the server keeps as your connection rises and falls.',
        isOnByDefault: true,
      },
      {
        title: 'Pre-transcoding',
        description:
          'Make up to six copies of each film ahead of time, in quiet hours, so playback never waits for a conversion.',
        isOnByDefault: false,
        turnOn: 'Admin, Encoding',
      },
      {
        title: 'Subtitles as they were made',
        description:
          'Styled ASS and SSA subtitles keep their fonts, positions and karaoke, and Blu-ray picture subtitles are read into text for every app.',
        isOnByDefault: true,
      },
      {
        title: 'Find subtitles online',
        description:
          'Administrators can find subtitles on OpenSubtitles and SubDL from the player, matched to the exact release, and keep them in Valence’s own data, so every app can show them.',
        isOnByDefault: false,
        turnOn: 'Admin, Subtitles',
      },
      {
        title: 'Audio, speed and volume boost',
        description:
          'Switch soundtracks by language and format, change the speed, and lift quiet dialogue with a volume boost.',
        isOnByDefault: true,
      },
      {
        title: 'Stats for nerds',
        description:
          'See exactly what is playing: the source, what is sent, whether it plays directly, and the server’s reasons for every choice.',
        isOnByDefault: true,
      },
      {
        title: 'Hover previews and scrubbing thumbnails',
        description:
          'Cards play a short preview when you rest on them, and the timeline shows a picture of where you are about to jump.',
        isOnByDefault: true,
      },
      {
        title: 'Trailers',
        description:
          'Trailers on disk play from a title’s page, and trailers can be fetched from the catalogue for titles that have none.',
        isOnByDefault: false,
        turnOn: 'Admin, Settings',
      },
      {
        title: 'Several cuts and extras',
        description:
          'Keep a director’s cut beside the theatrical one, with behind the scenes, deleted scenes and featurettes filed under the film.',
        isOnByDefault: true,
      },
    ],
  },
  {
    id: 'music-books',
    title: 'Music, books and live TV',
    features: [
      {
        title: 'Music libraries',
        description:
          'Albums, artists, playlists, mixes and lyrics in a library of their own, with a player bar and a full screen view.',
        isOnByDefault: true,
      },
      {
        title: 'Music details from the web',
        description:
          'Fetches cover art, artist photos, music videos and lyrics for music your files describe only briefly.',
        isOnByDefault: false,
        turnOn: 'Admin, Settings',
      },
      {
        title: 'Play on another screen',
        description:
          'Send music to any other Valence your profile has open, a browser, a television or a phone, and use this one as its remote.',
        isOnByDefault: true,
      },
      {
        title: 'Books and comics',
        description:
          'A built in reader for EPUB, PDF, CBZ and CBR that remembers where you left off on every device.',
        isOnByDefault: true,
      },
      {
        title: 'Audiobooks',
        description:
          'Chapters, speeds and a sleep timer, with your place carried between the web, the phone and the television.',
        isOnByDefault: true,
      },
      {
        title: 'Live TV',
        description:
          'Channels from M3U playlists, iptv-org, HDHomeRun tuners and web players, with XMLTV guides matched for you and every channel checked each hour.',
        isOnByDefault: true,
      },
      {
        title: 'Release calendar',
        description:
          'What is coming to the shows and films you follow, as a calendar or a timeline, with a feed your own calendar app can subscribe to.',
        isOnByDefault: true,
      },
      {
        title: 'Discover',
        description:
          'Trending films and series, studios and genres, to browse beyond what the libraries already hold.',
        isOnByDefault: true,
      },
      {
        title: 'Collections, favourites and ratings',
        description:
          'Group titles into collections, keep favourites in a row of their own, rate what you watched, and build playlists.',
        isOnByDefault: true,
      },
    ],
  },
  {
    id: 'together',
    title: 'Together and away',
    features: [
      {
        title: 'Watch parties',
        description:
          'Keep everybody at the same moment in the same film, correcting drift as you go, with roles for who may control it and an optional password.',
        isOnByDefault: true,
      },
      {
        title: 'Share links',
        description:
          'Share one title or one series with somebody who has no account, for as long as you decide.',
        isOnByDefault: true,
      },
      {
        title: 'Downloads',
        description:
          'Choose a quality against a size and watch offline on the phone or the desktop app.',
        isOnByDefault: true,
      },
      {
        title: 'Linked servers',
        description:
          'Link your Valence to as many other Valence servers as you like, sharing chosen libraries, watch parties and requests between households.',
        isOnByDefault: false,
        turnOn: 'Admin, Linked servers',
      },
      {
        title: 'Notifications and push',
        description:
          'In app notifications and web push for new arrivals, finished requests and watch party invitations.',
        isOnByDefault: true,
      },
      {
        title: 'Webhooks and Discord',
        description:
          'Signed webhooks for jobs, scans, playback and accounts, with delivery history and redelivery, and Discord notices for requests.',
        isOnByDefault: false,
        turnOn: 'Admin, Webhooks',
      },
      {
        title: 'Email',
        description:
          'Sends password resets and setup links through your own SMTP server or Resend.',
        isOnByDefault: false,
        turnOn: 'Admin, Email',
      },
    ],
  },
  {
    id: 'apps',
    title: 'Apps for every screen',
    features: [
      {
        title: 'The web app',
        description:
          'Works on any modern browser, fits a phone, and switches to a television layout on smart TV and Xbox browsers.',
        isOnByDefault: true,
      },
      {
        title: 'Desktop app',
        description:
          'For macOS, Windows, Windows on Arm and Linux, with offline downloads, a tray icon and updates from its menu.',
        isOnByDefault: true,
      },
      {
        title: 'iPhone and iPad',
        description:
          'On the App Store, with a player built for touch, offline downloads, music, audiobooks and AirPlay.',
        isOnByDefault: true,
      },
      {
        title: 'Apple TV',
        description: 'The same App Store download, built for the remote, with Top Shelf.',
        isOnByDefault: true,
      },
      {
        title: 'Android, Android TV and Fire TV',
        description:
          'A phone app and a television app for Android, Android TV and Fire TV, built from the repository.',
        isOnByDefault: true,
      },
      {
        title: 'Sign in a television with a code',
        description:
          'A television shows a short code, and you approve it from a phone or a browser, or scan it with the phone’s camera, with no password typed on a remote.',
        isOnByDefault: true,
      },
      {
        title: 'Open in the app',
        description:
          'Safari on an iPhone offers the Valence app above the web app, opening it straight to your server once it is installed.',
        isOnByDefault: true,
      },
    ],
  },
  {
    id: 'household',
    title: 'The household',
    features: [
      {
        title: 'Profiles',
        description:
          'Everybody picks their face from the sign in screen, with their own history, favourites and settings.',
        isOnByDefault: true,
      },
      {
        title: 'Roles and permissions',
        description:
          'Default roles for administrators, managers, members and restricted viewers, or your own built from a catalogue of permissions.',
        isOnByDefault: true,
      },
      {
        title: 'Age limits and library access',
        description:
          'Limit each account to chosen libraries and an age rating, read from your country’s certificates.',
        isOnByDefault: true,
      },
      {
        title: 'Hiding titles',
        description:
          'Anybody can hide a title from their own profile, and administrators can hide it from everybody.',
        isOnByDefault: true,
      },
      {
        title: 'Setup links',
        description:
          'Invite somebody with a link that lets them choose their own password, with no password sent by email.',
        isOnByDefault: true,
      },
      {
        title: 'Two step sign in and passkeys',
        description:
          'Every account can add an authenticator app with backup codes, or sign in with a passkey instead of a password.',
        isOnByDefault: true,
      },
      {
        title: 'Sessions and API keys',
        description:
          'See and end the sessions on each device, and make API keys that can be turned off or revoked at any time.',
        isOnByDefault: true,
      },
    ],
  },
  {
    id: 'requests',
    title: 'Requests',
    features: [
      {
        title: 'Requests',
        description:
          'Ask for films, series, anime, music and books. Valence searches your indexers, hands releases to your download client and files the result into the library.',
        isOnByDefault: false,
        turnOn: 'The requests service',
      },
      {
        title: 'Sonarr, Radarr and Lidarr',
        description:
          'Hand a title to Sonarr, Radarr or Lidarr and follow its downloads, searches and blocklist from inside Valence.',
        isOnByDefault: false,
        turnOn: 'Admin, Requests',
      },
      {
        title: 'Overseerr and Jellyseerr',
        description:
          'Keep using Overseerr or Jellyseerr for requests, with what they bring in landing in Valence.',
        isOnByDefault: false,
        turnOn: 'Admin, Requests',
      },
      {
        title: 'Import from Plex, Jellyfin and Emby',
        description:
          'Bring watch history, play dates and ratings across from another media server, as many times as you like.',
        isOnByDefault: false,
        turnOn: 'Admin, Import',
      },
    ],
  },
  {
    id: 'running',
    title: 'Running the server',
    features: [
      {
        title: 'Setup wizard',
        description:
          'The first visit creates the administrator, confirms how the server is reached and adds your first libraries.',
        isOnByDefault: true,
      },
      {
        title: 'Admin overview',
        description:
          'Live server load, graphics, disk usage and the hardware underneath, down to every core and every drive, beside what is playing and running now.',
        isOnByDefault: true,
      },
      {
        title: 'Jobs, schedules and logs',
        description:
          'Every background job with its schedule, a searchable log, and the console output of every service in one place.',
        isOnByDefault: true,
      },
      {
        title: 'Automatic scans',
        description:
          'Libraries are scanned on a schedule and when files change, and files or folders can be left out and brought back.',
        isOnByDefault: true,
      },
      {
        title: 'Metadata and artwork',
        description:
          'Titles, years, artwork and cast from the catalogue, with a match picker to correct anything it got wrong.',
        isOnByDefault: false,
        turnOn: 'A free catalogue key',
      },
      {
        title: 'Rotten Tomatoes scores',
        description: 'Critic scores beside each title’s rating, from OMDb.',
        isOnByDefault: false,
        turnOn: 'An OMDb key',
      },
      {
        title: 'Re-encoding',
        description:
          'Replace a file with a smaller copy to reclaim space, or keep extra versions beside it, reviewed before anything changes.',
        isOnByDefault: true,
      },
      {
        title: 'Files and uploads',
        description:
          'Browse, move, rename and delete media from the admin area, and upload new files straight into a library.',
        isOnByDefault: true,
      },
      {
        title: 'Postgres, MySQL or MariaDB',
        description:
          'Run on Postgres, or point Valence at a MySQL or MariaDB server you already have.',
        isOnByDefault: true,
      },
      {
        title: 'Appearance',
        description:
          'Choose how rounded every corner is, a picture behind the sign in screen, and light, dark or system themes.',
        isOnByDefault: true,
      },
      {
        title: 'Security by default',
        description:
          'Rate limited sign in, secure cookies, media mounted read only, signed webhooks and isolated plugins.',
        isOnByDefault: true,
      },
    ],
  },
  {
    id: 'building',
    title: 'Building on it',
    features: [
      {
        title: 'A documented API',
        description:
          'Every endpoint has a contract, with an OpenAPI 3.1 document and an interactive reference served by the server itself.',
        isOnByDefault: true,
      },
      {
        title: 'Plugins',
        description:
          'Add pages, panels, themes and scheduled work from a signed catalogue, each running in a sandbox with only the permissions you accept.',
        isOnByDefault: false,
        turnOn: 'Admin, Plugins',
      },
    ],
  },
];

export { FEATURE_GROUPS };
