import { describe, expect, it } from 'vitest';
import { askableGroups } from './askableGroups';

const films = { id: 'films', name: 'Films' };

const shows = { id: 'shows', name: 'Shows' };

describe('askableGroups', () => {
  it('puts this server’s own first, then a group for each linked server', () => {
    const groups = askableGroups([
      { id: 'dan', name: 'Dan' },
      { id: 'jess', name: 'Jess' },
      { id: 'peer~films~kai', name: 'Kai from Films', ownName: 'Kai', server: films },
      { id: 'peer~films~lu', name: 'Lu from Films', ownName: 'Lu', server: films },
      { id: 'peer~shows~mo', name: 'Mo from Shows', ownName: 'Mo', server: shows },
    ]);

    expect(groups.map((group) => group.server?.name ?? null)).toEqual([null, 'Films', 'Shows']);
    expect(groups.map((group) => group.people.map((person) => person.id))).toEqual([
      ['dan', 'jess'],
      ['peer~films~kai', 'peer~films~lu'],
      ['peer~shows~mo'],
    ]);
  });

  it('starts with a linked server where nobody here is left to ask', () => {
    expect(
      askableGroups([{ id: 'peer~films~kai', name: 'Kai from Films', server: films }]),
    ).toEqual([
      { server: films, people: [{ id: 'peer~films~kai', name: 'Kai from Films', server: films }] },
    ]);
  });

  it('gives nothing for nobody', () => {
    expect(askableGroups([])).toEqual([]);
  });
});
