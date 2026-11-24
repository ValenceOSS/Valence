import { columnsOf } from '@ValenceTv/screens/Player/components/StreamStats/columnsOf';
import type { StreamStatsGroup } from '@ValenceClient/playback/describeStreamStats';

const aGroup = (name: string, rows: number, value = 'short'): StreamStatsGroup => ({
  name,
  rows: Array.from({ length: rows }, (_, at): [string, string] => [
    `${name} ${at.toString()}`,
    value,
  ]),
});

const namesIn = (columns: StreamStatsGroup[][]) =>
  columns.map((column) => column.map((group) => group.name));

describe('columnsOf', () => {
  it('keeps the groups in the order they are read', () => {
    const groups = [aGroup('a', 2), aGroup('b', 2), aGroup('c', 2)];

    expect(namesIn(columnsOf(groups, 3))).toEqual([['a'], ['b'], ['c']]);
  });

  it('shares them out so the tallest column is as short as it can be', () => {
    const groups = [
      aGroup('session', 8),
      aGroup('source', 3),
      aGroup('output', 5),
      aGroup('plan', 4),
      aGroup('playback', 2),
    ];

    expect(namesIn(columnsOf(groups, 3))).toEqual([
      ['session'],
      ['source', 'output'],
      ['plan', 'playback'],
    ]);
  });

  it('counts a long fact as the two lines it wraps onto', () => {
    const groups = [aGroup('a', 3, 'x'.repeat(60)), aGroup('b', 3), aGroup('c', 3)];

    expect(namesIn(columnsOf(groups, 2))).toEqual([['a'], ['b', 'c']]);
  });

  it('puts everything in one column when asked for one', () => {
    expect(namesIn(columnsOf([aGroup('a', 1), aGroup('b', 1)], 1))).toEqual([['a', 'b']]);
  });
});
