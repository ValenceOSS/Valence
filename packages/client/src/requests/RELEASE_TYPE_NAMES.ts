import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const RELEASE_TYPE_NAMES: Readonly<Record<ReleaseType, { label: string; one: string }>> = {
  album: { label: say('common.albums'), one: say('common.album') },
  ep: { label: say('client.requests.releaseTypeNames.ePs'), one: 'EP' },
  single: {
    label: say('client.requests.releaseTypeNames.singles'),
    one: say('client.requests.releaseTypeNames.single'),
  },
  live: { label: say('common.live'), one: say('common.live') },
  compilation: {
    label: say('client.requests.releaseTypeNames.compilations'),
    one: say('common.compilation'),
  },
};

export { RELEASE_TYPE_NAMES };
