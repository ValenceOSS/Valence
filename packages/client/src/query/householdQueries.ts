import { queryOptions } from '@tanstack/react-query';
import { fetchOnboarding } from '@ValenceClient/household/fetchHousehold';

const HOUSEHOLD = ['household'] as const;

/**
 * The household, and whether anybody has finished setting it up.
 *
 * Asked for rather than read off the session, because the session comes from better-auth and what
 * the household looks like is Valence's own. Kept under its own key so that finishing setup
 * invalidates this and nothing else.
 *
 * @returns The query.
 */
const onboarding = () =>
  queryOptions({
    queryKey: [...HOUSEHOLD, 'onboarding'],
    queryFn: () => fetchOnboarding(),
  });

const householdQueries = { key: HOUSEHOLD, onboarding };

export { householdQueries };
