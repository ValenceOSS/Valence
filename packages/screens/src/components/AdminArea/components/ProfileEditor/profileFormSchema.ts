import { z } from 'zod';
import type { QualityProfileDraft } from '@ValenceContracts/schemas/QualityProfile';
import { sizeOf } from './sizeOf';
import { wordsOf } from './wordsOf';
import { scoreOf } from './scoreOf';
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

    if (form.formats.some((format) => format.name.trim() === '')) {
      context.addIssue({
        code: 'custom',
        path: ['formats'],
        message: say('screens.profileEditor.readProfileForm.nameEveryFormat'),
      });
    }

    if (
      form.formats.some((format) =>
        format.conditions.some((condition) => condition.value.trim() === ''),
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['formats'],
        message: say('screens.profileEditor.readProfileForm.giveEveryConditionAValue'),
      });
    }

    if (
      form.formats.some((format) => typeof scoreOf(format.score) !== 'number') ||
      scoreOf(form.minFormatScore) === undefined ||
      scoreOf(form.upgradeUntilFormatScore) === undefined
    ) {
      context.addIssue({
        code: 'custom',
        path: ['formats'],
        message: say('screens.profileEditor.readProfileForm.scoresAreWholeNumbers'),
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
      formats: form.formats.map((format) => ({
        name: format.name.trim(),
        score: scoreOf(format.score) ?? 0,
        conditions: format.conditions.map((condition) => ({
          ...condition,
          value: condition.value.trim(),
        })),
      })),
      minFormatScore: scoreOf(form.minFormatScore) ?? 0,
      upgradeUntilFormatScore: form.isUpgrading
        ? (scoreOf(form.upgradeUntilFormatScore) ?? null)
        : null,
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
