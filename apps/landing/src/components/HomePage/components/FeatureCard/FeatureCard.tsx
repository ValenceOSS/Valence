import { useEffect, useRef } from 'react';
import {
  Activity as ActivityIcon,
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  Download as DownloadIcon,
  FileCode as FileCodeIcon,
  Home as HomeIcon,
  KeyRound as KeyRoundIcon,
  Link as LinkIcon,
  Monitor as MonitorIcon,
  Plug as PlugIcon,
  ShieldCheck as ShieldCheckIcon,
  SkipForward as SkipForwardIcon,
  Sparkles as SparklesIcon,
  Sun as SunIcon,
  Terminal as TerminalIcon,
  Users as UsersIcon,
  Zap as ZapIcon,
} from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { FeatureVisual } from './components/FeatureVisual/FeatureVisual';
import type { FeatureVisualKind } from './components/FeatureVisual/FeatureVisual.types';
import type { FeatureCardProps } from './FeatureCard.types';

const ICONS: Readonly<Record<FeatureVisualKind, typeof MonitorIcon>> = {
  devices: MonitorIcon,
  hdr: SunIcon,
  skips: SkipForwardIcon,
  reader: BookOpenIcon,
  party: UsersIcon,
  shareLink: LinkIcon,
  offline: DownloadIcon,
  notifications: BellIcon,
  sessions: ActivityIcon,
  webhooks: ZapIcon,
  setup: SparklesIcon,
  contract: FileCodeIcon,
  apiKeys: KeyRoundIcon,
  plugins: PlugIcon,
  terminal: TerminalIcon,
  household: HomeIcon,
  auth: ShieldCheckIcon,
};

/**
 * One feature in a ruled grid of them, its cell sharing its edges with its neighbours: a mark for
 * it in a small rounded tile, a working piece of the product doing what the feature says, and its
 * name large beneath with a line about it. One cell in a stretch is turned dark, its tile lit in the
 * accent, so the grid has a place for the eye to land.
 *
 * Pointed at, a soft light follows the pointer across the cell and the piece of the product leans
 * towards wherever the pointer is, easing back flat once it leaves.
 *
 * @param feature - What it is and why it matters.
 * @param index - Where it sits in the grid, so it arrives in order.
 * @param isLit - Whether it is the dark cell of its stretch.
 */
const FeatureCard = ({ feature, index, isLit = false }: FeatureCardProps) => {
  const cellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cell = cellRef.current;

    if (cell === null) {
      return;
    }

    const follow = (event: PointerEvent) => {
      const box = cell.getBoundingClientRect();

      cell.style.setProperty('--spot-x', `${(event.clientX - box.left).toString()}px`);
      cell.style.setProperty('--spot-y', `${(event.clientY - box.top).toString()}px`);
      cell.style.setProperty(
        '--tilt-x',
        (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3),
      );
      cell.style.setProperty(
        '--tilt-y',
        (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3),
      );
    };

    const settle = () => {
      cell.style.removeProperty('--tilt-x');
      cell.style.removeProperty('--tilt-y');
    };

    cell.addEventListener('pointermove', follow);
    cell.addEventListener('pointerleave', settle);

    return () => {
      cell.removeEventListener('pointermove', follow);
      cell.removeEventListener('pointerleave', settle);
    };
  }, []);

  return (
    <RevealItem
      index={index}
      className={cn('list-none', isLit ? 'bg-text text-surface' : 'bg-surface text-text')}
    >
      <article
        ref={cellRef}
        className={cn(
          'group relative isolate flex h-full flex-col gap-6 p-7 sm:p-9',
          isLit
            ? '[--color-text:var(--color-surface)] [--color-text-muted:color-mix(in_oklab,var(--color-surface)_65%,transparent)]'
            : '',
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(22rem_circle_at_var(--spot-x,50%)_var(--spot-y,50%),var(--surface-hover),transparent_70%)] opacity-0 transition-opacity duration-300 motion-reduce:transition-none acted:opacity-100"
        />

        <span
          className={cn(
            'flex size-12 items-center justify-center rounded-xl',
            isLit ? 'bg-accent text-accent-contrast' : 'border border-text/70 text-text',
          )}
        >
          <Icon of={ICONS[feature.visual]} size={20} />
        </span>

        <div className="h-64 min-h-0">
          <FeatureVisual kind={feature.visual} />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] text-text lg:text-[1.75rem]">
            {feature.title}
          </h3>

          <p className="text-[0.9375rem] leading-relaxed text-text-muted">{feature.detail}</p>
        </div>
      </article>
    </RevealItem>
  );
};

FeatureCard.displayName = 'FeatureCard';

export { FeatureCard };
