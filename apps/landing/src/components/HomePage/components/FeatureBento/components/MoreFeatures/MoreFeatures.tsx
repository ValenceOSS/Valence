import { Badge } from '@ValenceUI/Badge';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import type { MoreFeaturesProps } from './MoreFeatures.types';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const ROWS = [
  ['Collections', 'Ratings', 'Requests', 'Music', 'Lyrics', 'Audiobooks', 'Chapters'],
  ['Subtitles', 'Trickplay', 'Listening parties', 'Playlists', 'Mixes', 'Calendars', 'Age limits'],
  [
    'Linked servers',
    'Two-factor',
    'Passkeys',
    'Discord status',
    'Smart shuffle',
    'Watch history',
    'Themes',
  ],
] as const;

const LINK = 'font-semibold text-accent underline underline-offset-4 hover:text-text';

/**
 * The last cell of the feature grid, which says there is more than the grid has room for — the
 * names of some of it drifting past in rows going opposite ways — and where to read about it or ask
 * for what is missing.
 *
 * @param index - Where it sits in the grid, so it arrives last.
 */
const MoreFeatures = ({ index }: MoreFeaturesProps) => (
  <RevealItem index={index} className="list-none bg-[var(--frame-back)]">
    <article className="flex h-full flex-col gap-6 p-7 sm:p-9">
      <div
        aria-hidden
        className="flex h-64 flex-col justify-center gap-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
      >
        {ROWS.map((row, at) => (
          <div
            key={row[0]}
            className={cn(
              'valence-drift flex w-max gap-2',
              at % 2 === 1 ? 'valence-drift--back' : '',
            )}
          >
            {[...row, ...row].map((name, place) => (
              <Badge key={`${name}-${place.toString()}`} tone="outline" size="md">
                {name}
              </Badge>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] text-text lg:text-[1.75rem]">
          And a great deal more
        </h3>

        <p className="text-[0.9375rem] leading-relaxed text-text-muted">
          Collections, ratings, requests, music, subtitles and the rest are all in{' '}
          <a href={DOCS_URL} className={LINK}>
            the docs
          </a>
          , and anything missing can be asked for on{' '}
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
            the Discord
          </a>
          .
        </p>
      </div>
    </article>
  </RevealItem>
);

MoreFeatures.displayName = 'MoreFeatures';

export { MoreFeatures };
