import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ArtworkChooser } from '@ValenceScreens/components/AdminArea/components/ArtworkChooser/ArtworkChooser';
import type { ArtworkPickerProps } from './ArtworkPicker.types';
import { say } from '@ValenceI18n/say';

/**
 * Chooses the poster, backdrop and logo a film or programme is drawn with, in a dialog over the
 * page it was opened from, for when the catalogue's own pick is the wrong one — lettering in a
 * language nobody in the house reads, a poster from another country, a backdrop that gives the
 * ending away.
 *
 * @param subject - The title being dressed, or null when the picker is closed.
 * @param onClose - Told it was dismissed.
 * @param onChanged - Told a choice was made, with the job restoring the catalogue's pick where one was
 *   needed.
 */
const ArtworkPicker = ({ subject, onClose, onChanged }: ArtworkPickerProps) => (
  <DialogCompanion
    label={subject?.name ?? say('common.artwork')}
    isOpen={subject !== null}
    onClose={onClose}
  >
    <DialogTitle
      size="compact"
      title={subject?.name ?? say('common.artwork')}
      detail={
        subject?.isSeries === true
          ? say('screens.adminArea.artworkPicker.reachesEveryEpisodeAndOutlivesEvery')
          : say('screens.adminArea.artworkPicker.drawsThisFilmEverywhereAndEvery')
      }
    />

    <DialogContent>
      {subject === null ? null : <ArtworkChooser subject={subject} onChanged={onChanged} />}
    </DialogContent>

    <DialogFooter dismiss={{ onChoose: onClose }} />
  </DialogCompanion>
);

ArtworkPicker.displayName = 'ArtworkPicker';

export { ArtworkPicker };
