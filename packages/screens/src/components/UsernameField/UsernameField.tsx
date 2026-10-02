import { useEffect, useState } from 'react';
import { TextField } from '@ValenceUI/TextField';
import { isUsernameAvailable } from '@ValenceClient/admin/isUsernameAvailable';
import { UsernameSchema } from '@ValenceContracts/schemas/SetupLink';
import { MAXIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MAXIMUM_USERNAME_LENGTH';
import { MINIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MINIMUM_USERNAME_LENGTH';
import { say } from '@ValenceI18n/say';
import type { UsernameFieldProps } from './UsernameField.types';

type Checked = { username: string; isAvailable: boolean | null };

const PAUSE_MILLISECONDS = 300;

/**
 * A username, checked as it is typed: whether it is one a username may be, and once it is, whether
 * somebody else already holds it. The account's own username is always free to it.
 *
 * @param value - The username typed.
 * @param onValueChange - Told as it changes.
 * @param userId - The account it is for, when there is one already.
 * @param current - The username the account holds now.
 * @param isOptional - Whether it may be left empty.
 * @param checksAvailability - Whether to ask the server if it is free, which nothing can be asked
 *   before there is an administrator to ask as.
 * @param autoComplete - What a browser may fill it with, which is nothing unless the account is the
 *   browser's own.
 * @param problem - What is wrong that only the form can know, such as it being left empty.
 * @param descriptionPlacement - Where its explanation sits, as a text field places one.
 * @param className - Where it sits.
 */
const UsernameField = ({
  value,
  onValueChange,
  userId,
  current = null,
  isOptional = false,
  checksAvailability = true,
  autoComplete = 'off',
  problem,
  descriptionPlacement,
  className,
}: UsernameFieldProps) => {
  const [checked, setChecked] = useState<Checked | null>(null);
  const wanted = value.trim();
  const isUnchanged = current !== null && wanted.toLowerCase() === current.toLowerCase();
  const isWellFormed = UsernameSchema.safeParse(wanted).success;

  useEffect(() => {
    if (!checksAvailability || wanted === '' || isUnchanged || !isWellFormed) {
      return;
    }

    let isStale = false;
    const timer = setTimeout(() => {
      void isUsernameAvailable(wanted, userId).then((isAvailable) => {
        if (!isStale) {
          setChecked({ username: wanted, isAvailable });
        }
      });
    }, PAUSE_MILLISECONDS);

    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [checksAvailability, wanted, userId, isUnchanged, isWellFormed]);

  const rule = say('screens.usernameField.lettersDigitsDotsAndUnderscores', {
    least: MINIMUM_USERNAME_LENGTH,
    most: MAXIMUM_USERNAME_LENGTH,
  });
  const answer = checked?.username === wanted ? checked.isAvailable : null;
  const error =
    wanted === '' && problem !== undefined
      ? problem
      : wanted === '' || isUnchanged
        ? undefined
        : !isWellFormed
          ? rule
          : answer === false
            ? say('error.account.thatUsernameIsAlreadyInUse')
            : undefined;
  const description =
    wanted !== '' && !isUnchanged && isWellFormed && answer === true
      ? say('screens.usernameField.thatUsernameIsFree')
      : rule;

  return (
    <TextField
      label={isOptional ? say('screens.usernameField.usernameOptional') : say('common.username')}
      value={value}
      onValueChange={onValueChange}
      autoComplete={autoComplete}
      {...(error === undefined ? { description } : { error })}
      {...(descriptionPlacement === undefined ? {} : { descriptionPlacement })}
      {...(className === undefined ? {} : { className })}
    />
  );
};

UsernameField.displayName = 'UsernameField';

export { UsernameField };
