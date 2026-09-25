import type { ReleaseType } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const RELEASE_TYPE_NAMES: Readonly<Record<ReleaseType, { label: string; one: string }>> = {
  album: {
    get label() {
      return say('client.releaseTypeNames.album.several');
    },
    get one() {
      return say('client.releaseTypeNames.album.single');
    },
  },
  ep: {
    get label() {
      return say('client.releaseTypeNames.ep.several');
    },
    get one() {
      return say('client.releaseTypeNames.ep.single');
    },
  },
  single: {
    get label() {
      return say('client.releaseTypeNames.single.several');
    },
    get one() {
      return say('client.releaseTypeNames.single.single');
    },
  },
  live: {
    get label() {
      return say('client.releaseTypeNames.live.several');
    },
    get one() {
      return say('client.releaseTypeNames.live.single');
    },
  },
  compilation: {
    get label() {
      return say('client.releaseTypeNames.compilation.several');
    },
    get one() {
      return say('client.releaseTypeNames.compilation.single');
    },
  },
};

export { RELEASE_TYPE_NAMES };
