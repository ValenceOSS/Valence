import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { RESUMING } from '@ValenceClient/library/groupIntoRails';
import { memo, useCallback } from 'react';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { ACardOrigins } from '@ValenceMobile/components/ACardOrigins/ACardOrigins';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { POSTER_WIDTH } from '@ValenceMobile/components/APoster/POSTER_WIDTH';
import { STILL_WIDTH } from '@ValenceMobile/components/APoster/STILL_WIDTH';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { isDrawnAlike } from '@ValenceMobile/components/TheLibrary/components/TheHome/components/AHomeShelf/isDrawnAlike';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ComingUp } from '@ValenceContracts/schemas/Show';
import type { AHomeShelfProps } from './AHomeShelf.types';
import { say } from '@ValenceI18n/say';

/**
 * What tells one title on a shelf from another.
 *
 * @param media - The title.
 * @returns Its id.
 */
const idOf = (media: MediaSummary): string => media.id;

/**
 * What tells one programme coming up from another.
 *
 * @param coming - The programme, and its next episode.
 * @returns The programme's id.
 */
const programmeIdOf = ({ show }: ComingUp['shows'][number]): string => show.id;

/**
 * One shelf of the home page: what is coming up, or one of its rows of titles,
 * drawn again only when what it holds changes rather than whenever the page around it does.
 *
 * Each card is drawn as it scrolls into view and again only when what it shows changes, and where
 * each title comes from is worked out once for the whole shelf.
 *
 * @param shelf - Which shelf.
 * @param upcoming - What is coming up, for the shelf of it.
 * @param progress - How far through each title somebody is.
 * @param today - Today, as a date, to say when an episode airs against.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param flagOf - What is new about a title, where anything is.
 * @param onDismiss - Told to take a title off continue watching, where the server can.
 */
const AHomeShelfDrawn = ({
  shelf,
  upcoming,
  progress,
  today,
  onLookAt,
  flagOf,
  onLookAtShow,
  onDismiss,
}: AHomeShelfProps) => {
  const isResuming = shelf.kind === 'rail' && shelf.rail.id === RESUMING;

  const drawTitle = useCallback(
    (media: MediaSummary) => {
      const known = progress.get(media.id);

      return (
        <ACard
          media={media}
          asProgramme={!isResuming}
          isStill={isResuming}
          watched={known === undefined ? 0 : watchedFraction(known)}
          look="art"
          flag={flagOf(media)}
          onLookAt={onLookAt}
          onLookAtShow={onLookAtShow}
          {...(onDismiss === undefined || !isResuming ? {} : { onHold: onDismiss })}
        />
      );
    },
    [progress, isResuming, flagOf, onLookAt, onLookAtShow, onDismiss],
  );

  const drawComingUp = useCallback(
    ({ show, episode }: ComingUp['shows'][number]) => (
      <Button
        tone="bare"
        label={show.title}
        onPress={() => {
          onLookAtShow(show.libraryId, show.id);
        }}
      >
        <APoster
          title={show.title}
          artwork={onThisServer(artworkUrl(show.coverMediaId, 'poster', { size: 'small' }))}
          note={say('common.sSeasonNumberEEpisodeNumberAirDate', {
            seasonNumber: episode.seasonNumber.toString(),
            episodeNumber: episode.episodeNumber.toString(),
            airDate: describeAirDate(episode.airDate, today),
          })}
        />
      </Button>
    ),
    [onLookAtShow, today],
  );

  return shelf.kind === 'comingUp' ? (
    <AShelf
      title={say('common.comingUp')}
      items={upcoming}
      keyOf={programmeIdOf}
      drawn={drawComingUp}
      cardWidth={POSTER_WIDTH}
    />
  ) : (
    <ACardOrigins>
      <AShelf
        title={shelf.rail.title}
        items={shelf.rail.items}
        keyOf={idOf}
        drawn={drawTitle}
        cardWidth={STILL_WIDTH}
      />
    </ACardOrigins>
  );
};

const AHomeShelf = memo(AHomeShelfDrawn, isDrawnAlike);

AHomeShelf.displayName = 'AHomeShelf';

export { AHomeShelf };
