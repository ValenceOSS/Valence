import type { ChangelogEntry } from './ChangelogEntry';

const linkedServersAndCalendars: ChangelogEntry = {
  slug: 'linked-servers-and-calendars',
  version: 'v1.3.0',
  date: '2026-10-03',
  title: 'Servers that share, a calendar of what is coming, and a home for any database',
  summary:
    'Valence 1.3 links your server to a friend’s, keeps a calendar of every episode and film on its way, runs on MySQL and MariaDB as well as Postgres, brings plugins, and gives the admin pages a calmer, clearer look.',
  picture: {
    src: '/changelog/linked-servers-and-calendars.png',
    alt: 'The admin overview in Valence, with the server’s processor, memory, graphics and storage above a week of its load',
  },
  sections: [
    {
      title: 'Link two servers',
      body: 'Connect your Valence to somebody else’s and choose which libraries each of you shares. Watch, read and ask for things from either, without a second account.',
    },
    {
      title: 'A calendar of releases',
      body: 'Every new episode of a show in your library, and every film or series you have asked for, appears on the day it comes out, by month, by week or as a list. Add it to any calendar app with a private link and it keeps itself up to date.',
    },
    {
      title: 'Bring your library with you',
      body: 'Setting up can import from Jellyfin, Emby or Plex: your libraries, who watched what and how far they got, favourites, ratings and playlists. Everybody you bring across gets a link to set their own password, sent by email if you like.',
    },
    {
      title: 'Your choice of database',
      body: 'Valence runs on MySQL and MariaDB as well as Postgres, and its jobs now run on a queue of its own, so there is nothing else to install.',
    },
    {
      title: 'Ready before you press Play',
      body: 'Pre-transcoding prepares media ahead of time and keeps it beside the original, so a phone on a slow connection starts straight away.',
    },
    {
      title: 'Plugins',
      body: 'Plugins run in a sandbox of their own and come from a signed catalogue. They can look up what an event was about and refresh a playlist.',
    },
    {
      title: 'A clearer dashboard',
      body: 'The admin pages sit in a calmer panel beside their sidebar, which remembers what you folded. Every table, menu and form looks and behaves the same, and jobs, logs and a single job’s trace share one layout, so the reason something went wrong is easy to find.',
      picture: {
        src: '/changelog/linked-servers-and-calendars-jobs.png',
        alt: 'The jobs and logs page in Valence, showing a day of log events by level as a bar chart',
      },
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Every client reads its words from one strings file, ready to be translated.',
        'Requests can be handed to Radarr, Sonarr and Lidarr, and Seerr’s can be brought in.',
        'Choose when a stalled download is given up on, and clear finished torrents out of the client.',
        'In a watch party, each member’s face shows where they are on one timeline.',
        'A new episode brings its show to the front of home, and the phone and television can sort.',
        'The transcoder can run outside its container, or natively on Windows, to reach the host’s graphics card.',
        'Songs and audiobooks show in sessions, and music plays from CarPlay.',
        'The desktop app can use a passkey through Windows Hello, or in your own browser.',
        'A new Valence icon and logo, everywhere.',
        'Downloads keep their scrubbing thumbnails, and play in the phone’s own player.',
        'Default corners are rounder, with an even rounder choice for those who want it.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'HDR looked too dark once it was turned into SDR.',
        'Watched episodes showed as unwatched once sixty others had been watched since.',
        'A smaller quality could come out bigger than the original.',
        'A release called 4K could be a much poorer copy, and nothing checked the file.',
        'Music from a request never had its lyrics or artwork looked up.',
        'Adding a passkey failed a day after signing in.',
        'A film resumed part way through would not load.',
        'Offline mode still asked the server for things.',
        'The desktop app could open with no window at all.',
      ],
    },
  ],
};

export { linkedServersAndCalendars };
