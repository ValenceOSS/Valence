import type { ChangelogEntry } from './ChangelogEntry';

const facesAndArtCards: ChangelogEntry = {
  slug: 'faces-and-art-cards',
  version: 'v1.2.0',
  date: '2026-09-28',
  title: 'A face of your own, cards made of pictures, and a dashboard that shows its working',
  summary:
    'Valence 1.2 lets everybody in the household choose how they look, draws home as rails of artwork, tells you a title’s age rating in the board’s own mark, and rebuilds the admin pages you run the server from.',
  picture: {
    src: '/changelog/faces-and-art-cards.png',
    alt: 'The face editor in Valence, with a shader orb chosen and shown at every size it is drawn',
  },
  sections: [
    {
      title: 'Your face, your way',
      body: 'Choose a moving orb, a photograph or a short clip, a drawing of your own, an avatar or a lettered initial in any colour. The editor shows the face at every size Valence draws it, and a drawing is kept as a drawing, so you can open it again and carry on.',
    },
    {
      title: 'Home, in pictures',
      body: 'Rails are made of artwork cards carrying each title’s logo, how far through it you are, and a flag on only the newest arrivals. A title’s page shows its age rating in the rating board’s own published mark, beside its picture and sound badges.',
    },
    {
      title: 'A pause that tells you where you were',
      body: 'Leave the player paused for a little while and it shows what you are watching, the season and episode, and what happens in it.',
    },
    {
      title: 'Music with its pictures',
      body: 'Albums and artists find their pictures, an artist has a story and a list of the albums you do not have yet, a wrong match can be corrected, and smart shuffle keeps a playlist from repeating itself.',
    },
    {
      title: 'Running the server',
      body: 'Jobs are grouped by what they look after, each with its schedule, a countdown to its next run, and a way to run or stop it from its own row. Media opens a library at a time, series fold open onto their seasons and episodes, and copies of the same film are kept together as editions you choose between when you press Play.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Browse pages sort by release date, title, rating or size, and can hide what you have watched.',
        'The navigation bar is a glass capsule with a pill that slides to where you are.',
        'Signing in lights the way from your picture, and your face flies to the bar.',
        'The offline screen is rails of what you downloaded, with the one player.',
        'A device is named after the Valence app it signed in from.',
        'Help and other web links open in your browser from the desktop app.',
        'The phone app fits the iPhone Duo, and turns book pages with a page curl.',
        'Requests can be approved or refused with a tick and a cross, and say who asked.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Subtitles inside a file are read once rather than every time it plays.',
        'Stopping a job stops its previews, scrub images and encodes at once, and it is shown as stopped rather than failed.',
        'Films are no longer searched for intros and outros.',
        'The phone app is called Valence on the home screen.',
        'An episode on the phone is named by its programme and dated by when it aired.',
      ],
    },
  ],
};

export { facesAndArtCards };
