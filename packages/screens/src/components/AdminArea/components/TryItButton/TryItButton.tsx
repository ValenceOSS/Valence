import { Check as CheckIcon, X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { TryItButtonProps } from './TryItButton.types';

/**
 * Tries something before it is kept, and says how it went on the button itself: a spinner while it
 * is being tried, then a tick or a cross. Why it failed belongs beside the dialog's own buttons,
 * where whoever pressed this is already looking.
 *
 * @param isTrying - Whether it is being tried now.
 * @param verdict - How the last try went, or null where there is none still standing.
 * @param isDisabled - Whether something else is under way.
 * @param onTry - Called to try it.
 */
const TryItButton = ({ isTrying, verdict, isDisabled = false, onTry }: TryItButtonProps) => (
  <Button variant="secondary" disabled={isDisabled} isLoading={isTrying} onClick={onTry}>
    {verdict === null || isTrying ? null : (
      <Icon
        of={verdict === 'working' ? CheckIcon : XIcon}
        className={verdict === 'working' ? 'text-success' : 'text-danger'}
      />
    )}
    Try it
  </Button>
);

TryItButton.displayName = 'TryItButton';

export { TryItButton };
