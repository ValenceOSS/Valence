import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Copy as CopyIcon, X as XIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { TextField } from '@ValenceUI/TextField';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { SHARE_CAPS } from '@ValenceClient/sharing/SHARE_CAPS';
import { SHARE_LASTS } from '@ValenceClient/sharing/SHARE_LASTS';
import { newShareFor } from '@ValenceClient/sharing/newShareFor';
import { createShare, shareAddress } from '@ValenceClient/sharing/fetchShares';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import type { ShareDialogProps } from './ShareDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Hands out a link to something, and shows it once. The token is shown here and nowhere else ever
 * again — the server keeps only a hash of it — so this is the one moment it can be copied.
 *
 * The two ways a link can end are offered together and mean different things: "available this
 * weekend" and "one watch only" are both reasonable, and where both are set whichever runs out first
 * ends it.
 *
 * A programme is shared as a programme and nothing else. Opened from an episode there is a choice,
 * because an episode genuinely belongs to both; opened from the programme itself there is nothing to
 * choose, and offering "just this episode" would mean the one the catalogue happened to pick.
 *
 * What is being shared is still said either way. A row with nothing to choose is not a row worth
 * removing: somebody handing out a whole programme should be told that is what they are doing before
 * they press, rather than inferring it from which dialog they happened to open.
 *
 * @param subject - What is being shared, or null while the dialog is shut.
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Told when it was dismissed.
 * @param origin - Where this server is reachable, which the link is written against.
 */
const ShareDialog = ({ subject, isOpen, onClose, origin }: ShareDialogProps) => {
  const [lasts, setLasts] = useState<string>('7');
  const [cap, setCap] = useState<string>('any');
  const [kind, setKind] = useState<'item' | 'series'>('item');
  const [link, setLink] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isUnlettered, setIsUnlettered] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLink(null);
    setRefusal(null);
    setIsCopied(false);
    setIsUnlettered(false);
    setKind('item');
  }, [isOpen, subject]);

  const media = subject?.kind === 'item' ? subject.media : null;
  const isEpisode = media !== null && media.seriesId !== null;

  const named =
    subject?.kind === 'series'
      ? subject.title
      : subject?.kind === 'book'
        ? subject.book.title
        : (media?.seriesTitle ?? media?.title ?? 'this');

  const backdrop =
    subject?.kind === 'book'
      ? subject.book.hasCover
        ? bookCoverUrl(subject.book.id)
        : null
      : media === null
        ? null
        : media.hasBackdrop
          ? artworkUrl(media.id, 'backdrop')
          : media.hasPoster
            ? artworkUrl(media.id, 'poster')
            : null;

  const isLettered = media !== null && media.hasLogo && !isUnlettered;

  const hand = async () => {
    if (subject === null) {
      return;
    }

    setIsWorking(true);
    setRefusal(null);

    const made = await createShare(
      newShareFor(subject, { lasts, cap, isWholeProgramme: kind === 'series' }, Date.now()),
    );

    setIsWorking(false);

    if (made === null) {
      setRefusal(say('common.thatCouldNotBeSharedYou'));

      return;
    }

    setLink(shareAddress(made.token, origin ?? window.location.origin));
  };

  return (
    <Dialog label={say('common.share')} isOpen={isOpen} onClose={onClose}>
      <DialogContent className="p-2.5 sm:p-3">
        <div className="relative h-28 overflow-hidden rounded-xl sm:h-32">
          {backdrop === null ? (
            <div aria-hidden className="absolute inset-0 bg-surface-raised" />
          ) : (
            <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}

          <BackdropScrim />

          <div className="absolute right-3 top-3">
            <Button
              isIconOnly
              variant="overlay"
              size="sm"
              label={say('common.close')}
              onClick={onClose}
            >
              <Icon of={XIcon} size={16} />
            </Button>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
            <span className="text-[0.6875rem] font-medium text-on-scrim/75">
              {say('common.share')}
            </span>

            <h2 className="max-w-[24ch] truncate text-xl font-semibold leading-tight tracking-[-0.02em] text-on-scrim">
              {isLettered ? (
                <TitleLogo
                  src={titleLogoUrl(media.id)}
                  alt={named}
                  className="max-h-9 w-auto max-w-[min(50vw,11rem)] object-contain object-left"
                  onError={() => {
                    setIsUnlettered(true);
                  }}
                />
              ) : (
                named
              )}
            </h2>
          </div>
        </div>

        {link === null ? (
          <div className="flex flex-col gap-3 pt-3">
            <div className="valence-card-face grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 divide-y divide-[var(--surface-line)] px-3 py-1 [&>span]:col-span-2 [&>span]:grid [&>span]:grid-cols-subgrid [&>span]:items-center [&>span]:py-2">
              {subject?.kind === 'series' || subject?.kind === 'book' ? (
                <span className="flex items-center justify-between gap-4">
                  <span className="shrink-0 text-sm text-text-muted">
                    {say('common.whatToShare')}
                  </span>

                  <span className="flex h-9 min-w-0 items-center truncate text-sm font-medium text-text">
                    {subject.kind === 'book'
                      ? say('screens.shareDialog.theWholeBook')
                      : say('common.theWholeProgramme')}
                  </span>
                </span>
              ) : null}

              {isEpisode ? (
                <Choice
                  label={say('common.whatToShare')}
                  value={kind}
                  options={[
                    { id: 'item', label: say('common.justThisEpisode') },
                    { id: 'series', label: say('common.theWholeProgramme') },
                  ]}
                  onSelect={(chosen) => {
                    setKind(chosen === 'series' ? 'series' : 'item');
                  }}
                />
              ) : null}

              <Choice
                label={say('common.lasts')}
                value={lasts}
                options={SHARE_LASTS}
                onSelect={setLasts}
              />

              <Choice
                label={
                  subject?.kind === 'book'
                    ? say('screens.shareDialog.whoCanRead')
                    : say('screens.shareDialog.whoCanWatch')
                }
                value={cap}
                options={SHARE_CAPS}
                onSelect={setCap}
              />
            </div>

            {refusal === null ? null : <p className="px-1 text-sm text-danger">{refusal}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <p className="min-w-0 flex-1 basis-56 font-body text-xs text-text-muted">
                {subject?.kind === 'book'
                  ? say('screens.shareDialog.onlyThisBookAndYouCan')
                  : say('screens.shareDialog.onlyWhatYouShareAndYou')}
              </p>

              <Button
                variant="confirm"
                isLoading={isWorking}
                onClick={() => {
                  void hand();
                }}
              >
                {say('common.makeALink')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-1 pt-4">
            <p className="font-body text-sm text-text-muted">
              {say('screens.shareDialog.copyItNowThisIsThe')}
            </p>

            <TextField
              label={say('screens.shareDialog.theLink')}
              value={link}
              onValueChange={() => undefined}
            />

            <Button
              variant="confirm"
              className="self-end"
              onClick={() => {
                void navigator.clipboard.writeText(link).then(() => {
                  setIsCopied(true);
                });
              }}
            >
              <Icon of={CopyIcon} size={16} />
              {isCopied ? say('common.copied') : say('screens.shareDialog.copyTheLink')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

ShareDialog.displayName = 'ShareDialog';

export { ShareDialog };
