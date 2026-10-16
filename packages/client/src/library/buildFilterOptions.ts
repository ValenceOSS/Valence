import type { LibraryFacets } from '@ValenceContracts/schemas/Library';
import type { FilterOption } from '@ValenceClient/library/buildFilterOptions.types';
import {
  describeChannels,
  describeLanguage,
  readLanguage,
} from '@ValenceCore/functions/describeTrack';
import { describeAudioCodec } from '@ValenceClient/library/describeAudioCodec';
import { say } from '@ValenceI18n/say';

const RATING_FLOORS = [6, 7, 8, 9];

const YOUR_STAR_FLOORS = [3, 4, 5];

/**
 * Gathers the spellings of each language the files use under one chip, named in its own words.
 *
 * @param spellings - The language tags held, as the files wrote them.
 * @returns One chip per language, whose value is every spelling of it joined by `+`.
 */
const spellingsByLanguage = (spellings: readonly string[]): FilterOption[] => {
  const byCode = new Map<string, string[]>();

  for (const spelling of spellings) {
    const code = readLanguage(spelling);

    if (code !== null) {
      byCode.set(code, [...(byCode.get(code) ?? []), spelling]);
    }
  }

  return [...byCode.entries()]
    .map(([code, spelt]) => ({
      value: spelt.join('+'),
      label: describeLanguage(code) ?? code.toUpperCase(),
    }))
    .sort((one, other) => one.label.localeCompare(other.label));
};

/**
 * Builds everything the filter rows offer from what the libraries actually hold, so a chip whose only
 * possible outcome is an empty page is never drawn. Kept apart from the page that draws them, so the
 * wording of a chip — and the decision not to offer one — can be read and tested without rendering a
 * search page.
 *
 * The exception is what this viewer gave something, which is offered whatever the libraries hold:
 * the server knows what everyone rated but the facets describe the catalogue, and a viewer who has
 * rated nothing is exactly who a row of their own ratings is useless to — which the empty page they
 * get tells them more plainly than a missing chip would.
 *
 * Audio languages are offered once each however many ways the files spell them, so English tagged
 * `en` in one file and `eng` in another is one chip asking for either.
 *
 * @param facets - What the server says there is to filter by.
 * @returns The chips for each row.
 */
const buildFilterOptions = (
  facets: LibraryFacets,
): {
  genres: FilterOption[];
  decades: FilterOption[];
  ratings: FilterOption[];
  yourStars: FilterOption[];
  audioLanguages: FilterOption[];
  audioCodecs: FilterOption[];
  audioChannels: FilterOption[];
} => ({
  genres: facets.genres.map((genre) => ({ value: genre, label: genre })),
  decades: facets.decades.map((decade) => ({
    value: decade.toString(),
    label: say('client.library.buildFilterOptions.decadeS', { decade: decade.toString() }),
  })),
  ratings: RATING_FLOORS.filter((floor) => facets.maxRating >= floor).map((floor) => ({
    value: floor.toString(),
    label: `${floor.toString()}+`,
  })),
  yourStars: YOUR_STAR_FLOORS.map((floor) => ({
    value: floor.toString(),
    label: `${floor.toString()}★+`,
  })),
  audioLanguages: spellingsByLanguage(facets.audioLanguages),
  audioCodecs: facets.audioCodecs.map((codec) => ({
    value: codec,
    label: describeAudioCodec(codec),
  })),
  audioChannels: facets.audioChannels.map((channels) => ({
    value: channels.toString(),
    label: describeChannels(channels),
  })),
});

export { buildFilterOptions };
