import { useRef, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { titlesToFollow } from '@ValenceClient/requests/titlesToFollow';
import { followEveryTitle } from '@ValenceClient/requests/followEveryTitle';
import { countStillWanted } from '@ValenceClient/requests/countStillWanted';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CountedKey } from '@ValenceI18n/CountedKey';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { FollowAllDialogProps } from './FollowAllDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const COUNTED: Readonly<Record<CatalogueEntry['kind'], CountedKey | null>> = {
  film: 'common.count.films',
  series: 'common.count.shows',
  artist: 'common.count.artists',
  album: 'common.count.albums',
  book: null,
};

const LIST = 'divide-y divide-[var(--surface-line)] rounded-xl border border-[var(--surface-line)]';

const ROW = 'flex items-center justify-between gap-6 px-4 py-3';

type Outcome = { followed: number; failed: number } & ReturnType<typeof countStillWanted>;

/**
 * Follows every title the libraries hold that nothing follows yet, once whoever manages requests
 * has seen how many from each library that is and what following does. The titles are followed a
 * few at a time with a bar saying how far it has got, which Stop cuts short, and the dialog ends
 * on how much of what is now followed is still to find.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param entries - Every title in the Catalogue.
 * @param libraries - Every library, to name each and say which take requests.
 * @param onClose - Told when it is closed.
 * @param onFollowed - Told once following has finished, so the Catalogue can be read again.
 */
const FollowAllDialog = ({
  isOpen,
  entries,
  libraries,
  onClose,
  onFollowed,
}: FollowAllDialogProps) => {
  const [following, setFollowing] = useState<readonly CatalogueEntry[] | null>(null);
  const [done, setDone] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const isStopped = useRef(false);
  const { titles, elsewhere } = titlesToFollow(
    entries,
    new Set(libraries.filter((library) => library.takesRequests).map((library) => library.id)),
  );
  const byLibrary = libraries.flatMap((library) => {
    const theirs = titles.filter((entry) => entry.libraryId === library.id);
    const counts = Object.entries(COUNTED).flatMap(([kind, key]) => {
      const count = theirs.filter((entry) => entry.kind === kind).length;

      return key === null || count === 0 ? [] : [sayCount(key, count)];
    });

    return theirs.length === 0 ? [] : [{ library, counts }];
  });

  const close = () => {
    if (following !== null && outcome === null) {
      isStopped.current = true;
      setIsStopping(true);

      return;
    }

    setFollowing(null);
    setIsStopping(false);
    setOutcome(null);
    setDone(0);
    onClose();
  };

  const start = () => {
    const snapshot = [...titles];

    isStopped.current = false;
    setDone(0);
    setFollowing(snapshot);

    void followEveryTitle(snapshot, setDone, () => isStopped.current).then(
      ({ followed, failed }) => {
        setOutcome({ followed: followed.length, failed, ...countStillWanted(followed) });
        onFollowed();
      },
    );
  };

  if (outcome !== null) {
    const title = sayCount(
      'screens.adminArea.cataloguePanel.followAllDialog.followedCountTitles',
      outcome.followed,
    );
    const rows: ReadonlyArray<{ key: StringKey; count: number }> = [
      {
        key: 'screens.adminArea.cataloguePanel.followAllDialog.filmsStillToFind',
        count: outcome.films,
      },
      {
        key: 'screens.adminArea.cataloguePanel.followAllDialog.episodesStillToFind',
        count: outcome.episodes,
      },
      {
        key: 'screens.adminArea.cataloguePanel.followAllDialog.albumsStillToFind',
        count: outcome.albums,
      },
      ...(outcome.failed === 0
        ? []
        : [
            {
              key: 'screens.adminArea.cataloguePanel.followAllDialog.couldNotBeFollowed' as const,
              count: outcome.failed,
            },
          ]),
    ];

    return (
      <Dialog label={title} isOpen={isOpen} onClose={close} className="sm:w-[min(30rem,92vw)]">
        <DialogTitle title={title} />

        <DialogContent>
          <div className="flex flex-col gap-4 text-sm">
            <ul className={LIST}>
              {rows.map(({ key, count }) => (
                <li key={key} className={ROW}>
                  <span className="text-text">{say(key)}</span>
                  <span className="tabular-nums text-text-muted">{count}</span>
                </li>
              ))}
            </ul>

            <p className="text-text-muted">
              {say('screens.adminArea.cataloguePanel.followAllDialog.searchedForOnTheSchedule')}
            </p>
          </div>
        </DialogContent>

        <DialogFooter confirm={{ label: say('common.done'), onChoose: close }} />
      </Dialog>
    );
  }

  const title = say('screens.adminArea.cataloguePanel.followAllDialog.followEveryTitle');
  const progress = say('screens.adminArea.cataloguePanel.followAllDialog.followedDoneOfCount', {
    done,
    count: following?.length ?? 0,
  });

  return (
    <Dialog label={title} isOpen={isOpen} onClose={close} className="sm:w-[min(30rem,92vw)]">
      <DialogTitle title={title} />

      <DialogContent>
        {following !== null ? (
          <ProgressBar
            isFull
            label={progress}
            readout={
              <span className="shrink-0 text-sm tabular-nums text-text-muted">{progress}</span>
            }
            value={done}
            max={Math.max(following.length, 1)}
          />
        ) : titles.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.cataloguePanel.followAllDialog.nothingToFollow')}
          </p>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <ul className={LIST}>
              {byLibrary.map(({ library, counts }) => (
                <li key={library.id} className={ROW}>
                  <span className="min-w-0 truncate font-medium text-text">{library.name}</span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-x-3 tabular-nums text-text-muted">
                    {counts.map((count) => (
                      <span key={count}>{count}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 text-text-muted">
              <p>{say('screens.adminArea.cataloguePanel.followAllDialog.whatIsFetched')}</p>
              <p>{say('screens.adminArea.cataloguePanel.followAllDialog.nobodyIsNotified')}</p>
              {elsewhere === 0 ? null : (
                <p>
                  {sayCount(
                    'screens.adminArea.cataloguePanel.followAllDialog.countElsewhere',
                    elsewhere,
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {following === null ? (
        <DialogFooter
          dismiss={{ onChoose: close }}
          {...(titles.length === 0
            ? {}
            : {
                confirm: {
                  label: sayCount(
                    'screens.adminArea.cataloguePanel.followAllDialog.followCountTitles',
                    titles.length,
                  ),
                  onChoose: start,
                },
              })}
        />
      ) : (
        <DialogFooter
          dismiss={{
            label: say('common.stop'),
            onChoose: close,
            isDisabled: isStopping,
          }}
        />
      )}
    </Dialog>
  );
};

FollowAllDialog.displayName = 'FollowAllDialog';

export { FollowAllDialog };
