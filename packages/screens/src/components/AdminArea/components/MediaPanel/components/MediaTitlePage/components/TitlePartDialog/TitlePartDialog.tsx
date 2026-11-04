import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TitleDetails } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/TitleDetails';
import type { TitlePartDialogProps } from './TitlePartDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * A season's or an episode's details, edited on the stage as admin's other editors are: an
 * episode's still and file above its fields, and the way to the one before and after it.
 *
 * @param part - The season or episode, kept while the dialog closes.
 * @param isOpen - Whether it is open.
 * @param onClose - Closes it.
 * @param onPrevious - Moves to the one before, where there is one.
 * @param onNext - Moves to the one after, where there is one.
 */
const TitlePartDialog = ({ part, isOpen, onClose, onPrevious, onNext }: TitlePartDialogProps) => (
  <Dialog
    label={part?.title ?? say('common.details')}
    isOpen={isOpen}
    onClose={onClose}
    size="stage"
  >
    {part === null ? null : (
      <>
        <DialogTitle
          size="compact"
          title={part.title}
          {...(part.detail === null ? {} : { detail: part.detail })}
        />

        <DialogContent className="flex flex-col gap-4">
          {part.scope === 'episode' ? (
            <div className="flex flex-wrap items-end gap-4">
              <img
                key={part.mediaId}
                src={artworkUrl(part.mediaId, 'backdrop', { size: 'medium' })}
                alt=""
                className="aspect-video w-72 rounded-lg object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              {part.path === null ? null : (
                <span className="min-w-0 flex-1 break-all text-xs text-text-muted">
                  {part.path}
                </span>
              )}
            </div>
          ) : null}

          <TitleDetails
            key={`${part.scope}:${part.mediaId}`}
            mediaId={part.mediaId}
            scope={part.scope}
          />
        </DialogContent>

        <DialogFooter
          lead={
            onPrevious === undefined && onNext === undefined ? undefined : (
              <span className="flex gap-2">
                <Button variant="glossy" disabled={onPrevious === undefined} onClick={onPrevious}>
                  {say('common.previous')}
                </Button>
                <Button variant="glossy" disabled={onNext === undefined} onClick={onNext}>
                  {say('common.next')}
                </Button>
              </span>
            )
          }
          dismiss={{ onChoose: onClose, label: say('common.done') }}
        />
      </>
    )}
  </Dialog>
);

TitlePartDialog.displayName = 'TitlePartDialog';

export { TitlePartDialog };
