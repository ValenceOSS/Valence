import type { ChangelogEntry } from './ChangelogEntry';

const subtitlesAndTheSite: ChangelogEntry = {
  slug: 'subtitles-and-the-site',
  version: 'v0.3.0',
  date: '2026-09-16',
  title: 'Styled subtitles, a phone-sized web app, and getvalence.app',
  summary:
    'ASS and SSA subtitles are drawn where the script put them, every screen fits a phone, and Valence has a home on the web.',
  picture: {
    src: '/changelog/subtitles-and-the-site.png',
    alt: 'The Valence home page, its rows of titles turning a whole card at a time',
  },
  sections: [
    {
      title: 'Subtitles that look the way they were made',
      body: 'Styled subtitles keep their fonts, colours and positions, so a sign in an anime is translated where the sign is. Picture-based subtitles work, and text subtitles are read in the encoding they were written in rather than turning into question marks.',
    },
    {
      title: 'Fits a phone',
      body: 'Every screen of the web app now fits a phone. Rows turn by whole cards, so nothing is ever cut down the middle, and the home page keeps going for as long as there is something to show. Search rises as a drawer over the page rather than taking you somewhere else.',
    },
  ],
  lists: [
    {
      title: 'Fixes',
      items: [
        'Intel graphics are read from the kernel, so hardware encoding finds them.',
        'The server says which tone mapper it picked for this machine.',
        'One process at a time works on a library.',
        'Subtitles stay off until somebody asks for them.',
      ],
    },
  ],
};

export { subtitlesAndTheSite };
