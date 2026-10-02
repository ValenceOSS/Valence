import { useState } from 'react';
import { Key as KeyIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { registerPasskey } from '@ValenceClient/session/auth';
import { say } from '@ValenceI18n/say';
import { describePasskeyUnavailability } from '@ValenceScreens/passkeys/isPasskeySupported';
import type { PasskeyOfferProps } from './PasskeyOffer.types';

/**
 * The offer of a passkey for the account signed in: what to call it and a way to make it, or why
 * this device cannot, or that one has just been made.
 *
 * @param onMade - Told once a passkey is made.
 * @param className - Extra classes for the caller's own layout.
 */
const PasskeyOffer = ({ onMade, className }: PasskeyOfferProps) => {
  const [name, setName] = useState(say('common.thisDevice'));
  const [isMaking, setIsMaking] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const noPasskeys = describePasskeyUnavailability();

  const make = async (): Promise<void> => {
    setIsMaking(true);

    const outcome = await registerPasskey(name.trim() === '' ? say('common.thisDevice') : name);

    setIsMaking(false);

    if (outcome.kind === 'registered') {
      setHasPasskey(true);
      setWrong(null);
      onMade?.();

      return;
    }

    setWrong(
      outcome.kind === 'cancelled'
        ? null
        : outcome.kind === 'unconfirmed'
          ? say('screens.householdOnboarding.youSignedInAWhileAgo')
          : outcome.reason,
    );
  };

  if (noPasskeys !== null) {
    return <p className={cn('text-sm text-text-muted', className)}>{noPasskeys}</p>;
  }

  if (hasPasskey) {
    return (
      <p className={cn('text-sm text-text', className)}>
        {say('screens.householdOnboarding.thatIsSetYouCanSign')}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <TextField
        label={say('common.passkeyName')}
        value={name}
        onValueChange={setName}
        description={say('screens.householdOnboarding.somethingYouWillRecogniseLaterSuch')}
        descriptionPlacement="below"
        {...(wrong === null ? {} : { error: wrong })}
      />

      <Button
        variant="secondary"
        size="lg"
        isLoading={isMaking}
        onClick={() => {
          void make();
        }}
      >
        <Icon of={KeyIcon} size={18} />
        {say('common.addAPasskey')}
      </Button>
    </div>
  );
};

PasskeyOffer.displayName = 'PasskeyOffer';

export { PasskeyOffer };
