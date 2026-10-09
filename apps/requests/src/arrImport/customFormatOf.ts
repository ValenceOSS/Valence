import { fieldsOf } from '@ValenceRequests/arrImport/fieldsOf';
import { termAsWord } from '@ValenceRequests/arrImport/termAsWord';
import type { CustomFormat, FormatCondition } from '@ValenceContracts/schemas/QualityProfile';
import type { FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { ArrCustomFormat } from '@ValenceRequests/arrImport/schemas/ArrCustomFormatSchema';

type Specification = ArrCustomFormat['specifications'][number];

const RADARR_SOURCES: Readonly<Record<number, string>> = {
  1: 'cam',
  2: 'telesync',
  3: 'telesync',
  5: 'dvd',
  6: 'hdtv',
  7: 'webdl',
  8: 'webrip',
  9: 'bluray',
};

const SONARR_SOURCES: Readonly<Record<number, string>> = {
  1: 'hdtv',
  2: 'hdtv',
  3: 'webdl',
  4: 'webrip',
  5: 'dvd',
  6: 'bluray',
  7: 'bluray',
};

const RESOLUTIONS = new Set([2160, 1080, 720, 576, 480]);

const REMUX = 5;

const LANGUAGES: Readonly<Record<number, string>> = {
  1: 'en',
  2: 'fr',
  3: 'es',
  4: 'de',
  5: 'it',
  6: 'da',
  7: 'nl',
  8: 'ja',
  10: 'zh',
  11: 'ru',
  12: 'pl',
  14: 'sv',
  15: 'no',
  16: 'fi',
  17: 'tr',
  18: 'pt',
  20: 'el',
  21: 'ko',
  22: 'hu',
  23: 'he',
  25: 'cs',
};

/**
 * What one of a custom format's specifications judges, as a Valence format's condition: a word or
 * a group from its name, a source, a resolution, a remux, a language or a size; nothing where
 * Valence judges no such thing.
 *
 * @param specification - The specification.
 * @param app - Which app it is from, since Radarr and Sonarr number sources differently.
 * @returns The condition's kind and value, or null.
 */
const conditionOf = (
  specification: Specification,
  app: FulfillingArrAppKind,
): Pick<FormatCondition, 'kind' | 'value'> | null => {
  const fields = fieldsOf(specification.fields);
  const number = fields.number('value');

  switch (specification.implementation) {
    case 'ReleaseTitleSpecification': {
      const word = termAsWord(fields.text('value'), true);

      return word === null ? null : { kind: 'words', value: word };
    }
    case 'ReleaseGroupSpecification': {
      const group = termAsWord(fields.text('value'), true);

      return group === null ? null : { kind: 'group', value: group };
    }
    case 'SourceSpecification': {
      const source =
        number === null ? undefined : (app === 'sonarr' ? SONARR_SOURCES : RADARR_SOURCES)[number];

      return source === undefined ? null : { kind: 'source', value: source };
    }
    case 'ResolutionSpecification':
      return number !== null && RESOLUTIONS.has(number)
        ? { kind: 'resolution', value: `${number.toString()}p` }
        : null;
    case 'QualityModifierSpecification':
      return number === REMUX ? { kind: 'source', value: 'remux' } : null;
    case 'LanguageSpecification': {
      const language = number === null ? undefined : LANGUAGES[number];

      return language === undefined ? null : { kind: 'language', value: language };
    }
    case 'SizeSpecification': {
      const least = fields.number('min');
      const most = fields.number('max');

      return least === null && most === null
        ? null
        : { kind: 'size', value: `${least?.toString() ?? ''}-${most?.toString() ?? ''}` };
    }
    default:
      return null;
  }
};

/**
 * A Radarr or Sonarr custom format as a Valence one, scored as the profile scores it: each of its
 * specifications as a condition, negated and required as it was. Approximate where a specification
 * had no match and was left out; nothing where none matched.
 *
 * @param format - The custom format.
 * @param score - What the profile scores it.
 * @param app - Which app it is from.
 * @returns The format and whether it only approximates the app's, or null.
 */
const customFormatOf = (
  format: ArrCustomFormat,
  score: number,
  app: FulfillingArrAppKind,
): { format: CustomFormat; isApproximate: boolean } | null => {
  const conditions = format.specifications.flatMap((specification) => {
    const condition = conditionOf(specification, app);

    return condition === null
      ? []
      : [{ ...condition, isNegated: specification.negate, isRequired: specification.required }];
  });

  const name = format.name.trim().slice(0, 80);

  if (conditions.length === 0 || name === '') {
    return null;
  }

  return {
    format: { name, score, conditions: conditions.slice(0, 20) },
    isApproximate: conditions.length < format.specifications.length,
  };
};

export { customFormatOf };
