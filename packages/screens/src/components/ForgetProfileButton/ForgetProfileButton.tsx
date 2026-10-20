import { useState } from 'react';
import { Bin as BinIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { notify } from '@ValenceUI/notify';
import { removeProfile } from '@ValenceClient/profiles/fetchProfiles';
import { say } from '@ValenceI18n/say';
import type { ForgetProfileButtonProps } from './ForgetProfileButton.types';

/**
 * Takes somebody back off the account while it is being set up, from the end of their row, so a
 * name added by mistake can go again at once. The owner's own profile is never offered.
 *
 * @param profile - Whose row it ends.
 * @param onForgotten - Told once they are gone, so the list can be read again.
 */
const ForgetProfileButton = ({ profile, onForgotten }: ForgetProfileButtonProps) => {
  const [isForgetting, setIsForgetting] = useState(false);

  if (profile.isOwner) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      isIconOnly
      isLoading={isForgetting}
      label={say('common.forgetName', { name: profile.name })}
      onClick={() => {
        setIsForgetting(true);
        void removeProfile(profile.id).then((isGone) => {
          setIsForgetting(false);

          if (!isGone) {
            notify.failed(say('common.thoseChangesWereNotSaved'));

            return;
          }

          onForgotten();
        });
      }}
    >
      <Icon of={BinIcon} size={16} />
    </Button>
  );
};

ForgetProfileButton.displayName = 'ForgetProfileButton';

export { ForgetProfileButton };
