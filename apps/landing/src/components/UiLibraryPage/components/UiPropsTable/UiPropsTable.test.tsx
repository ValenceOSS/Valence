import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiPropsTable } from './UiPropsTable';

const DOC = {
  name: 'Chip',
  summary: 'A chip.',
  inherits: ['HTMLAttributes<HTMLSpanElement>'],
  builtOn: [],
  props: [
    {
      name: 'label',
      type: 'string',
      values: [],
      isRequired: true,
      defaultValue: null,
      description: 'What it says.',
    },
    {
      name: 'tone',
      type: 'ChipTone',
      values: ['quiet', 'loud'],
      isRequired: false,
      defaultValue: "'quiet'",
      description: null,
    },
  ],
};

describe('UiPropsTable', () => {
  it('lists each prop with its type, default and description', () => {
    render(<UiPropsTable doc={DOC} />);

    expect(screen.getByRole('table', { name: 'Props of Chip' })).toBeInTheDocument();
    expect(screen.getByText('What it says.')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText("'quiet'")).toBeInTheDocument();
  });

  it('spells out the values a prop takes', () => {
    render(<UiPropsTable doc={DOC} />);

    expect(screen.getByText('quiet')).toBeInTheDocument();
    expect(screen.getByText('loud')).toBeInTheDocument();
  });

  it('names what the props inherit', () => {
    render(<UiPropsTable doc={DOC} />);

    expect(screen.getByText('HTMLAttributes<HTMLSpanElement>')).toBeInTheDocument();
  });

  it('says so when a component takes no props of its own', () => {
    render(<UiPropsTable doc={{ ...DOC, props: [], inherits: [] }} />);

    expect(screen.getByText('Chip takes no props of its own.')).toBeInTheDocument();
  });

  it('is named for people who cannot see it', () => {
    expect(UiPropsTable.displayName).toBe('UiPropsTable');
  });
});
