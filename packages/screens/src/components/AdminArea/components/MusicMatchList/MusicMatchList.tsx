import { Button } from '@ValenceUI/Button';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { describeMusicMatch } from './describeMusicMatch';
import type { MusicMatchListProps } from './MusicMatchList.types';

/**
 * What MusicBrainz found for a name, each artist or album with its cover where it has one — a note
 * where it has none, or while a slow one loads — and what tells it apart from the others of the
 * name, to choose one from.
 *
 * @param matches - What was found.
 * @param onChoose - Told which was chosen.
 */
const MusicMatchList = ({ matches, onChoose }: MusicMatchListProps) => (
  <ul
    aria-label="Found in MusicBrainz"
    className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto"
  >
    {matches.map((match) => {
      const detail = describeMusicMatch(match);

      return (
        <li key={match.musicBrainzId}>
          <Button
            variant="row"
            size="none"
            className="items-center gap-4 p-2"
            onClick={() => {
              onChoose(match);
            }}
          >
            <MusicArtwork
              src={match.coverUrl}
              label={`The cover of ${match.title}`}
              shape={match.kind === 'artist' ? 'round' : 'square'}
              className="w-14 rounded-lg"
            />

            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium text-text">{match.title}</span>
              {detail === null ? null : (
                <span className="line-clamp-2 font-body text-xs text-text-muted">{detail}</span>
              )}
            </span>
          </Button>
        </li>
      );
    })}
  </ul>
);

MusicMatchList.displayName = 'MusicMatchList';

export { MusicMatchList };
