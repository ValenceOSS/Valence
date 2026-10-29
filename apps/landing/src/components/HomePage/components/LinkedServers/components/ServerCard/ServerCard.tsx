import { Server as ServerIcon } from '@keyline-icons/react/duotone';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ServerCardProps, ServerTint } from './ServerCard.types';

const TINT_CLASSES: Record<ServerTint, string> = {
  accent: 'text-accent',
  highlight: 'text-highlight',
};

/**
 * One of two linked servers as the admin area shows it: its name beside its colour, the fingerprint
 * the other admin checks before approving, and which of its libraries the other server is shared.
 *
 * @param tint - The colour the other server shows it in.
 * @param fingerprint - The short code worked out from its key.
 * @param libraries - Its libraries, each shared with the other server or not.
 */
const ServerCard = ({ name, tint, fingerprint, libraries }: ServerCardProps) => (
  <article
    aria-label={name}
    className="flex w-full flex-col gap-5 rounded-2xl border border-[var(--surface-line)] bg-[var(--frame-panel)] p-5 shadow-[var(--shadow-overlay)] [--card-shell:var(--frame-card)]"
  >
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--surface-line)] bg-[var(--surface-hover)]',
          TINT_CLASSES[tint],
        )}
      >
        <Icon of={ServerIcon} size={20} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-text">{name}</span>
        <span className="font-mono text-xs tracking-[0.08em] text-text-muted">{fingerprint}</span>
      </div>
    </div>

    <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
      {libraries.map((library) => (
        <li key={library.name} className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-sm text-text">{library.name}</span>
          <Badge size="sm" tone={library.isShared ? 'success' : 'quiet'}>
            {library.isShared ? 'Shared' : 'Not shared'}
          </Badge>
        </li>
      ))}
    </ul>
  </article>
);

ServerCard.displayName = 'ServerCard';

export { ServerCard };
