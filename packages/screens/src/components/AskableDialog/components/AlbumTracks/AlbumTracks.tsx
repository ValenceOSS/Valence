import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { say } from '@ValenceI18n/say';
import { SlidingList } from '@ValenceScreens/components/SlidingList/SlidingList';
import type { AlbumTracksProps } from './AlbumTracks.types';

/**
 * The songs on an album somebody might ask for, in order, each with how long it runs, under one
 * highlight that slides between them, split by disc where there is more than one, and the label it came out on beneath them.
 *
 * @param tracks - The songs, in order.
 * @param label - The label it came out on, where it is known.
 */
const AlbumTracks = ({ tracks, label }: AlbumTracksProps) => {
  const discs = [...new Set(tracks.map((track) => track.disc))];

  return (
    <div className="flex flex-col gap-3">
      {discs.map((disc) => (
        <div key={disc} className="flex flex-col gap-1">
          {discs.length < 2 ? null : (
            <p className="px-2 pt-1 text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
              {say('screens.albumTracks.discNumber', { number: disc })}
            </p>
          )}
          <SlidingList
            items={tracks.filter((track) => track.disc === disc)}
            keyOf={(track) => `${track.disc.toString()}:${track.number.toString()}:${track.title}`}
            renderItem={(track) => (
              <span className="flex items-center gap-4 py-2.5 text-sm">
                <span className="w-6 shrink-0 text-right tabular-nums text-text-muted">
                  {track.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-text">{track.title}</span>
                {track.seconds === null ? null : (
                  <span className="shrink-0 tabular-nums text-text-muted">
                    {formatDuration(track.seconds)}
                  </span>
                )}
              </span>
            )}
          />
        </div>
      ))}

      {label === null ? null : <p className="px-2 text-xs text-text-muted">{label}</p>}
    </div>
  );
};

AlbumTracks.displayName = 'AlbumTracks';

export { AlbumTracks };
