import { useQuery } from '@tanstack/react-query';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

/**
 * Whether whoever is looking may play a film straight from a source: the server plays films from
 * sources, their role lets them, and a plugin that is turned on offers a source. A film is played
 * from its page in the catalogue, which only somebody who may ask for films can open, so their
 * role must let them do that too. With none of that, nothing anywhere offers it.
 *
 * @returns Whether they may.
 */
const useMayStream = (): boolean => {
  const { may } = useWhatIMayDo();
  const isServed = useServerHas('streams.fromSources') === true;
  const isAllowed = may('sources.play') && may('requests.ask');
  const sources = useQuery({
    ...pluginQueries.contributions(),
    enabled: isServed && isAllowed,
    select: (offered) => offered.sources.length,
  });

  return isServed && isAllowed && (sources.data ?? 0) > 0;
};

export { useMayStream };
