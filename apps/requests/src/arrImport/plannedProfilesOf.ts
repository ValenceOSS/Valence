import type { ArrImportProfile } from '@ValenceContracts/schemas/ArrImport';
import type { QualityProfile, QualityProfileDraft } from '@ValenceContracts/schemas/QualityProfile';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { profileOf } from '@ValenceRequests/arrImport/profileOf';
import { profileSourceOf } from '@ValenceRequests/arrImport/profileSourceOf';

type PlannedProfile = {
  report: ArrImportProfile;
  draft: QualityProfileDraft;
  existing: QualityProfile | null;
  sources: string[];
};

/**
 * The profiles of an app that anything in it uses — its films, series, artists or root folders —
 * or every one of them where it holds nothing yet.
 *
 * @param setup - The app.
 * @returns Their ids.
 */
const usedProfilesOf = (setup: ArrSetup): Set<number> => {
  const used = new Set(
    [
      ...setup.movies.map((one) => one.qualityProfileId),
      ...setup.series.map((one) => one.qualityProfileId),
      ...setup.artists.map((one) => one.qualityProfileId),
      ...setup.rootFolders.map((one) => one.defaultQualityProfileId),
    ].filter((id): id is number => typeof id === 'number'),
  );

  return used.size > 0 ? used : new Set(setup.profiles.map((one) => one.id));
};

/**
 * The quality profiles Valence would bring in: one for each profile an app uses, named as the app
 * names it, made once where two apps have the same profile under the same name and told apart by
 * the app's name where the two differ, and kept as it is where Valence already has a profile of that
 * name — an admin's own changes are never overwritten by running the import again.
 *
 * @param arrs - Each app's setup.
 * @param existing - Valence's profiles.
 * @returns Each profile, and what bringing it in would do.
 */
const plannedProfilesOf = (
  arrs: readonly ArrSetup[],
  existing: readonly QualityProfile[],
): PlannedProfile[] => {
  const planned: PlannedProfile[] = [];

  for (const setup of arrs) {
    const used = usedProfilesOf(setup);

    for (const profile of setup.profiles.filter((one) => used.has(one.id))) {
      const kind = setup.kind === 'lidarr' ? 'music' : 'video';
      const { draft, notes } = profileOf(profile, kind, setup);
      const sameName = planned.find(
        (one) =>
          one.draft.kind === kind && one.draft.name.toLowerCase() === draft.name.toLowerCase(),
      );
      const isSame =
        sameName !== undefined &&
        JSON.stringify({ ...sameName.draft, name: '' }) === JSON.stringify({ ...draft, name: '' });

      if (sameName !== undefined && isSame) {
        sameName.sources.push(profileSourceOf(setup, profile.id));
        continue;
      }

      const name =
        sameName === undefined ? draft.name : `${draft.name} (${setup.source.name})`.slice(0, 80);
      const kept =
        existing.find(
          (one) => one.kind === kind && one.name.toLowerCase() === name.toLowerCase(),
        ) ?? null;

      planned.push({
        report: {
          key: `${kind}:${name.toLowerCase()}`,
          name,
          kind,
          from: setup.source.name,
          standing: kept === null ? 'new' : 'kept',
          notes,
        },
        draft: { ...draft, name },
        existing: kept,
        sources: [profileSourceOf(setup, profile.id)],
      });
    }
  }

  return planned;
};

export type { PlannedProfile };

export { plannedProfilesOf };
