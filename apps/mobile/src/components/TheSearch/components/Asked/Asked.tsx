import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ARequest } from '@ValenceMobile/components/TheSearch/components/ARequest/ARequest';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AskedProps } from './Asked.types';

/**
 * The films and programmes asked for, newest first, and where each has got to.
 *
 * @param onAsk - Told which one somebody wants to see.
 */
const Asked = ({ onAsk }: AskedProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const who = useQuery(sessionQueries.who());
  const colours = useTheColours();
  const mine = (requests.data ?? []).filter((request) => whatAPhoneAsksFor(request.kind));
  const progress = useQuery(
    requestsQueries.requestProgress(mine.some((request) => request.state === 'downloading')),
  );

  if (requests.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (requests.isError) {
    return <Words tone="danger">Those could not be read.</Words>;
  }

  if (mine.length === 0) {
    return <Words tone="muted">Nothing asked for yet.</Words>;
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
