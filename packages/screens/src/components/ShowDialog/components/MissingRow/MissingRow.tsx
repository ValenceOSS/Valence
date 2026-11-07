import { useState } from 'react';
import { Info as InfoIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { MissingEpisodeDialog } from './components/MissingEpisodeDialog/MissingEpisodeDialog';
import type { MissingRowProps } from './MissingRow.types';
import { say } from '@ValenceI18n/say';

/**
 * An episode the catalogue says exists and this library does not have, drawn in place among the ones
 * it does — so a gap is visible where it falls rather than being something to notice by counting.
 *
 * @param showTitle - The show it is from.
 * @param episodeNumber - Which episode is missing.
 * @param title - What the catalogue calls it.
 * @param stillUrl - The catalogue's own still, where it has one.
 * @param airs - When it aired or airs, in words, where the catalogue dates it.
 * @param overview - What the catalogue says happens in it, which is what there is to read about it.
 * @param seasonNumber - Which season it is in, where it has one.
 * @param logoMediaId - An episode of the show that has its lettering.
 * @param castMediaId - An episode of the show to read the cast from.
 * @param genres - The show's genres.
 * @param onOpenPerson - Told which performer to open, where opening one is offered.
 * @param onRequest - Told to ask for what is missing, where whoever is watching may ask.
 */
const MissingRow = ({
  showTitle,
  episodeNumber,
  title,
  stillUrl,
  airs,
  overview,
  seasonNumber,
  logoMediaId,
  castMediaId,
  genres,
  onOpenPerson,
  onRequest,
}: MissingRowProps) => {
  const [isReading, setIsReading] = useState(false);
  const named =
    title === undefined
      ? say('screens.showDialog.missingRow.episodeEpisodeNumber', {
          episodeNumber: episodeNumber.toString(),
        })
      : `${episodeNumber.toString()}. ${title}`;
  const standing =
    airs === undefined || airs === ''
      ? say('common.notInTheLibrary')
      : say('common.notInThisLibraryAirs', { airs });
  const hasOverview = overview !== undefined && overview !== null && overview !== '';

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <span className="flex min-w-[min(100%,24rem)] flex-1 basis-96 items-center gap-4 text-left">
        <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface-raised ring-1 ring-dashed ring-line sm:w-36">
          {stillUrl === null || stillUrl === undefined ? null : (
            <img
              src={stillUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-40 grayscale"
            />
          )}
        </span>

        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium text-text-muted">{named}</span>
          <span className="font-body text-xs text-text-muted">{standing}</span>
        </span>
      </span>

      {onRequest === undefined && !hasOverview ? null : (
        <span className="ml-auto flex shrink-0 items-center">
          {onRequest === undefined ? null : (
            <Button
              variant="confirm"
              size="md"
              {...(hasOverview ? { joins: 'next' as const } : {})}
              onClick={onRequest}
            >
              {say('common.request')}
            </Button>
          )}

          {!hasOverview ? null : (
            <Button
              variant="secondary"
              size="md"
              isIconOnly
              {...(onRequest === undefined ? {} : { joins: 'previous' as const })}
              className={onRequest === undefined ? '' : 'border-l-0'}
              label={say('common.aboutTitle', { title: title ?? named })}
              onClick={() => {
                setIsReading(true);
              }}
            >
              <Icon of={InfoIcon} size={16} />
            </Button>
          )}
        </span>
      )}

      <MissingEpisodeDialog
        isOpen={isReading}
        showTitle={showTitle}
        title={named}
        episodeNumber={episodeNumber}
        seasonNumber={seasonNumber}
        airs={airs}
        stillUrl={stillUrl}
        overview={overview}
        logoMediaId={logoMediaId}
        castMediaId={castMediaId}
        genres={genres}
        onOpenPerson={onOpenPerson}
        onRequest={onRequest}
        onClose={() => {
          setIsReading(false);
        }}
      />
    </div>
  );
};

MissingRow.displayName = 'MissingRow';

export { MissingRow };
