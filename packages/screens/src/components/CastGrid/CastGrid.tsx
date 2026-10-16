import { Icon } from '@ValenceUI/Icon';
import { User as UserIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Link } from '@ValenceUI/Link';
import { useHrefOf } from '@ValenceScreens/navigation/useHrefOf';
import { NOTHING_OPEN } from '@ValenceScreens/navigation/NOTHING_OPEN';
import { Rail } from '@ValenceUI/Rail';
import { cn } from '@ValenceUI/cn';
import { canOpenPerson } from '@ValenceContracts/schemas/Person';
import type { CastGridProps } from './CastGrid.types';
import { say } from '@ValenceI18n/say';

/**
 * Shows the cast of a film or programme as a row of faces, each with the performer's name and the
 * part they played. It is the same row the libraries are browsed by, so the cast is paged and turned
 * the way everything else is rather than being a second kind of row that happens to hold people.
 *
 * Faces stand taller than they are wide, so more of them fit across than film cards do and the row
 * is asked for a denser set. A performer the catalogue has no photograph for keeps their place,
 * drawn with the same figure the person dialog uses, so a face nobody has a picture of still reads
 * as somebody rather than as a hole in the row.
 *
 * The photograph grows a little under the pointer, and the frame around it does not. Growing the
 * whole card instead pushed the picture past the rounded corners it was being clipped by, and the
 * corners came back square for as long as the pointer was on it — the same arrangement `MediaCard`
 * settled on, for the same reason.
 *
 * A performer the catalogue gave an identifier can be opened to see what else of theirs is here,
 * and is a link, so they can be opened in a new tab as well.
 * One the catalogue never matched is drawn the same but cannot be pressed — there is nothing behind
 * a name on its own, and offering to open it would open an empty dialog.
 *
 * @param members - The cast in billing order, each with a name, a role and an image if one is known.
 * @param title - What the row is called, the cast unless said — the people a search found, say.
 * @param onOpenPerson - Told which performer to open, where opening one is offered at all.
 */
const CastGrid = ({ members, title = say('common.cast'), onOpenPerson }: CastGridProps) => {
  const hrefOf = useHrefOf();

  return (
    <Rail
      title={title}
      count={members.length}
      sizesCards
      cards="portrait"
      hasArrows={false}
      look="section"
      className="px-0"
    >
      {members.map((member) => {
        const face = (
          <>
            <span className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-raised ring-1 ring-line">
              {member.imageUrl === null ? (
                <span className="flex h-full w-full items-center justify-center">
                  <Icon of={UserIcon} size={48} tone="muted" />
                </span>
              ) : (
                <img
                  src={member.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none hover-hover:group-hover:scale-105"
                />
              )}
            </span>

            <span className="flex w-full flex-col items-center gap-0.5 text-center">
              <span className="text-sm font-medium leading-tight text-text">{member.name}</span>
              <span className="font-body text-xs leading-tight text-text-muted">{member.role}</span>
            </span>
          </>
        );

        return (
          <li key={`${member.name}-${member.role}`} className="flex flex-col gap-3">
            {canOpenPerson(member.personId) && onOpenPerson !== undefined && hrefOf !== null ? (
              <Link
                href={hrefOf({ ...NOTHING_OPEN, person: member.personId })}
                look="bare"
                label={say('common.aboutName', { name: member.name })}
                onNavigate={() => {
                  onOpenPerson(member);
                }}
                className="group flex flex-col gap-3 rounded-lg text-left"
              >
                {face}
              </Link>
            ) : (
              <Button
                variant="bare"
                size="none"
                label={say('common.aboutName', { name: member.name })}
                hasTooltip={false}
                disabled={!canOpenPerson(member.personId) || onOpenPerson === undefined}
                className={cn(
                  'group flex flex-col gap-3 rounded-lg text-left',
                  canOpenPerson(member.personId) && onOpenPerson !== undefined
                    ? ''
                    : 'disabled:cursor-default disabled:opacity-100',
                )}
                onClick={() => {
                  onOpenPerson?.(member);
                }}
              >
                {face}
              </Button>
            )}
          </li>
        );
      })}
    </Rail>
  );
};

CastGrid.displayName = 'CastGrid';

export { CastGrid };
