import { LEVELLINGS } from '@ValenceClient/music/musicPreferences';
import type { MusicLevelling } from '@ValenceClient/music/musicPreferences';
import { say } from '@ValenceI18n/say';

const WORDS: Readonly<Record<MusicLevelling, { label: string; detail: string }>> = {
  off: {
    label: say('common.off'),
    detail: say('client.music.levellingChoices.songsPlayAsTheyWereMastered'),
  },
  track: {
    label: say('client.music.levellingChoices.eachSong'),
    detail: say('client.music.levellingChoices.everySongPlaysAtOneLoudness'),
  },
  album: {
    label: say('client.music.levellingChoices.wholeAlbums'),
    detail: say('client.music.levellingChoices.albumsKeepTheirQuietAndLoud'),
  },
};

/**
 * The ways music can be evened out to one loudness, named for a menu as every client offers them.
 *
 * @returns Each choice, its name and what it does.
 */
const levellingChoices = (): { id: MusicLevelling; label: string; detail: string }[] =>
  LEVELLINGS.map((id) => ({ id, ...WORDS[id] }));

export { levellingChoices };
