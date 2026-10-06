import { Plus as PlusIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { RevealItem } from '@ValenceUI/RevealItem';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import type { MoreFeaturesProps } from './MoreFeatures.types';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const LINK = 'font-semibold text-accent underline underline-offset-4 hover:text-text';

/**
 * The last cell of the feature grid, which says there is more than the grid has room for and where
 * to read about it or ask for what is missing.
 *
 * @param index - Where it sits in the grid, so it arrives last.
 */
const MoreFeatures = ({ index }: MoreFeaturesProps) => (
  <RevealItem index={index} className="list-none bg-surface">
    <article className="flex h-full flex-col gap-6 p-7 sm:p-9">
      <span className="flex size-12 items-center justify-center rounded-xl border border-text/70 text-text">
        <Icon of={PlusIcon} size={20} />
      </span>

      <div className="mt-auto flex flex-col gap-3">
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
