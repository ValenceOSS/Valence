import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { say } from '@ValenceI18n/say';
import { glassSquare } from '@ValenceScreens/components/PlayWithRestart/glassSquare';
import type { ArtworkCloseButtonProps } from './ArtworkCloseButton.types';

/**
 * Closes a title's dialog from the top of its artwork, drawn as the buttons beside its play button
 * are: a square lit faintly over the picture.
 *
 * @param onClose - Told the dialog was dismissed.
 */
const ArtworkCloseButton = ({ onClose }: ArtworkCloseButtonProps) => (
  <Button
    variant="ghost"
    size="none"
    label={say('common.close')}
    className={glassSquare}
    onClick={onClose}
  >
    <Icon of={XIcon} size={22} />
  </Button>
);

ArtworkCloseButton.displayName = 'ArtworkCloseButton';

export { ArtworkCloseButton };
