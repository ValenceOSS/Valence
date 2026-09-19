import { MusicNote01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { describeMusicMatch } from './describeMusicMatch';
import type { MusicMatchListProps } from './MusicMatchList.types';

/**
 * What MusicBrainz found for a name, each artist or album with its cover where it has one and what
 * tells it apart from the others of the name, to choose one from.
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
            variant="bare"
            size="none"
            className="flex w-full items-center gap-4 rounded-lg p-2 text-left hover:bg-[var(--surface-hover)]"
            onClick={() => {
              onChoose(match);
            }}
          >
            <span className="grid aspect-square w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-raised text-text-muted">
              {match.coverUrl === null ? (
                <Icon of={MusicNote01Icon} size={18} />
              ) : (
                <img
                  src={match.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </span>

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
