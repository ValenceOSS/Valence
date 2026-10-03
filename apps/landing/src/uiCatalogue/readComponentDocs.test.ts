import { describe, expect, it } from 'vitest';
import { readComponentDocs } from './readComponentDocs';

const COMPONENT = `
import type { ChipProps } from './Chip.types';

/**
 * A small label for a thing, drawn in one of a few tones.
 *
 * Longer notes that are not the summary.
 *
 * @param children - What the chip says.
 * @param tone - How loud it is.
 * @param isRound - Whether it is fully rounded.
 */
const Chip = ({ children, tone = 'quiet', isRound = false }: ChipProps) => null;

export { Chip };
`;

const TYPES = `
import type { ReactNode, HTMLAttributes } from 'react';

type ChipTone = 'quiet' | 'loud';

type ChipLook = { tone?: ChipTone };

type ChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> &
  ChipLook & {
    children: ReactNode;
    isRound?: boolean;
    size?: 'sm' | 'md';
  };

export type { ChipProps };
`;

describe('readComponentDocs', () => {
  const docs = readComponentDocs('Chip', COMPONENT, TYPES);

  it('reads the summary from the first paragraph of the TSDoc', () => {
    expect(docs.summary).toBe('A small label for a thing, drawn in one of a few tones.');
  });

  it('lists every prop, through intersections and local aliases', () => {
    expect(docs.props.map((prop) => prop.name)).toEqual(['tone', 'children', 'isRound', 'size']);
  });

  it('names what the props inherit from elsewhere', () => {
    expect(docs.inherits).toEqual(["Omit<HTMLAttributes<HTMLSpanElement>, 'children'>"]);
  });

  it('reads types, values, defaults, whether required and descriptions', () => {
    expect(docs.props.find((prop) => prop.name === 'tone')).toEqual({
      name: 'tone',
      type: 'ChipTone',
      values: ['quiet', 'loud'],
      isRequired: false,
      defaultValue: "'quiet'",
      description: 'How loud it is.',
    });
    expect(docs.props.find((prop) => prop.name === 'children')).toMatchObject({
      isRequired: true,
      defaultValue: null,
      description: 'What the chip says.',
    });
    expect(docs.props.find((prop) => prop.name === 'size')).toMatchObject({
      values: ['sm', 'md'],
      description: null,
    });
  });

  it('merges the members of a union of object types, marking the ones not in all optional', () => {
    const union = readComponentDocs(
      'Pick',
      'const Pick = (props: PickProps) => null;',
      'type PickProps = { label: string; a: number } | { label: string; b: string };',
    );

    expect(union.props.map((prop) => [prop.name, prop.isRequired])).toEqual([
      ['label', true],
      ['a', false],
      ['b', false],
    ]);
  });

  it('reads props declared beside the component when there is no types file', () => {
    const beside = readComponentDocs(
      'Dot',
      'type DotProps = { size?: number };\n/** A dot. */\nfunction Dot({ size = 4 }: DotProps) { return null; }',
      null,
    );

    expect(beside.summary).toBe('A dot.');
    expect(beside.props).toEqual([
      {
        name: 'size',
        type: 'number',
        values: [],
        isRequired: false,
        defaultValue: '4',
        description: null,
      },
    ]);
  });

  it('settles for nothing where the component or its props cannot be found', () => {
    expect(readComponentDocs('Ghost', 'const Other = 1;', null)).toEqual({
      name: 'Ghost',
      summary: '',
      props: [],
      inherits: [],
      builtOn: [],
    });
  });
});
