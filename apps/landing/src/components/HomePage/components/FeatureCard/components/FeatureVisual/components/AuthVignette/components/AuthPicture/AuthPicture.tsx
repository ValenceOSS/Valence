import { CircleCheck as CircleCheckIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

/**
 * The sign in asking for its code from an authenticator; pointed at, the code is typed in and the sign in goes through.
 */
const AuthPicture = () => (
  <div className="valence-float flex w-full max-w-[calc(var(--vignette-width)*0.85)] flex-col gap-4 rounded-xl p-5">
    <p className="text-center text-sm text-text-muted">
      Enter the current code from your authenticator app.
    </p>

    <Swap
      className="w-full"
      from={
        <TextField
          label="Authenticator code"
          size="lg"
          value=""
          placeholder="123456"
          onValueChange={nothing}
        />
      }
      to={<TextField label="Authenticator code" size="lg" value="481073" onValueChange={nothing} />}
    />

    <Swap
      delay={500}
      className="w-full"
      from={
        <Button variant="glossy" size="lg" className="w-full" onClick={nothing}>
          Verify
        </Button>
      }
      to={
        <Button variant="confirm" size="lg" className="w-full" onClick={nothing}>
          <Icon of={CircleCheckIcon} size={16} />
          Signed in as Maya
        </Button>
      }
    />

    <Button variant="ghost" size="sm" onClick={nothing}>
      Use a passkey instead
    </Button>
  </div>
);

AuthPicture.displayName = 'AuthPicture';

export { AuthPicture };
