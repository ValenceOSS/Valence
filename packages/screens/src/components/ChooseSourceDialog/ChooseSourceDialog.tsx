import { useState } from 'react';
import { CloudOff as CloudOffIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { describeStreamOffer } from '@ValenceClient/streams/describeStreamOffer';
import { groupStreamOffers } from '@ValenceClient/streams/groupStreamOffers';
import type { StreamGroupId } from '@ValenceClient/streams/groupStreamOffers';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { ChooseSourceDialogProps } from './ChooseSourceDialog.types';

const MOST_PER_GROUP = 8;

/**
 * Which stream to play a film from, for somebody who wants to choose rather than let Valence:
 * each source's streams under the resolution they are, the one Valence would choose marked, each
 * row saying its picture, sound, size and whether it starts straight away, and where it comes
 * from. Choosing a row plays it, so a row is the confirmation. Streams that have to download at
 * their service first are folded away beneath the ones that start straight away, unless none do.
 * Sources still being asked show as rows still to come, and one that could not say is named.
 *
 * @param title - The film.
 * @param isOpen - Whether it is showing.
 * @param offers - What the sources offer, once they have said.
 * @param isLooking - Whether the sources are still being asked.
 * @param isFailed - Whether asking failed altogether.
 * @param bestId - The stream Valence would choose.
 * @param isPlaying - Whether a choice is being started, which holds the rows.
 * @param problem - Why the stream chosen would not play, where it would not.
 * @param onTryAgain - Called to ask the sources again.
 * @param onChoose - Called with the stream chosen.
 * @param onClose - Called when it is dismissed.
 */
const ChooseSourceDialog = ({
  title,
  isOpen,
  offers,
  isLooking,
  isFailed,
  bestId,
  isPlaying,
  problem,
  onTryAgain,
  onChoose,
  onClose,
}: ChooseSourceDialogProps) => {
  const [isShowingLater, setIsShowingLater] = useState(false);
  const [shownMore, setShownMore] = useState<ReadonlySet<StreamGroupId>>(new Set());
  const found = offers?.offers ?? [];
  const { groups, isAnyReady, laterCount } = groupStreamOffers(found, isShowingLater);

  return (
    <Dialog
      label={say('screens.chooseSourceDialog.sourcesForTitle', { title })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        title={say('common.playName', { name: title })}
        detail={
          isAnyReady || found.length === 0
            ? say('screens.chooseSourceDialog.instantSourcesStartStraightAway')
            : say('screens.chooseSourceDialog.noneCanStartStraightAway')
        }
      />

      <DialogContent>
        {isFailed ? (
          <CouldNotRead
            said={say('screens.chooseSourceDialog.couldNotLookForSources')}
            onTryAgain={onTryAgain}
          />
        ) : isLooking ? (
          <div aria-busy className="flex flex-col gap-2">
            <p className="text-sm text-text-muted">
              {say('screens.chooseSourceDialog.lookingForSources')}
            </p>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} shape="soft" className="h-14 w-full" />
            ))}
          </div>
        ) : found.length === 0 ? (
          <NothingHere
            of={CloudOffIcon}
            title={say('screens.chooseSourceDialog.noSourcesFound')}
            detail={say('screens.chooseSourceDialog.noneOfTheSourcesHaveThis')}
            action={
              <Button variant="secondary" onClick={onTryAgain}>
                {say('common.tryAgain')}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => {
              const shown = shownMore.has(group.id)
                ? group.offers
                : group.offers.slice(0, MOST_PER_GROUP);

              return (
                <section key={group.id} aria-label={group.heading} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-text-muted">{group.heading}</h3>
                  <ul className="flex flex-col gap-2">
                    {shown.map((offer) => {
                      const { summary, detail } = describeStreamOffer(offer);

                      return (
                        <li key={offer.id}>
                          <Button
                            variant="secondary"
                            className="h-auto w-full flex-col items-start gap-1 py-2 text-left"
                            disabled={isPlaying}
                            aria-label={
                              offer.id === bestId
                                ? `${say('screens.chooseSourceDialog.playSummaryFromSource', { summary, source: offer.sourceName })} · ${say('screens.chooseSourceDialog.bestMatch')}`
                                : say('screens.chooseSourceDialog.playSummaryFromSource', {
                                    summary,
                                    source: offer.sourceName,
                                  })
                            }
                            onClick={() => {
                              onChoose(offer.id);
                            }}
                          >
                            <span className="flex w-full items-center gap-2">
                              <span className="font-medium">{summary}</span>
                              {offer.id === bestId ? (
                                <Badge tone="accent" size="sm">
                                  {say('screens.chooseSourceDialog.bestMatch')}
                                </Badge>
                              ) : null}
                            </span>
                            <span
                              className="w-full truncate text-xs text-text-muted"
                              title={detail}
                            >
                              {detail}
                            </span>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  {group.offers.length > shown.length ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShownMore(new Set([...shownMore, group.id]));
                      }}
                    >
                      {say('common.showMore')}
                    </Button>
                  ) : null}
                </section>
              );
            })}
            {laterCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsShowingLater(!isShowingLater);
                }}
              >
                {isShowingLater
                  ? say('screens.chooseSourceDialog.hideSourcesThatDownloadFirst')
                  : sayCount(
                      'screens.chooseSourceDialog.count.showSourcesThatDownloadFirst',
                      laterCount,
                    )}
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>

      <DialogFooter
        note={problem ?? ((offers?.problems ?? []).map((said) => said.message).join(' ') || null)}
        dismiss={{ onChoose: onClose }}
      />
    </Dialog>
  );
};

ChooseSourceDialog.displayName = 'ChooseSourceDialog';

export { ChooseSourceDialog };
