import type { Askable } from './whoCanBeAsked';

type AskableGroup<Person extends Askable> = {
  server: { id: string; name: string } | null;
  people: Person[];
};

/**
 * The people who could be asked along, split where a list of them is headed: this server's own
 * first, then each linked server's, in the order they came.
 *
 * @param people - The people, this server's first.
 * @returns Them, a group to a server, with no server for this one's own.
 */
const askableGroups = <Person extends Askable>(people: readonly Person[]): AskableGroup<Person>[] =>
  people.reduce<AskableGroup<Person>[]>((groups, person) => {
    const server = person.server ?? null;
    const last = groups.at(-1);

    if (last !== undefined && last.server?.id === server?.id) {
      last.people.push(person);

      return groups;
    }

    return [...groups, { server, people: [person] }];
  }, []);

export type { AskableGroup };

export { askableGroups };
