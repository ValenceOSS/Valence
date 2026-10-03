import { randomUUID } from 'node:crypto';
import { AUDIT_FOLDS_WITHIN_MS } from './AUDIT_FOLDS_WITHIN_MS';
import { sameAuditEvent } from './sameAuditEvent';
import { NOTHING_SHARED } from '@ValenceContracts/constants/NOTHING_SHARED';
import type {
  FederationActivity,
  LinkSharing,
  RemotePerson,
} from '@ValenceContracts/schemas/LinkSharing';
import type { LinkSharingStore } from './LinkSharingStore';

type HeldPerson = RemotePerson & { linkedServerId: string; pseudonym: string };

type HeldEntry = FederationActivity & { linkedServerId: string; key: string };

/**
 * What each linked server is shared, the people from there this server has seen, and the record
 * of what they asked for, held in memory, for tests and for a server started without a database.
 *
 * @param isLinked - Whether a linked server is known, since sharing belongs to one.
 * @returns The store.
 */
const createMemoryLinkSharingStore = (
  isLinked: (linkedServerId: string) => Promise<boolean>,
): LinkSharingStore => {
  const sharing = new Map<string, LinkSharing>();
  const people = new Map<string, HeldPerson>();
  const entries: HeldEntry[] = [];

  const shownOf = (person: HeldPerson): RemotePerson => ({
    id: person.id,
    name: person.name,
    firstSeenAt: person.firstSeenAt,
    lastSeenAt: person.lastSeenAt,
    blockedAt: person.blockedAt,
  });

  return {
    readSharing: async (linkedServerId) =>
      (await isLinked(linkedServerId)) ? (sharing.get(linkedServerId) ?? NOTHING_SHARED) : null,

    changeSharing: async (linkedServerId, change) => {
      if (!(await isLinked(linkedServerId))) {
        return null;
      }

      const held = sharing.get(linkedServerId) ?? NOTHING_SHARED;
      const changed: LinkSharing = {
        libraryIds: change.libraryIds ?? held.libraryIds,
        maximumAge: change.maximumAge === undefined ? held.maximumAge : change.maximumAge,
        allowsUnrated: change.allowsUnrated ?? held.allowsUnrated,
        namesTravel: change.namesTravel ?? held.namesTravel,
        showsActivity: change.showsActivity ?? held.showsActivity,
        mostStreams: change.mostStreams === undefined ? held.mostStreams : change.mostStreams,
        qualityCeiling:
          change.qualityCeiling === undefined ? held.qualityCeiling : change.qualityCeiling,
        takesTheirControls: change.takesTheirControls ?? held.takesTheirControls,
        allowsDownloads: change.allowsDownloads ?? held.allowsDownloads,
        takesTheirRequests: change.takesTheirRequests ?? held.takesTheirRequests,
        playsDirect: change.playsDirect ?? held.playsDirect,
      };

      sharing.set(linkedServerId, changed);

      return changed;
    },

    seePerson: (linkedServerId, pseudonym, name, now) => {
      const found = [...people.values()].find(
        (person) => person.linkedServerId === linkedServerId && person.pseudonym === pseudonym,
      );
      const seen: HeldPerson =
        found === undefined
          ? {
              id: randomUUID(),
              linkedServerId,
              pseudonym,
              name,
              firstSeenAt: now.toISOString(),
              lastSeenAt: now.toISOString(),
              blockedAt: null,
            }
          : { ...found, name: name ?? found.name, lastSeenAt: now.toISOString() };

      people.set(seen.id, seen);

      return Promise.resolve(shownOf(seen));
    },

    listPeople: (linkedServerId) =>
      Promise.resolve(
        [...people.values()]
          .filter((person) => person.linkedServerId === linkedServerId)
          .sort((one, other) => other.lastSeenAt.localeCompare(one.lastSeenAt))
          .map(shownOf),
      ),

    pseudonymOf: (linkedServerId, personId) => {
      const found = people.get(personId);

      return Promise.resolve(found?.linkedServerId === linkedServerId ? found.pseudonym : null);
    },

    blockPerson: (linkedServerId, personId, blockedAt) => {
      const found = people.get(personId);

      if (found?.linkedServerId !== linkedServerId) {
        return Promise.resolve(null);
      }

      const changed = { ...found, blockedAt: blockedAt?.toISOString() ?? null };

      people.set(personId, changed);

      return Promise.resolve(shownOf(changed));
    },

    record: (entry, now) => {
      const key = sameAuditEvent(entry);
      const last = entries.findLast((held) => held.key === key);

      if (
        last !== undefined &&
        now.getTime() - new Date(last.at).getTime() < AUDIT_FOLDS_WITHIN_MS
      ) {
        last.count += 1;
        last.at = now.toISOString();

        return Promise.resolve();
      }

      entries.push({
        id: randomUUID(),
        key,
        linkedServerId: entry.linkedServerId,
        at: now.toISOString(),
        personId: entry.remotePersonId,
        personName: null,
        action: entry.action,
        mediaTitle: entry.mediaTitle,
        outcome: entry.outcome,
        count: 1,
      });

      return Promise.resolve();
    },

    listActivity: (linkedServerId, { since, personIds, limit }) =>
      Promise.resolve(
        entries
          .filter(
            (held) =>
              held.linkedServerId === linkedServerId &&
              (since === undefined || new Date(held.at) > since) &&
              (personIds === undefined ||
                (held.personId !== null && personIds.includes(held.personId))),
          )
          .sort((one, other) => other.at.localeCompare(one.at))
          .slice(0, limit)
          .map((held) => ({
            id: held.id,
            at: held.at,
            personId: held.personId,
            personName: held.personId === null ? null : (people.get(held.personId)?.name ?? null),
            action: held.action,
            mediaTitle: held.mediaTitle,
            outcome: held.outcome,
            count: held.count,
          })),
      ),
  };
};

export { createMemoryLinkSharingStore };
