import { useQuery } from '@tanstack/react-query';
import { Layers as LayersIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { PartOfCollectionsProps } from './PartOfCollections.types';
import { say } from '@ValenceI18n/say';

/**
 * The collections a film or programme belongs to, each leading to its collection, so somebody who
 * finished the second film of a saga can find the third from the page about the second. Says
 * nothing where it belongs to none.
 *
 * @param subject - The film or programme, or null while there is none.
 */
const PartOfCollections = ({ subject }: PartOfCollectionsProps) => {
  const { go } = usePlace();
  const asked = useQuery({
    ...collectionQueries.containing(subject ?? { mediaItemId: '' }),
    enabled: subject !== null,
  });
  const collections = subject === null ? [] : (asked.data ?? []);

  if (collections.length === 0) {
    return null;
  }

  return (
    <DialogSection heading={say('screens.partOfCollections.partOf')}>
      <span className="flex flex-wrap gap-2">
        {collections.map((collection) => (
          <Button
            key={collection.id}
            variant="secondary"
            size="sm"
            onClick={() => {
              go({ collection: collection.id, inspecting: null, show: null });
            }}
          >
            <Icon of={LayersIcon} size={16} />
            {collection.name}
          </Button>
        ))}
      </span>
    </DialogSection>
  );
};

PartOfCollections.displayName = 'PartOfCollections';

export { PartOfCollections };
