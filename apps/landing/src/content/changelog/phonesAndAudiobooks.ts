import type { ChangelogEntry } from './ChangelogEntry';

const phonesAndAudiobooks: ChangelogEntry = {
  slug: 'phones-and-audiobooks',
  version: 'v1.1.0',
  date: '2026-09-25',
  title: 'Valence on your phone, and audiobooks',
  summary:
    'An iPhone and Android app that finds your server on its own, downloads to watch on the train, and a desktop app for every platform. Audiobooks join films, programmes, music and ebooks.',
  picture: {
    src: '/changelog/phones-and-audiobooks.png',
    alt: 'The Valence phone app open on its home page, with the featured row and the shelves beneath it',
  },
  sections: [
    {
      title: 'A phone app that feels like the rest of Valence',
      body: 'The phone app is the web app rethought for a hand rather than a pointer. The same home, the same hero, the same shelves, drawn with the system’s own controls, floating tabs in liquid glass on iOS 26, and a player built for a thumb. Open it on the same network as your server and it finds it; nobody types an address.',
    },
    {
      title: 'Take it with you',
      body: 'Download a film or an episode to the phone, choosing its quality against its size first, and watch it with no server at all. The server prepares the file, the phone fetches it, and a download that drops picks up where it stopped.',
    },
    {
      title: 'Audiobooks',
      body: 'Audiobooks are filed, scanned and played like everything else, with their chapters, their narrator and where you left off. A book that exists as both an ebook and an audiobook sits on the shelf once, with both inside it.',
      picture: {
        src: '/changelog/phones-and-audiobooks-books.png',
        alt: 'A book in Valence with its chapters listed beside the cover',
      },
    },
    {
      title: 'A desktop app for every platform',
      body: 'Windows, macOS and Linux builds are attached to every release, and the app checks for the next one itself. It shows what you are listening to where your friends can see it, and finds servers on the network as the phone does.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Mark a whole season watched, or unwatched again.',
        'A programme’s card says how many episodes you have left.',
        'Request films and programmes from the phone.',
        'Large uploads are sent in pieces and resume after a crash.',
        'Every problem the API reports has a stable code and a page in the docs explaining it.',
      ],
    },
  ],
};

export { phonesAndAudiobooks };
