import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import {
  Film as FilmIcon,
  KeyRound as KeyRoundIcon,
  MessageSquarePlus as RequestIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/duotone';
import { useReached } from '@ValenceUI/useReached';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Icon } from '@ValenceUI/Icon';
import { Link as TextLink } from '@ValenceUI/Link';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { Figure } from '@ValenceUI/Figure';

const POINTS = [
  {
    title: 'Share what you choose',
    body: 'Linking shares nothing on its own. Each admin picks which libraries the other server sees, and an age limit for its people.',
    icon: FilmIcon,
  },
  {
    title: 'Watch together across both',
    body: 'Their films sit on your shelves as if they were yours, and a watch party on one server can be joined from the other, in step on both.',
    icon: TvIcon,
  },
  {
    title: 'Ask the other server',
    body: 'A search says when the linked server already has something, and requests can go to their queue for their admin to approve.',
    icon: RequestIcon,
  },
  {
    title: 'Known by a key, not an address',
    body: 'Each server holds the other’s key and signs every call it makes. Pairing is checked by fingerprint, and unlinking stops it at once.',
    icon: KeyRoundIcon,
  },
] as const;

/**
 * Linked servers on the home page: two households' servers drawn as one isometric figure, joined by
 * their link and each sharing only some of its libraries, beside what linking lets their people do and
 * how the two come to trust each other.
 */
const LinkedServers = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isReached = useReached(sectionRef, { margin: '-80px' });

  return (
    <section
      aria-label="Linked servers"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-10 xl:max-w-7xl"
    >
      <motion.div
        ref={sectionRef}
        initial="hidden"
        animate={isReached ? 'shown' : 'hidden'}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16"
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h2 className="max-w-xl text-balance text-4xl font-semibold tracking-tight text-text lg:text-6xl">
              Two households,{' '}
              <span className="font-accent font-normal italic tracking-normal">one</span> shelf.
            </h2>
            <p className="max-w-md text-balance text-lg text-text-muted">
              Link your Valence to a friend&rsquo;s, or to as many as you like, and watch, listen,
              read and request across them as if they were one server.
            </p>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point.title} className="flex flex-col gap-2">
                <span className="flex items-center gap-2 font-semibold text-text">
                  <Icon of={point.icon} size={18} tone="muted" className="shrink-0" />
                  {point.title}
                </span>
                <span className="leading-relaxed text-text-muted">{point.body}</span>
              </li>
            ))}
          </ul>

          <TextLink
            href={`${DOCS_URL}/use/linked-servers`}
            className="group inline-flex items-center gap-1.5 self-start text-text-muted no-underline transition-colors hover:text-text"
          >
            How linking works
            <Icon
              of={ArrowRightIcon}
              size={16}
              className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
            />
          </TextLink>
        </div>

        <Figure
          of="linkedServers"
          label="Two Valence servers on one base, joined by a signed link, each keeping one shelf of its own and lifting another into a shelf they share"
          className="mx-auto w-full max-w-xl text-text-muted"
        />
      </motion.div>
    </section>
  );
};

LinkedServers.displayName = 'LinkedServers';

export { LinkedServers };
