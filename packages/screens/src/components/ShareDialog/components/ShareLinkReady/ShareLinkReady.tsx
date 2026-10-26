import { Copy as CopyIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { say } from '@ValenceI18n/say';
import type { ShareLinkReadyProps } from './ShareLinkReady.types';

/**
 * A share link once it is made: the one time it is shown, and a button that copies it.
 *
 * @param link - The address somebody else opens.
 * @param isCopied - Whether it has been copied already.
 * @param onCopy - Told to copy it.
 */
const ShareLinkReady = ({ link, isCopied, onCopy }: ShareLinkReadyProps) => (
  <div className="flex flex-col gap-3 px-1 pt-4">
    <p className="font-body text-sm text-text-muted">
      {say('screens.shareDialog.copyItNowThisIsThe')}
    </p>

    <TextField label={say('common.shareLink')} value={link} onValueChange={() => undefined} />

    <Button variant="confirm" className="self-end" onClick={onCopy}>
      <Icon of={CopyIcon} size={16} />
      {isCopied ? say('common.copied') : say('common.copyLink')}
    </Button>
  </div>
);

ShareLinkReady.displayName = 'ShareLinkReady';

export { ShareLinkReady };
