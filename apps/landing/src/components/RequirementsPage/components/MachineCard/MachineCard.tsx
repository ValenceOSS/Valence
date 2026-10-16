import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import type { MachineSupport } from '@ValenceLanding/content/requirements/Machine';
import type { MachineCardProps } from './MachineCard.types';

const SUPPORT = {
  image: { label: 'Works in the image', tone: 'success' },
  native: { label: 'Transcoder runs natively', tone: 'accent' },
  setup: { label: 'Needs extra setup', tone: 'warning' },
  software: { label: 'Software transcoding', tone: 'quiet' },
  notYet: { label: 'Not yet', tone: 'outline' },
} as const satisfies Record<
  MachineSupport,
  { label: string; tone: 'success' | 'accent' | 'warning' | 'quiet' | 'outline' }
>;

/**
 * One kind of machine people run Valence on: what it is, some that are, how Valence uses its
 * graphics, and how far it works today — straight from the published image, with the transcoder
 * running natively beside it, with setup the image does not do yet, or not yet at all — with the
 * guide to setting it up where there is one.
 *
 * @param machine - The machine.
 */
const MachineCard = ({ machine }: MachineCardProps) => (
  <article className="flex flex-col gap-4 bg-surface p-6 lg:p-7">
    <div className="flex items-start justify-between gap-3">
      <Icon of={machine.icon} size={28} className="text-accent" />
      <Badge size="sm" tone={SUPPORT[machine.support].tone}>
        {SUPPORT[machine.support].label}
      </Badge>
    </div>

    <div className="flex flex-col gap-1.5">
      <h3 className="text-balance text-xl font-semibold tracking-tight text-text">
        {machine.name}
      </h3>
      <p className="text-pretty text-sm text-text-muted">{machine.examples}</p>
    </div>

    <p className="font-mono text-xs uppercase tracking-[0.1em] text-accent">
      {machine.acceleration}
    </p>

    <p className="flex-1 text-pretty text-sm leading-relaxed text-text-muted">{machine.body}</p>

    {machine.guide === null ? null : (
      <Link
        href={`${DOCS_URL}${machine.guide}`}
        className="inline-flex items-center gap-1 self-start text-sm font-semibold text-text-muted no-underline hover:text-text"
      >
        Setup guide
        <Icon of={ArrowRightIcon} size={14} />
      </Link>
    )}
  </article>
);

MachineCard.displayName = 'MachineCard';

export { MachineCard };
