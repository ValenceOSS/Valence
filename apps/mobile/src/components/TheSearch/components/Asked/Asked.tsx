import { useMe } from '@ValenceClient/requests/useMe';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { isAskedFor } from '@ValenceContracts/functions/isAskedFor';

import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ARequest } from '@ValenceMobile/components/TheSearch/components/ARequest/ARequest';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AskedProps } from './Asked.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const NOBODY: readonly ViewerProfile[] = [];

/**
 * Everything asked for — films, programmes, music and books — newest first, each on a card saying
 * where it has got to and with the faces of whoever asked for it.
 *
 * @param onAsk - Told which one somebody wants to see.
 */
const Asked = ({ onAsk }: AskedProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const me = useMe();
  const everyone = useQuery(profileQueries.everyone());
  const colours = useTheColours();
  const mine = (requests.data ?? []).filter(isAskedFor);
  const progress = useQuery(
    requestsQueries.requestProgress(mine.some((request) => request.state === 'downloading')),
  );

  if (requests.isPending) {
    return <ASpinner colour={colours.textMuted} />;
  }

  if (requests.isError) {
    return <Words tone="danger">{say('common.thoseCouldNotBeRead')}</Words>;
  }

  if (mine.length === 0) {
    return <Words tone="muted">{say('phone.theSearch.asked.nothingAskedForYet')}</Words>;
  }

  return mine.map((request) => (
    <ARequest
      key={request.id}
      request={request}
      progress={progress.data ?? []}
      me={me}
      faces={everyone.data ?? NOBODY}
      onAsk={onAsk}
    />
  ));
};

Asked.displayName = 'Asked';

export { Asked };
