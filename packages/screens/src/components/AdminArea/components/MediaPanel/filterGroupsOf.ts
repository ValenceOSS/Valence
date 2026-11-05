import { describeRange } from '@ValenceClient/library/describeRange';
import type { TitleChoices, TitleFilterKind } from '@ValenceContracts/schemas/TitleList';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import { say } from '@ValenceI18n/say';

const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930];

/**
 * The filters Media's list can be narrowed by, each option named by the filter the server reads,
 * such as `genre:Drama`: what a title is missing, its resolution, HDR and video codec, its genres,
 * tags, decade and content rating as the library has them, how recently it was added, and whether it
 * carries subtitles. A filter the library has no values for is left out.
 *
 * @param choices - The values the library's titles have, or nothing before the server has said.
 * @param hasShows - Whether the library can hold shows, without which no title misses episodes.
 * @returns The groups of filters.
 */
const filterGroupsOf = (choices: TitleChoices | undefined, hasShows = true): FilterGroup[] => {
  const valuesOf = (kind: TitleFilterKind) =>
    choices?.filters.find((one) => one.kind === kind)?.values.map((one) => one.value) ?? [];
  const optionsOf = (
    kind: TitleFilterKind,
    labelOf: (value: string) => string = (value) => value,
  ) => valuesOf(kind).map((value) => ({ id: `${kind}:${value}`, label: labelOf(value) }));

  return [
    {
      name: say('client.requests.titleStatusNames.missing'),
      options: [
        { id: 'missing:overview', label: say('screens.adminArea.adminSections.overview') },
        { id: 'missing:poster', label: say('screens.adminArea.artworkPicker.poster') },
        { id: 'missing:backdrop', label: say('screens.adminArea.artworkPicker.backdrop') },
        { id: 'missing:logo', label: say('screens.adminArea.artworkPicker.logo') },
        ...(hasShows ? [{ id: 'missing:episodes', label: say('common.episodes') }] : []),
      ],
    },
    { name: say('common.resolution'), options: optionsOf('resolution') },
    {
      name: say('screens.profileEditor.customFormats.hdr'),
      options: optionsOf('range', (value) => describeRange(value) ?? value),
    },
    {
      name: say('screens.profileEditor.customFormats.videoCodec'),
      options: optionsOf('codec', (value) => value.toUpperCase()),
    },
    { name: say('common.genres'), options: optionsOf('genre') },
    { name: say('screens.adminArea.titleDetails.tags'), options: optionsOf('tag') },
    {
      name: say('common.year'),
      options: DECADES.map((decade) => ({
        id: `year:${decade.toString()}-${(decade + 9).toString()}`,
        label: say('client.library.buildFilterOptions.decadeS', { decade: decade.toString() }),
      })),
    },
    { name: say('screens.adminArea.titleDetails.contentRating'), options: optionsOf('rating') },
    {
      name: say('common.added'),
      isSingle: true,
      options: [
        { id: 'added:7', label: say('client.admin.logRanges.last7Days') },
        { id: 'added:30', label: say('screens.adminArea.statisticsRangeChoice.last30Days') },
        { id: 'added:90', label: say('screens.adminArea.statisticsRangeChoice.last90Days') },
        { id: 'added:365', label: say('screens.adminArea.statisticsRangeChoice.lastYear') },
      ],
    },
    {
      name: say('common.subtitles'),
      isSingle: true,
      options: [
        { id: 'subtitles:yes', label: say('screens.adminArea.mediaPanel.hasSubtitles') },
        { id: 'subtitles:no', label: say('screens.adminArea.mediaPanel.noSubtitles') },
      ],
    },
  ].filter((group) => group.options.length > 0);
};

export { filterGroupsOf };
