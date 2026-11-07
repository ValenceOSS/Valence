import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { TitleForm } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/TitleForm/TitleForm';
import type { TitleDetailsProps } from './TitleDetails.types';
import { say } from '@ValenceI18n/say';

/**
 * A title's Details tab: reads the title's metadata, saying so while it does and why where it
 * cannot, then lays it out as one form whose fields save as they change.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param onShowHistory - Opens the title's history.
 * @param onFixMatch - Opens the dialog that fixes what the title is matched to, where it can be.
 * @param after - A section of the title's own to follow the metadata, such as its collections.
 */
const TitleDetails = ({ mediaId, scope, onShowHistory, onFixMatch, after }: TitleDetailsProps) => {
  const metadata = useQuery(adminQueries.titleMetadata(mediaId, scope));
  if (metadata.isPending) {
    return <Spinner isCentered size="sm" label={say('common.loading')} />;
  }

  if (metadata.isError) {
    return (
      <CouldNotRead
        said={say('screens.adminArea.titleDetails.theDetailsCouldNotBeRead')}
        why={metadata.error.message}
        onTryAgain={() => {
          void metadata.refetch();
        }}
        isTryingAgain={metadata.isFetching}
      />
    );
  }

  return (
    <TitleForm
      metadata={metadata.data}
      mediaId={mediaId}
      scope={scope}
      {...(onShowHistory === undefined ? {} : { onShowHistory })}
      {...(onFixMatch === undefined ? {} : { onFixMatch })}
      {...(after === undefined ? {} : { after })}
    />
  );
};

TitleDetails.displayName = 'TitleDetails';

export { TitleDetails };
