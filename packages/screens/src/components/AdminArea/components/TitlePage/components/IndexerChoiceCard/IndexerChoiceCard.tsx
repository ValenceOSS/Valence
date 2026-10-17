import { PanelCard } from '@ValenceUI/PanelCard';
import { AskerPicker } from '@ValenceScreens/components/AdminArea/components/AskerPicker/AskerPicker';
import type { IndexerChoiceCardProps } from './IndexerChoiceCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Which indexers a title is searched on, on its title page: whichever its library uses, or only the
 * ones chosen for it here, each saying whether its library would have used it anyway.
 *
 * @param indexers - Every indexer there is.
 * @param libraryId - The library the title is asked for into.
 * @param chosen - The indexers chosen for it, or null for whichever its library uses.
 * @param onChange - Told the indexers chosen, or null to go back to its library's.
 */
const IndexerChoiceCard = ({ indexers, libraryId, chosen, onChange }: IndexerChoiceCardProps) => (
  <PanelCard title={say('common.indexers')}>
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        {say('screens.adminArea.titlePage.indexerChoiceCard.searchedOnWhicheverItsLibraryUses')}
      </p>

      <AskerPicker
        legend={say('common.indexers')}
        everyLabel={say('screens.adminArea.titlePage.indexerChoiceCard.asItsLibraryChooses')}
        askers={indexers.map((indexer) => ({
          id: indexer.id,
          name: indexer.name,
          detail:
            indexer.libraryIds.length === 0
              ? say('common.everyLibrary2')
              : indexer.libraryIds.includes(libraryId)
                ? say('screens.adminArea.titlePage.indexerChoiceCard.usedForThisLibrary')
                : say('screens.adminArea.titlePage.indexerChoiceCard.notUsedForThisLibrary'),
        }))}
        chosen={new Set(chosen ?? [])}
        onChange={(next) => {
          onChange(next.size === 0 ? null : [...next]);
        }}
      />
    </div>
  </PanelCard>
);

IndexerChoiceCard.displayName = 'IndexerChoiceCard';

export { IndexerChoiceCard };
