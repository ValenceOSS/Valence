import { useState } from 'react';
import {
  Download as DownloadIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import { Bin as BinFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { trackRowColumns } from '@ValenceScreens/components/TrackList/trackRowColumns';
import type { MissingSongRowProps } from './MissingSongRow.types';
import { say } from '@ValenceI18n/say';

/**
 * A song a playlist holds that the library does not have yet, drawn in its place among the songs
 * it does — numbered with them, muted, its album's cover faded under a download mark, as a missing
 * episode is drawn among a programme's. Pressing
 * it finds the album it is on to request, where that may be done, and its menu takes it out of a
 * playlist of yours.
 *
 * @param number - Where it sits in the list.
 * @param title - The song.
 * @param artist - Who it is by.
 * @param album - The album it is on, where the playlist says.
 * @param coverUrl - Its album's cover, where one is known.
 * @param showsAlbum - Whether the list names each song's album.
 * @param showsArtwork - Whether the list draws each song's cover.
 * @param onChoose - Finds its album to request, where somebody may.
 * @param onRemove - Takes it out, where this is a playlist of yours.
 */
const MissingSongRow = ({
  number,
  title,
  artist,
  album,
  coverUrl,
  showsAlbum,
  showsArtwork,
  onChoose,
  onRemove,
}: MissingSongRowProps) => {
  const [isCoverMissing, setIsCoverMissing] = useState(false);

  return (
    <li
      data-highlight
      className={cn(
        'group relative grid items-center gap-3 rounded-md px-3 py-1.5',
        trackRowColumns(showsAlbum),
      )}
    >
      <span className="flex size-8 items-center justify-center text-sm tabular-nums text-text-muted">
        {number.toString()}
      </span>

      <span className="flex min-w-0 items-center gap-3">
        {showsArtwork ? (
          <span className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface-raised ring-1 ring-dashed ring-line">
            {coverUrl === null || isCoverMissing ? null : (
              <img
                src={coverUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-40 grayscale"
                onError={() => {
                  setIsCoverMissing(true);
                }}
              />
            )}

            <span className="absolute inset-0 flex items-center justify-center text-text-muted">
              <Icon of={DownloadIcon} size={16} />
            </span>
          </span>
        ) : null}

        <span className="flex min-w-0 flex-col">
          {onChoose === undefined ? (
            <span className="truncate text-[0.9375rem] font-medium text-text-muted">{title}</span>
          ) : (
            <Button
              variant="bare"
              size="none"
              hasTooltip={false}
              label={say('common.requestTheAlbumTitleIsOn', { title })}
              className="truncate text-left text-[0.9375rem] font-medium text-text-muted"
              onClick={onChoose}
            >
              {title}
            </Button>
          )}

          <span className="truncate text-[0.8125rem] text-text-muted">
            {say('common.artistNotInYourLibrary', { artist })}
          </span>
        </span>
      </span>

      {showsAlbum ? (
        <span className="hidden min-w-0 truncate text-[0.8125rem] text-text-muted md:block">
          {album ?? ''}
        </span>
      ) : null}

      <span />

      <span />

      {onChoose === undefined && onRemove === undefined ? (
        <span />
      ) : (
        <ActionMenu
          label={say('common.moreForTitle', { title })}
          align="end"
          size="sm"
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          trigger={<Icon of={MoreHorizontalIcon} size={18} />}
          groups={[
            {
              items: [
                ...(onChoose === undefined
                  ? []
                  : [
                      {
                        id: 'request',
                        label: say('common.requestItsAlbum'),
                        icon: <Icon of={DownloadIcon} size={16} />,
                        onChoose,
                      },
                    ]),
                ...(onRemove === undefined
                  ? []
                  : [
                      {
                        id: 'remove',
                        label: say('common.removeFromThisPlaylist'),
                        icon: <Icon of={BinFilledIcon} size={16} />,
                        onChoose: onRemove,
                      },
                    ]),
              ],
            },
          ]}
        />
      )}
    </li>
  );
};

MissingSongRow.displayName = 'MissingSongRow';

export { MissingSongRow };
