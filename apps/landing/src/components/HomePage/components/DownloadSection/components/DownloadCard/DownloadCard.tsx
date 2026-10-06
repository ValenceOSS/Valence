import { motion, useReducedMotionConfig } from 'motion/react';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import type { DownloadCardProps } from './DownloadCard.types';

/**
 * One of the places Valence is got from, as a card of its own drawn as the feature cards are: what
 * it is for in small capitals, its name beside its mark, and whatever there is to fetch below that.
 *
 * @param eyebrow - The kind of thing it is, in small capitals above its name.
 * @param title - Its name.
 * @param glyph - The mark drawn beside its name.
 * @param index - Where it sits among the cards, so they rise in one after another.
 * @param isLit - Whether it is the one this visitor most likely came for, which lifts it slightly.
 * @param className - Extra classes for the caller's own layout.
 * @param children - What it offers.
 */
const DownloadCard = ({
  eyebrow,
  title,
  glyph: Glyph,
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
      animate="hidden"
      viewport={{ margin: '-60px' }}
      variants={revealItemVariants(prefersReducedMotion)}
      className={cn(
        'valence-surface valence-surface--flat valence-feature-card flex flex-col overflow-hidden rounded-3xl',
        isLit ? 'ring-1 ring-accent/40' : '',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-text-muted/70">
            {eyebrow}
          </p>

          <h3 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-text lg:text-2xl">
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
