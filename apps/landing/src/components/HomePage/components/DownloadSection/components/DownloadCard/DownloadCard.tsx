import { motion, useReducedMotionConfig } from 'motion/react';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import type { DownloadCardProps } from './DownloadCard.types';

const HEADER_IMAGE = '/downloads-header.jpg';

const HEADER_WIDTH = 2000;

const HEADER_HEIGHT = 1422;

/**
 * One of the places Valence is got from, as a card of its own: a strip of the sky across its top,
 * fading into the card, with what it is for and its name set just beneath, and whatever there is to
 * fetch below that. Each card is given its own part of the picture, so a row of them reads as one
 * landscape rather than the same photograph three times over.
 *
 * @param eyebrow - The kind of thing it is, in small capitals above its name.
 * @param title - Its name.
 * @param glyph - The mark drawn beside its name.
 * @param focus - Which part of the picture the strip shows, as a CSS object position.
 * @param index - Where it sits among the cards, so they rise in one after another.
 * @param isLit - Whether it is the one this visitor most likely came for, which lifts it slightly.
 * @param className - Extra classes for the caller's own layout.
 * @param children - What it offers.
 */
const DownloadCard = ({
  eyebrow,
  title,
  glyph: Glyph,
  focus,
  index,
  isLit = false,
  className,
  children,
}: DownloadCardProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <motion.article
      aria-label={title}
      custom={index}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-60px' }}
      variants={revealItemVariants(prefersReducedMotion)}
      className={cn(
        'valence-surface valence-surface--flat flex flex-col overflow-hidden rounded-3xl',
        isLit ? 'ring-1 ring-accent/40' : '',
        className,
      )}
    >
      <div aria-hidden className="relative h-24 shrink-0 overflow-hidden sm:h-28">
        <img
          src={HEADER_IMAGE}
          alt=""
          width={HEADER_WIDTH}
          height={HEADER_HEIGHT}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: focus }}
        />
        <span className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-surface-raised" />
      </div>

      <div className="flex flex-1 flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="relative -mt-3 flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">{eyebrow}</p>

          <h3 className="flex items-center gap-3 text-lg font-semibold text-text">
            <Glyph size={20} className="shrink-0 text-text-muted" />
            {title}
          </h3>
        </div>

        {children}
      </div>
    </motion.article>
  );
};

DownloadCard.displayName = 'DownloadCard';

export { DownloadCard };
