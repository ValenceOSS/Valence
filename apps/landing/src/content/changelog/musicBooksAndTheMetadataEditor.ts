import type { ChangelogEntry } from './ChangelogEntry';

const musicBooksAndTheMetadataEditor: ChangelogEntry = {
  slug: 'music-books-and-the-metadata-editor',
  version: 'v1.9.0',
  date: '2026-11-07',
  title: 'Music and books redrawn, and a metadata editor',
  summary:
    'Valence 1.9 redraws music on the web, and takes books from end to end: a book page like a film’s, pages that turn like paper, and a native reader on the iPhone. Admins can edit a library’s metadata one title or many at once, the admin area is reworked page by page, and film, show, request and person dialogs are drawn like the phone’s. The Android app starts again and runs smoothly on slower phones.',
  sections: [
    {
      title: 'Music, redrawn',
      body: 'Music on the web has a full sidebar, a player bar along the foot and one tabbed side panel that folds to a strip. Its home page is a bento of mixes made for you and stations, each with artwork of its own. Albums and playlists open on a banner with a track table, artist pages open on a hero and load ahead while you hover and listen, and Your Library lists the albums you’ve played.',
    },
    {
      title: 'Books, from end to end',
      body: 'A book opens on a page drawn like a film’s, with its cover, facts, readers’ rating, the author, more by the author and books like this, read from Open Library. The books page is one grid of every book. In the browser, pages turn like paper, or a chapter reads as one long page in scroll mode. A PDF with text in it opens as text that reflows, split at its own chapters, and covers are matched on Open Library after a scan. On the iPhone, the reader typesets natively and turns with a page curl that follows your finger, with six themes and settings for size, brightness, line spacing and margins, and a book’s page sits its cover on a blurred copy of itself.',
    },
    {
      title: 'Edit a library’s metadata',
      body: 'Media, under Content, is now a metadata editor. Every title has a page of its own for its details, cast, artwork, seasons, episodes, files and history. Each field says whether it came from TMDB, the file name or an edit, and edits last through every scan and refresh, with Reset, Lock and Undo. Choose artwork from TMDB, fanart.tv or your own upload, set skip markers by hand, name a film’s versions, choose the episode order a show’s files are numbered in, and fix a season TMDB lists as a show of its own. Select many titles to edit the fields they share at once, find and replace, rename or merge genres and tags, match the unmatched automatically, rename files to the naming pattern, write NFO files, or export and import a spreadsheet.',
    },
    {
      title: 'Dialogs drawn like the phone’s',
      body: 'Film and show dialogs open on full bleed artwork with the logo, a play button that shows how far you’ve got, and round actions tinted with the artwork’s colour. Cast photos are round, and a dialog opened from another one goes back instead of closing. The request dialog plays the trailer behind the title’s logo, with its rating, age rating and facts, and a person opens with their portrait beside their credits.',
    },
    {
      title: 'The admin area, reworked',
      body: 'Every admin page has been gone through. Settings save as they change, with no Save buttons, and are grouped into cards. Titles, webhooks and linked servers each open on a page of their own, tables are lighter, and every state has a badge. Admins can turn off the overview alerts they don’t want on the new Alerts page, and the sidebar badges count what their pages list, with each media row saying what is wrong. The downloads queue shows speeds and time left, each drive reports its speed and how full it is, and server load can be read across the week.',
    },
    {
      title: 'Android, and subtitles on the phone and TV',
      body: 'The Android app starts again instead of stopping on a grey screen, and it no longer redraws what isn’t moving, so scrolling and opening cards are smooth on slower phones. Android phones short of memory show artwork in place of trailer previews. The phone and the TV can find and download subtitles from their subtitle menus, and the track is kept on the server for every app.',
    },
  ],
  lists: [
    {
      title: 'Improvements',
      items: [
        'A title held by more than one linked server shows once, with each server’s picture marked, and Play chooses the server.',
        'A poster wall of everything to watch, and the Requests page and long grids stay smooth however long they are.',
        'A show missing episodes after a search of its whole run is searched season by season before episode by episode, and a title still waiting for its search says so instead of Nothing found.',
        'Manga volumes are searched by series, and a book request no longer takes a film, programme or game that shares its name.',
        'Live TV sources can be renamed and pointed at a new address or playlist.',
        'Dev builds say when a newer dev build is out, and list what it has.',
        'The site’s wallpapers come in 16:10, ultrawide and tall phone shapes.',
      ],
    },
    {
      title: 'Fixes',
      items: [
        'Playback in the browser no longer gets stuck reconnecting on films whose chosen sound the browser can’t decode.',
        'Some HEVC films no longer freeze in Firefox and other browsers built on Gecko.',
        'With the seek bar focused, the arrow keys move ten seconds and the time follows the film.',
        'Clicking off an open player menu closes it without playing or pausing.',
        'Marking something watched, keeping a favourite or hiding a library no longer blanks the page behind it.',
        'Switching profile no longer hands the last profile’s audiobook, party or remote to the next.',
        'The media service and the requests service no longer hold on to gigabytes of memory they aren’t using.',
        'Extras in a Specials folder are no longer reported as the same episode twice.',
        'A video with no sound plays.',
        'New accounts show on the wall of faces before their first sign in.',
        'Titles read from file names drop Sonarr’s WEBDL, WEBRip and Remux tags, and logos are fetched as PNG instead of SVG.',
        'Webhooks name the linked server someone watches from.',
        'Intel graphics in the Docker image are named by their product, such as Intel UHD Graphics 770.',
        'Cards in dialogs no longer grow a preview hidden behind the dialog, and cards in a row animate straight into place.',
        'The count on the notification bell is a small round badge.',
        'On macOS, the desktop window’s arrows stand clear of the window buttons.',
      ],
    },
  ],
};

export { musicBooksAndTheMetadataEditor };
