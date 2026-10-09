import { z } from 'zod';
import type { QualityProfileDraft } from '@ValenceContracts/schemas/QualityProfile';
import { sizeOf } from './sizeOf';
import { wordsOf } from './wordsOf';
import type { ProfileForm } from './readProfileForm';
import { say } from '@ValenceI18n/say';

const profileFormSchema = z
  .custom<ProfileForm>(() => true)
  .superRefine((form, context) => {
    const smallestMb = sizeOf(form.smallestMb);
    const largestMb = sizeOf(form.largestMb);
    const isMusic = form.kind === 'music';

    if (form.name.trim() === '') {
      context.addIssue({
        code: 'custom',
        path: ['name'],
        message: say('screens.profileEditor.readProfileForm.giveTheProfileAName'),
      });
    }

    if (!isMusic && form.qualities.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['qualities'],
        message: say('screens.profileEditor.readProfileForm.allowAtLeastOneQuality'),
      });
    }

    if (isMusic && form.musicQualities.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['musicQualities'],
        message: say('screens.profileEditor.readProfileForm.allowAtLeastOneFormat'),
      });
    }

    if (isMusic && (smallestMb === undefined || largestMb === undefined || largestMb === 0)) {
      context.addIssue({
        code: 'custom',
        path: ['largestMb'],
        message: say('screens.profileEditor.readProfileForm.aSizeIsANumberOf'),
      });
    } else if (
      isMusic &&
      smallestMb !== null &&
      smallestMb !== undefined &&
      largestMb !== null &&
      largestMb !== undefined &&
      largestMb <= smallestMb
    ) {
      context.addIssue({
        code: 'custom',
        path: ['largestMb'],
        message: say('screens.profileEditor.readProfileForm.theLargestSizeHasToBe'),
      });
    }
  })
  .transform((form): QualityProfileDraft => {
    const isMusic = form.kind === 'music';

    return {
      name: form.name.trim(),
      kind: form.kind,
      qualities: form.qualities,
      musicQualities: form.musicQualities,
      smallestMb: isMusic ? (sizeOf(form.smallestMb) ?? null) : null,
      largestMb: isMusic ? (sizeOf(form.largestMb) ?? null) : null,
      sizes: form.sizes,
      releaseWait: form.releaseWait,
      preferredWords: wordsOf(form.preferredWords),
      requiredWords: wordsOf(form.requiredWords),
      bannedWords: wordsOf(form.bannedWords),
      isUpgrading: form.isUpgrading,
      cutoff:
        form.isUpgrading && form.cutoff !== null && form.qualities.includes(form.cutoff)
          ? form.cutoff
          : null,
      upgradeUntilMusicQuality: form.isUpgrading ? form.upgradeUntilMusicQuality : null,
      libraryIds: form.libraryIds,
      preferredLanguage: form.preferredLanguage,
      isDefault: form.isDefault,
      roleIds: form.isDefault ? [] : form.roleIds,
      accountIds: form.isDefault ? [] : form.accountIds,
    };
  });

export { profileFormSchema };
