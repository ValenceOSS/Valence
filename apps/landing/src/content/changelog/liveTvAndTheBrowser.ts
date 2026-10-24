import type { ChangelogEntry } from './ChangelogEntry';

const liveTvAndTheBrowser: ChangelogEntry = {
  slug: 'live-tv-and-the-browser',
  version: 'v1.5.0',
  date: '2026-10-11',
  title: 'Live TV, and more direct play support in the browser',
  summary:
    'Valence 1.5 adds live television with a guide, plays DTS, TrueHD, 7.1 and HDR films in the browser without the server converting them, and rebuilds requests around a catalogue of every title that works alongside Sonarr, Radarr and Lidarr.',
  picture: {
    src: '/changelog/live-tv-and-the-browser.webp',
    alt: 'The Live TV guide in Valence, with channels down the side and what is on now and next laid along a time bar',
  },
  sections: [
    {
      title: 'Live TV',
      body: 'Add channels from a single stream, an M3U playlist by address or upload, an iptv-org country or category, an HDHomeRun tuner, or a web page with its own player. Several XMLTV guides are read at once and matched to channels for you, shown as a time bar or a table, with favourites to keep the ones you watch close. Every channel is checked each hour, so the list says what is on air, and when a channel will not play Valence says why rather than showing a black screen. Streams pass through the server, so the browser never sees a provider’s address or password.',
    },
    {
      title: 'More direct play in the browser',
      body: 'A browser with WebGPU now plays files it could never play by itself, without asking the server to convert them. Files are repackaged on your device, pictures are drawn with WebGPU, and HDR films in HEVC, AV1 and VP9 are tone mapped from each film’s own brightness so they look right on an ordinary screen. DTS, Dolby Digital and Dolby TrueHD are decoded in the page, and surround sound stays surround, 7.1 included, carried losslessly to the speakers. DVDs in MPEG-2 play too, through Valence’s own decoders built for the browser. Turn it on under Play more films in this browser in your profile settings.',
    },
    {
      title: 'Copies made ahead, and Auto that keeps up',
      body: 'Pre-transcoding can now make a ladder of up to six copies of each film, at the qualities you choose. Auto moves between them in the middle of a film as your connection rises and falls, with no pause to restart and nothing encoded while you watch. It works in the browser’s own player as well, where Auto steps between the copies on your device.',
    },
    {
      title: 'Requests, rebuilt',
      body: 'Requests have a catalogue of every title the libraries hold and every title asked for, each with a page of its own showing where it stands, what is downloading and what is still missing. Release choices follow Sonarr’s rules, with custom formats and ranking. A title can also be handed to Sonarr, Radarr or Lidarr, and its downloads, searches and blocklist then work through that app from inside Valence. A film can be kept in two versions at different qualities, books are asked for as an ebook, an audiobook or both, and everybody who asks for something is remembered.',
    },
    {
      title: 'Subtitles drawn as they were made',
      body: 'Styled ASS and SSA subtitles are now drawn exactly as their authors intended, with the fonts that come in the file, their positions, fades and karaoke. Administrators can find subtitles from OpenSubtitles and SubDL from the player, matched to the exact release you have, and they are kept in Valence’s own data for every app to use.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Anime is a kind of library of its own.',
        'Mark a film as watched or unwatched on the web, the desktop app and the television.',
        'Sessions and watch history are grouped by viewer, and show the device each viewing was on.',
        'Choose which of a linked server’s libraries to take.',
        'Move a film or a show into another library on disk, keeping its watch history.',
        'The files page has a details pane, with sizes, and moves or deletes several items at once.',
        'Albums show their notes, songs, genre and label from Apple Music.',
        'Following an artist fetches albums, mixtapes and EPs, and albums are fetched complete.',
        'Follow every title the libraries hold at once, without it showing as requested.',
        'Audiobooks keep the narrator of their series, and an abridged one is refused.',
        'Request notices on Discord mention the person who asked.',
        'The desktop app checks for updates from its menu or a new tray icon, and its pop up notices stay off until you turn them on.',
        'The desktop app has builds for Windows on Arm and arm64 Linux, and the transcoder for Windows on Arm.',
        'Smart TV and Xbox browsers get the television layout, lighter and with focus that lands where you expect.',
        'The calendar has a timeline view.',
        'New icons throughout the app.',
        'Small headings are no longer squeezed, as letter spacing now follows the size of the text, in the app and on this site.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Sign in notices showed the proxy’s address and the wrong browser name.',
        'Reloading an admin page in the desktop app left a black window.',
        'Opening the desktop app showed every unread notification again.',
        'Catalogue trailers were a blank white frame in the desktop app.',
        'Accounts still waiting to be set up appeared on the sign in wall.',
        'Requests no longer fetch episodes you already have, and file new ones in the show’s own folder.',
        'Everybody can see every request and how its download is going, not only admins.',
        'Television browsers were stuck on a white desktop layout.',
        'Dark title logos were drawn white.',
        'Compose mounted Postgres 18’s data in the wrong place.',
        'The API reference stopped loading.',
      ],
    },
  ],
};

export { liveTvAndTheBrowser };
