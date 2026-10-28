import { describe, expect, it } from 'vitest';
import { guideCellsOf } from './guideCellsOf';
import type { LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

const CHANNEL = '00000000-0000-4000-8000-000000000001';

const at = (time: string) => Date.parse(`2026-10-28T${time}:00.000Z`);

const aProgramme = (title: string, startsAt: string, endsAt: string): LiveProgramme => ({
  channelId: CHANNEL,
  startsAt: `2026-10-28T${startsAt}:00.000Z`,
  endsAt: `2026-10-28T${endsAt}:00.000Z`,
  title,
  subtitle: null,
  description: null,
  category: null,
});

const shape = (cells: ReturnType<typeof guideCellsOf>) =>
  cells.map((cell) => [
    new Date(cell.startsAt).toISOString().slice(11, 16),
    new Date(cell.endsAt).toISOString().slice(11, 16),
    cell.programme?.title ?? null,
  ]);

describe('guideCellsOf', () => {
  it('cuts the programmes to the edges of the stretch', () => {
    const cells = guideCellsOf(
      [aProgramme('News', '17:30', '18:30'), aProgramme('Film', '18:30', '21:00')],
      at('18:00'),
      at('20:00'),
    );

    expect(shape(cells)).toStrictEqual([
      ['18:00', '18:30', 'News'],
      ['18:30', '20:00', 'Film'],
    ]);
  });

  it('fills the times the guide says nothing about, so the row has no holes', () => {
    const cells = guideCellsOf([aProgramme('News', '18:30', '19:00')], at('18:00'), at('20:00'));

    expect(shape(cells)).toStrictEqual([
      ['18:00', '18:30', null],
      ['18:30', '19:00', 'News'],
      ['19:00', '20:00', null],
    ]);
  });

  it('covers a channel with no guide at all with one empty cell', () => {
    expect(shape(guideCellsOf([], at('18:00'), at('20:00')))).toStrictEqual([
      ['18:00', '20:00', null],
    ]);
  });

  it('puts programmes in time order and starts an overlapping one where the last ended', () => {
    const cells = guideCellsOf(
      [aProgramme('Later', '18:45', '19:30'), aProgramme('Sooner', '18:00', '19:00')],
      at('18:00'),
      at('19:30'),
    );

    expect(shape(cells)).toStrictEqual([
      ['18:00', '19:00', 'Sooner'],
      ['19:00', '19:30', 'Later'],
    ]);
  });

  it('leaves out a programme the one before covers entirely', () => {
    const cells = guideCellsOf(
      [aProgramme('Long', '18:00', '20:00'), aProgramme('Inside', '18:30', '19:00')],
      at('18:00'),
      at('20:00'),
    );

    expect(shape(cells)).toStrictEqual([['18:00', '20:00', 'Long']]);
  });

  it('gives the first minute of a programme cut off at the edge to the one before', () => {
    const cells = guideCellsOf(
      [aProgramme('First', '18:00', '18:59'), aProgramme('Cut off', '18:59', '20:00')],
      at('18:00'),
      at('19:00'),
      2 * 60 * 1000,
    );

    expect(shape(cells)).toStrictEqual([['18:00', '19:00', 'First']]);
  });

  it('gives a gap shorter than the shortest kept to the programmes beside it', () => {
    const cells = guideCellsOf(
      [aProgramme('First', '18:00', '18:29'), aProgramme('Second', '18:30', '18:59')],
      at('18:00'),
      at('19:00'),
      2 * 60 * 1000,
    );

    expect(shape(cells)).toStrictEqual([
      ['18:00', '18:30', 'First'],
      ['18:30', '19:00', 'Second'],
    ]);
  });

  it('gives a short gap at the start of the stretch to the first programme', () => {
    const cells = guideCellsOf(
      [aProgramme('Late', '18:01', '19:00')],
      at('18:00'),
      at('19:00'),
      2 * 60 * 1000,
    );

    expect(shape(cells)).toStrictEqual([['18:00', '19:00', 'Late']]);
  });

  it('keeps a gap at least as long as the shortest kept', () => {
    const cells = guideCellsOf(
      [aProgramme('First', '18:00', '18:20'), aProgramme('Second', '18:30', '19:00')],
      at('18:00'),
      at('19:00'),
      2 * 60 * 1000,
    );

    expect(shape(cells)).toStrictEqual([
      ['18:00', '18:20', 'First'],
      ['18:20', '18:30', null],
      ['18:30', '19:00', 'Second'],
    ]);
  });
});
