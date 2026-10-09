import { useQuery } from '@tanstack/react-query';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { AskerFace } from './components/AskerFace/AskerFace';
import type { AskerStripProps } from './AskerStrip.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';
import { sayingAll } from '@ValenceI18n/sayingAll';
import { sayingCount } from '@ValenceI18n/sayingCount';

const NAMED = 3;

/**
 * Who asked for a title and how long ago, as a pill at the top of its page, and beside it everybody
 * else who wants it too: their faces overlapping and their names, which open the whole list.
 *
 * @param request - The request.
 */
const AskerStrip = ({ request }: AskerStripProps) => {
  const accounts = useQuery(adminQueries.accounts()).data ?? [];
  const first = request.requestedBy;
  const others = request.alsoAskedBy;
  const named = others.slice(0, NAMED);
  const [one, ...rest] = named.map((asker) => asker.name);

  return (
    <span className="flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-full border border-[var(--surface-line)] bg-[var(--surface-hover)] py-1.5 pl-1.5 pr-4 backdrop-blur-xl">
      <AskerFace asker={first} accounts={accounts} size="md" />

      <span className="text-sm text-text-muted">
        {say('screens.adminArea.titlePage.titleHero.askedForByNameWhen', {
          name: first.name,
          when: describeSince(request.createdAt, Date.now()),
        })}
      </span>

      {one === undefined ? null : (
        <>
          <span aria-hidden className="h-4 w-px bg-[var(--surface-line)]" />

          <PopoverPanel
            label={say('screens.adminArea.titlePage.askerStrip.everybodyWhoWantsIt')}
            heading={sayCount(
              'screens.adminArea.titlePage.askerStrip.countPeopleWantThis',
              others.length + 1,
            )}
            triggerLook="inline"
            align="start"
            className="w-72"
            trigger={
              <span className="flex items-center gap-2 py-0.5 pr-1 hover:text-text">
                <span className="flex -space-x-1.5">
                  {named.map((asker) => (
                    <AskerFace key={asker.id} asker={asker} accounts={accounts} size="sm" />
                  ))}
                </span>
                <span className="text-sm text-text-muted underline decoration-[var(--surface-line)] underline-offset-4">
                  {sayCount('common.namesWantItToo', others.length, {
                    names: sayAgain(
                      others.length > NAMED
                        ? sayingAll([
                            one,
                            ...rest,
                            sayingCount('common.count.others', others.length - NAMED),
                          ])
                        : sayingAll([one, ...rest]),
                    ),
                  })}
                </span>
              </span>
            }
          >
            <ul className="flex flex-col gap-1">
              {[first, ...others].map((asker, at) => (
                <li key={asker.id} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                  <AskerFace asker={asker} accounts={accounts} size="md" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-text">{asker.name}</span>
                    {at === 0 ? (
                      <span className="text-xs text-text-muted">
                        {say('screens.adminArea.titlePage.askerStrip.askedFirst')}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </PopoverPanel>
        </>
      )}
    </span>
  );
};

AskerStrip.displayName = 'AskerStrip';

export { AskerStrip };
