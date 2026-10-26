import { useEffect, useRef } from 'react';
import { TwoFactorChallenge } from '@ValenceScreens/components/TwoFactorChallenge/TwoFactorChallenge';
import { ShowcaseScope } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseScope/ShowcaseScope';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { AuthPictureProps } from './AuthPicture.types';

/**
 * Types into a field the way a person does, so the component holding it hears the change.
 *
 * @param field - The field to type into.
 * @param text - Everything typed so far.
 */
const typeInto = (field: HTMLInputElement, text: string) => {
  if (field.value === text) {
    return;
  }

  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(field, text);
  field.dispatchEvent(new Event('input', { bubbles: true }));
};

/**
 * The app's own two-factor step on the way in, with a code being typed into it from an authenticator.
 *
 * @param typed - How much of the code has been typed so far.
 */
const AuthPicture = ({ typed = '' }: AuthPictureProps) => {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = holder.current?.querySelector('input');

    if (field !== null && field !== undefined) {
      typeInto(field, typed);
    }
  }, [typed]);

  return (
    <div
      ref={holder}
      className="valence-float flex h-[19rem] w-[17.5rem] flex-col gap-4 rounded-xl p-6"
    >
      <ShowcaseScope>
        <TwoFactorChallenge onVerified={nothing} />
      </ShowcaseScope>
    </div>
  );
};

AuthPicture.displayName = 'AuthPicture';

export { AuthPicture };
