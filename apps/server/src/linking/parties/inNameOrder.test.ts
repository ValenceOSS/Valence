import { describe, expect, it } from 'vitest';
import { inNameOrder } from './inNameOrder';

const from = (server: string, ownName: string) => ({
  name: `${ownName} from ${server}`,
  ownName,
  server: { name: server },
});

describe('inNameOrder', () => {
  it('puts each server’s people in name order, whatever order they were seen in', () => {
    expect(
      inNameOrder([
        from('Films', 'nexhunter'),
        from('Films', 'Barcota'),
        from('Films', 'Danny'),
        from('Films', 'Beckstera'),
      ]).map((person) => person.ownName),
    ).toEqual(['Barcota', 'Beckstera', 'Danny', 'nexhunter']);
  });

  it('keeps each server’s people together, servers in name order', () => {
    expect(
      inNameOrder([from('Zeta', 'Ann'), from('Alpha', 'Zoe'), from('Zeta', 'Bob')]).map(
        (person) => person.name,
      ),
    ).toEqual(['Zoe from Alpha', 'Ann from Zeta', 'Bob from Zeta']);
  });

  it('orders by the whole name where a person has no own name', () => {
    expect(inNameOrder([{ name: 'b' }, { name: 'A' }]).map((person) => person.name)).toEqual([
      'A',
      'b',
    ]);
  });
});
