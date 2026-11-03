import { ChevronLeft as ChevronLeftIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { glassSquare } from '@ValenceScreens/components/PlayWithRestart/glassSquare';
import type { ArtworkBackButtonProps } from './ArtworkBackButton.types';

/**
 * Goes back from a dialog to the one it was opened from, drawn as the dialog's other buttons are: a
 * square lit faintly over the picture, standing where closing it would otherwise be offered.
 *
 * @param label - Where going back leads, read out and shown when pointed at.
 * @param onBack - Told to go back.
 */
const ArtworkBackButton = ({ label, onBack }: ArtworkBackButtonProps) => (
  <Button variant="ghost" size="none" label={label} className={glassSquare} onClick={onBack}>
    <Icon of={ChevronLeftIcon} size={22} />
  </Button>
);

ArtworkBackButton.displayName = 'ArtworkBackButton';

export { ArtworkBackButton };
