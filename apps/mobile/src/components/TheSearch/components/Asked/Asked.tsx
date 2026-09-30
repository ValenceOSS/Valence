import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ARequest } from '@ValenceMobile/components/TheSearch/components/ARequest/ARequest';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AskedProps } from './Asked.types';
import { say } from '@ValenceI18n/say';

/**
 * Everything asked for — films, programmes, music and books — newest first, and where each has got
 * to.
 *
 * @param onAsk - Told which one somebody wants to see.
 */
const Asked = ({ onAsk }: AskedProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const who = useQuery(sessionQueries.who());
  const colours = useTheColours();
  const mine = requests.data ?? [];
  const progress = useQuery(
    requestsQueries.requestProgress(mine.some((request) => request.state === 'downloading')),
  );

  if (requests.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
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
      myId={who.data?.id ?? null}
      onAsk={onAsk}
    />
  ));
};

Asked.displayName = 'Asked';

export { Asked };
