import { useMemo } from 'react';
import { cardTintOf } from '@ValenceCore/functions/cardTintOf';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { ArtworkCloseButton } from '@ValenceScreens/components/ArtworkCloseButton/ArtworkCloseButton';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { useMusicLights } from '@ValenceScreens/music/musicLights';
import { useIsDarkPage } from '@ValenceScreens/library/useIsDarkPage';
import type { MusicTitleDialogProps } from './MusicTitleDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * An album, an artist or a list of songs, opened over the page the way a film or a show is: the same
 * dialog, grounded in the colour of the picture at its head.
 *
 * @param isOpen - Whether anything is open.
 * @param onClose - Told it was dismissed.
 * @param children - What is open.
 */
const MusicTitleDialog = ({ isOpen, onClose, children }: MusicTitleDialogProps) => {
  const lights = useMusicLights();
  const isDark = useIsDarkPage();
  const tint = useMemo(
    () =>
      isDark
        ? cardTintOf(lights.map((light) => ({ colour: light.color, at: light.at ?? '' })))
        : null,
    [isDark, lights],
  );

  return (
    <Dialog label={say('common.music')} isOpen={isOpen} onClose={onClose} size="stage" edge={tint}>
      <DialogContent className="p-3 [--music-lane:0.25rem] sm:p-4 sm:[--music-lane:0.5rem]">
        <TintedGround tint={tint}>
          <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
            <ArtworkCloseButton onClose={onClose} />
          </div>

          {children}
        </TintedGround>
      </DialogContent>
    </Dialog>
  );
};

MusicTitleDialog.displayName = 'MusicTitleDialog';

export { MusicTitleDialog };
