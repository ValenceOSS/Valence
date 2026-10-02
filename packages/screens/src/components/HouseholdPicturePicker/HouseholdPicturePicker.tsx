import { useState } from 'react';
import { Image as ImageIcon } from '@keyline-icons/react';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { uploadHouseholdPhoto } from '@ValenceClient/household/fetchHousehold';
import { say } from '@ValenceI18n/say';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import type { HouseholdPicturePickerProps } from './HouseholdPicturePicker.types';

const PICTURE_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

/**
 * The household's picture: its face as it stands, and a way to choose another, sent as soon as it
 * is chosen and shown in place once the server has it.
 *
 * @param household - The household.
 * @param picture - The picture chosen here, where one has been.
 * @param onPicked - Told the picture once the server has it.
 * @param className - Extra classes for the caller's own layout.
 */
const HouseholdPicturePicker = ({
  household,
  picture,
  onPicked,
  className,
}: HouseholdPicturePickerProps) => {
  const [isSending, setIsSending] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);

  const keep = async (chosen: File): Promise<void> => {
    setIsSending(true);

    const said = await uploadHouseholdPhoto(chosen);

    setIsSending(false);
    setWrong(said);

    if (said === null) {
      onPicked(chosen);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <HouseholdFace household={household} pending={picture} className="size-24 text-3xl" />

      {wrong === null ? null : (
        <p role="alert" className="text-center text-sm text-danger">
          {wrong}
        </p>
      )}

      <FilePicker
        label={say('common.chooseAPicture')}
        accept={PICTURE_TYPES}
        variant="secondary"
        size="lg"
        isLoading={isSending}
        isActive={picture !== null}
        className="w-full"
        onPick={(chosen) => {
          void keep(chosen);
        }}
      >
        <Icon of={ImageIcon} size={18} />
        {picture === null
          ? say('common.chooseAPicture')
          : say('screens.householdOnboarding.pickAnother')}
      </FilePicker>
    </div>
  );
};

HouseholdPicturePicker.displayName = 'HouseholdPicturePicker';

export { HouseholdPicturePicker };
