import type { ChangelogEntry } from './ChangelogEntry';

const televisionEverywhere: ChangelogEntry = {
  slug: 'television-everywhere',
  version: 'v1.4.0',
  date: '2026-10-07',
  title:
    'Every television, a proper music player on the phone, and the next episode as the credits roll',
  summary:
    'Valence 1.4 comes to Android TV and Fire TV, gives the phone a full music player that keeps time with your other devices, offers the next episode before the credits finish, and lets a public demo hand out a shared account safely. It also closes a round of security holes found in a sweep of the whole app.',
  picture: {
    src: '/changelog/television-everywhere.webp',
    alt: 'Valence on a television, with Big Buck Bunny featured across the home page and rows of films beneath it',
  },
  sections: [
    {
      title: 'Android TV and Fire TV',
      body: 'The television app now runs on Android TV and Fire TV as well as Apple TV, built from the same source. It reads what your television, its decoders and the receiver behind it can actually play, HDR and Dolby Vision included, and only converts what they cannot. New arrivals appear in a Valence row on the Android TV home screen, and whatever you are part way through sits in Play Next.',
    },
    {
      title: 'Music on the phone',
      body: 'The phone has a full music player now, with the queue, lyrics, AirPlay and controls on the lock screen. Play something on the phone and carry on from the desktop, or pick up on the phone what the computer was playing. Mixes are made from what you listen to, and they are yours alone.',
      picture: {
        src: '/changelog/television-everywhere-music.jpg',
        alt: 'An album in Valence with its tracks listed beside the cover, and the player along the foot of the page',
      },
    },
    {
      title: 'The next episode, as the credits roll',
      body: 'As an episode ends, the next one is offered in a card with Play Next and Watch Credits. A bar fills along it until the next episode starts on its own, and it waits for the credits where they are marked. On the phone it is two buttons in the place of Skip Intro.',
    },
    {
      title: 'Playlists that remember what you do not have',
      body: 'A song a plugin adds to a playlist keeps its place even when it is not in your library yet, drawn faded beside the rest. One button lists the albums those songs are on and requests them all at once.',
    },
    {
      title: 'Safer by default',
      body: 'A sweep of the whole app closed several holes. An item could be reached past its library’s block or age limit by writing its identifier differently, sign in attempts could be spread across made up addresses, and a server started without its own secret used the one written in the source. The transcoder now refuses to listen on a network address without a secret, and the phone and television no longer back sign ins up to the cloud.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'A demo mode for public servers: shared accounts sign in without a password and cannot change anything that would spoil it for the next visitor.',
        'Choose which apps may connect to your server, from Admin Settings.',
        'Captions come in five weights and eight fonts.',
        'The desktop app draws its own minimise, maximise and close on Windows and Linux.',
        'Choose exactly how your Discord status looks, with a preview of each state.',
        'A dev channel for the desktop app that updates itself to every build of main.',
        'Direct play reads straight from disk, many times faster on a NAS.',
        'Grid posters are a third of the size they were.',
        'The landing site and documentation have a new look, and the desktop app can be downloaded from the home page.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'A folder scan during a request could freeze the server for minutes at a time.',
        'The last episode of a season now offers the first of the next one.',
        'The phone app closed at launch on some installs.',
        'CarPlay crashed on opening when the server had no music library.',
        'The player’s controls did not show over a wide film in full screen on Windows.',
        'A request naming no quality could be given one meant for somebody else.',
        'A face on an account without an email address could never sign in.',
        'Music settings and blocked libraries were read wrongly on MySQL and MariaDB.',
        'The home page stopped redrawing every card while its trailer played.',
        'Compose pulled Valence from an old registry that had stopped at a September build.',
      ],
    },
  ],
};

export { televisionEverywhere };
