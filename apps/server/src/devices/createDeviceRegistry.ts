import type {
  PresenceControlEvent,
  PresenceEntry,
  PresenceService,
} from '@ValenceServer/presence/PresenceService';

type DeviceOwner = {
  accountId: string;
  profileId: string | null;
};

type DeviceRegistryOptions = {
  presence: Pick<PresenceService, 'list' | 'tell' | 'watch'>;
  onChanged?: (accountId: string) => void;
};

type DeviceRegistry<Report> = {
  owned: (owner: DeviceOwner) => PresenceEntry[];
  report: (owner: DeviceOwner, clientId: string, report: Report | null) => boolean;
  reportOf: (clientId: string) => Report | null;
  tell: (
    owner: DeviceOwner,
    fromClientId: string,
    toClientId: string,
    event: (fromLabel: string) => PresenceControlEvent,
  ) => boolean;
};

/**
 * Every open copy of Valence one person has, and what each last said it was doing — the list that
 * "play on another device" is chosen from, for music and for films alike.
 *
 * A device is a connection presence already knows about, so a closed tab or a window that lost its
 * network leaves the list on its own, taking what it last said with it. What a device says is held
 * here in memory; nothing about it needs to outlive the server. Commands go to one connection
 * through presence, and only between devices of the same person — the same account, and the same
 * profile wherever a device has said which it is — so nobody can pause somebody else's film by
 * guessing an identifier. A window that has not yet said which profile it is counts as the
 * account's, since a freshly opened tab is still somebody's.
 *
 * @param options - Presence, and who to tell when a person's devices change.
 * @returns The registry.
 */
const createDeviceRegistry = <Report>({
  presence,
  onChanged,
}: DeviceRegistryOptions): DeviceRegistry<Report> => {
  const reports = new Map<string, Report>();
  let known = new Map<string, string | null>();

  const owned = ({ accountId, profileId }: DeviceOwner): PresenceEntry[] =>
    presence
      .list()
      .filter(
        (entry) =>
          entry.accountId === accountId &&
          (profileId === null || entry.profileId === null || entry.profileId === profileId),
      );

  presence.watch(() => {
    const now = new Map(presence.list().map((entry) => [entry.clientId, entry.accountId]));
    const touched = new Set<string>();

    for (const [clientId, accountId] of known) {
      if (!now.has(clientId)) {
        reports.delete(clientId);

        if (accountId !== null) {
          touched.add(accountId);
        }
      }
    }

    for (const [clientId, accountId] of now) {
      if (!known.has(clientId) && accountId !== null) {
        touched.add(accountId);
      }
    }

    known = now;

    for (const accountId of touched) {
      onChanged?.(accountId);
    }
  });

  return {
    owned,

    report: (owner, clientId, report) => {
      if (!owned(owner).some((entry) => entry.clientId === clientId)) {
        return false;
      }

      if (report === null) {
        reports.delete(clientId);
      } else {
        reports.set(clientId, report);
      }

      onChanged?.(owner.accountId);

      return true;
    },

    reportOf: (clientId) => reports.get(clientId) ?? null,

    tell: (owner, fromClientId, toClientId, event) => {
      const devices = owned(owner);

      if (!devices.some((entry) => entry.clientId === toClientId)) {
        return false;
      }

      const from = devices.find((entry) => entry.clientId === fromClientId);

      return presence.tell(toClientId, event(from?.deviceLabel ?? 'Another device'));
    },
  };
};

export type { DeviceOwner, DeviceRegistry };

export { createDeviceRegistry };
