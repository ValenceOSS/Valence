import { Button } from '@ValenceUI/Button';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { cn } from '@ValenceUI/cn';
import type { DiscoverPointerProps } from './DiscoverPointer.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const PEEKS = 6;

/**
 * Where a library search points to Discover for what is not on the server: a banner under what it
 * found — "Can't find what you're looking for?", how many results Discover has for the same words,
 * a few of their posters, and a way there — or, where the library found nothing, a larger card
 * saying so. Nothing where the catalogues have nothing to ask for either.
 *
 * @param query - What was searched for.
 * @param isAlone - Whether the library found nothing, so this is all there is to show.
 * @param onAsk - Called with a title to open, as its address names it.
 * @param onDiscover - Told to open Discover's search for the same words.
 */
const DiscoverPointer = ({ query, isAlone, onAsk, onDiscover }: DiscoverPointerProps) => {
  const found = useDiscoverSearch(query);
  const peeks = [...found.films, ...found.shows, ...found.books, ...found.artists]
    .filter((title) => title.posterUrl !== null)
    .slice(0, PEEKS);

  if (found.count === 0) {
    return null;
  }

  return (
    <section
      aria-label={say('screens.searchArea.discoverPointer.cantFindIt')}
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-[var(--surface-line)] bg-surface-raised',
        isAlone ? 'items-center p-8 text-center' : 'p-5 sm:flex-row sm:items-center',
      )}
    >
      <div className={cn('flex flex-col gap-1', isAlone ? 'items-center' : 'flex-1')}>
        <h2 className={cn('font-semibold text-text', isAlone ? 'text-xl' : 'text-base')}>
          {isAlone
            ? say('screens.searchArea.discoverPointer.nothingOnThisServerMatches', { query })
            : say('screens.searchArea.discoverPointer.cantFindIt')}
        </h2>
        {isAlone ? null : (
          <p className="text-sm text-text-muted">
            {sayCount('screens.searchArea.discoverPointer.discoverHasCount', found.count, {
              query,
            })}
          </p>
        )}
      </div>

      {peeks.length === 0 ? null : (
        <ul className="flex gap-2">
          {peeks.map((title) => (
            <li key={`${title.kind}-${title.id}`}>
              <Button
                variant="bare"
                size="none"
                label={title.title}
                onClick={() => {
                  onAsk(askingOf(title));
                }}
                className="block overflow-hidden rounded-md"
              >
                <img
                  src={title.posterUrl ?? ''}
                  alt=""
                  className="aspect-[2/3] w-12 object-cover sm:w-14"
                />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant={isAlone ? 'primary' : 'secondary'}
        onClick={() => {
          onDiscover(query);
        }}
      >
        {isAlone
          ? sayCount('screens.searchArea.discoverPointer.seeCountInDiscover', found.count)
          : say('screens.searchArea.discoverPointer.searchDiscoverFor', { query })}
      </Button>
    </section>
  );
};

DiscoverPointer.displayName = 'DiscoverPointer';

export { DiscoverPointer };
