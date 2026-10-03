import { Badge } from '@ValenceUI/Badge';
import { StatStrip } from '@ValenceUI/StatStrip';
import type {
  MediaImportCounts,
  MediaImportReportPerson,
} from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { ImportReportViewProps } from './ImportReportView.types';

/**
 * The numbers of an import, each as a tile.
 *
 * @param counts - The counts.
 * @returns The tiles.
 */
const tilesOf = (counts: MediaImportCounts) => [
  { id: 'people', label: say('common.people'), value: counts.people },
  { id: 'libraries', label: say('common.libraries'), value: counts.libraries },
  {
    id: 'matched',
    label: say('screens.importWizard.importReportView.matched'),
    value: say('screens.importWizard.importReportView.matchedOfItems', {
      matched: counts.matched.toString(),
      items: counts.items.toString(),
    }),
  },
  { id: 'watched', label: say('common.watched'), value: counts.watched },
  { id: 'resumes', label: say('common.inProgress'), value: counts.resumes },
  { id: 'plays', label: say('screens.importWizard.importReportView.plays'), value: counts.plays },
  { id: 'favourites', label: say('common.favourites'), value: counts.favourites },
  { id: 'ratings', label: say('screens.ratingPanel.ratings'), value: counts.ratings },
  { id: 'playlists', label: say('common.playlists'), value: counts.playlists },
  { id: 'collections', label: say('common.collections'), value: counts.collections },
  {
    id: 'markers',
    label: say('screens.importWizard.importReportView.markers'),
    value: counts.markers,
  },
];

/**
 * What one person gets, in a sentence.
 *
 * @param person - The person.
 * @returns What they get.
 */
const whatTheyGet = (person: MediaImportReportPerson): string =>
  say('screens.importWizard.importReportView.watchedResumesPlaysFavouritesRatingsPlaylists', {
    watched: person.watched.toString(),
    resumes: person.resumes.toString(),
    plays: person.plays.toString(),
    favourites: person.favourites.toString(),
    ratings: person.ratings.toString(),
    playlists: person.playlists.toString(),
  });

/**
 * What a person may see once they are across.
 *
 * @param person - The person.
 * @returns Their libraries and age ceiling, in words.
 */
const whatTheyMaySee = (person: MediaImportReportPerson): string => {
  const libraries =
    person.libraries === null
      ? say('common.everyLibrary2')
      : sayCount('common.count.libraries', person.libraries);

  return person.maximumAge === null
    ? libraries
    : say('screens.importWizard.importReportView.librariesUpToAge', {
        libraries,
        age: person.maximumAge.toString(),
      });
};

/**
 * The report of an import's dry run, and of the import once it is done: how much of everything,
 * who each person is and what they will get, what could not be matched and why, and what stays
 * behind.
 *
 * @param report - The report.
 */
const ImportReportView = ({ report }: ImportReportViewProps) => (
  <div className="flex flex-col gap-6">
    <StatStrip
      label={say('screens.importWizard.importReportView.whatComesAcross')}
      items={tilesOf(report.counts)}
    />

    {report.written === null ? null : (
      <StatStrip
        label={say('screens.importWizard.importReportView.whatWasWritten')}
        items={tilesOf(report.written)}
      />
    )}

    <PanelCard title={say('common.people')}>
      <ul className="flex flex-col gap-3">
        {report.people.map((person) => (
          <li key={person.sourceUserId} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
              {person.name}

              {person.isYou ? (
                <Badge size="sm" tone="accent">
                  {say('screens.ratingPanel.you')}
                </Badge>
              ) : null}

              {person.isAdministrator ? (
                <Badge size="sm" tone="quiet">
                  {say('common.administrator')}
                </Badge>
              ) : null}

              {person.outcome === 'failed' ? (
                <Badge size="sm" tone="danger">
                  {say('screens.importWizard.importReportView.couldNotBeBroughtAcross')}
                </Badge>
              ) : null}
            </span>

            {person.skipped === null ? (
              <>
                <span className="text-xs text-text-muted">{whatTheyGet(person)}</span>
                <span className="text-xs text-text-muted">{whatTheyMaySee(person)}</span>
              </>
            ) : (
              <span className="text-xs text-text-muted">{sayAgain(person.skipped)}</span>
            )}
          </li>
        ))}
      </ul>
    </PanelCard>

    {report.unmatchedTotal === 0 ? null : (
      <PanelCard title={say('screens.importWizard.importReportView.notMatched')}>
        <ul className="flex flex-col gap-2">
          {report.unmatched.map((item, index) => (
            <li key={`${item.title}-${index.toString()}`} className="flex flex-col">
              <span className="text-sm text-text">
                {item.year === null
                  ? item.title
                  : say('screens.importWizard.importReportView.titleYear', {
                      title: item.title,
                      year: item.year.toString(),
                    })}
              </span>
              <span className="text-xs text-text-muted">{sayAgain(item.reason)}</span>
            </li>
          ))}
        </ul>

        {report.unmatchedTotal > report.unmatched.length ? (
          <p className="mt-3 text-sm text-text-muted">
            {sayCount(
              'screens.importWizard.importReportView.andCountMore',
              report.unmatchedTotal - report.unmatched.length,
            )}
          </p>
        ) : null}
      </PanelCard>
    )}

    <PanelCard title={say('screens.importWizard.arrImportStep.notBroughtAcross')}>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-text-muted">
        {report.notBroughtAcross.map((said) => (
          <li key={said.message}>{sayAgain(said)}</li>
        ))}
      </ul>
    </PanelCard>
  </div>
);

ImportReportView.displayName = 'ImportReportView';

export { ImportReportView };
