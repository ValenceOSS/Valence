import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';

type ToneMapper = {
  label: string;
  detail: string | null;
};

const SOFTWARE = {
  libplacebo: 'libplacebo',
  zscale: 'zscale',
  unavailable: '',
} as const;

/**
 * Says how this machine turns an HDR film into something an SDR screen can show, which is two
 * questions rather than one: what the graphics card proved it can convert on its own, and what is
 * left to do the rest in software.
 *
 * Worth showing because the answer differs between the machines Valence is developed on and the
 * ones it runs on — the shipped Linux build has libplacebo and the macOS one does not — so a
 * conversion that looks right in development can be done by a different filter in production.
 *
 * @param toneMapping - The software tone mapper this build has, if it has one.
 * @param hardwareToneMaps - The filters the graphics card proved it can tone map with.
 * @returns What to show against the row, and what is worth warning about underneath it — nothing,
 *   where the card is doing the work and there is a software mapper behind it.
 */
const describeToneMapping = (
  toneMapping: AdminOverview['transcoder']['toneMapping'],
  hardwareToneMaps: string[],
): ToneMapper => {
  const software = SOFTWARE[toneMapping];

  if (hardwareToneMaps.length > 0) {
    return {
      label: say('screens.adminArea.describeToneMapping.valueOnTheDevice', {
        value: hardwareToneMaps.join(', '),
      }),
      detail:
        software === ''
          ? say('screens.adminArea.describeToneMapping.anythingTheCardCannotTakeIs')
          : null,
    };
  }

  if (software === '') {
    return {
      label: say('common.none'),
      detail: say('screens.adminArea.describeToneMapping.thisBuildHasNeitherLibplaceboNor'),
    };
  }

  return {
    label: say('screens.adminArea.describeToneMapping.softwareInSoftware', { software }),
    detail: say('screens.adminArea.describeToneMapping.theCardProvedNoToneMapper', { software }),
  };
};

export { describeToneMapping };
