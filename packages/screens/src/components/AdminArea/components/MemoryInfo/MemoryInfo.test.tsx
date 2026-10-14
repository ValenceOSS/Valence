import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Hardware } from '@ValenceContracts/schemas/Hardware';
import { MemoryInfo } from './MemoryInfo';

const machine = (change: Partial<Hardware> = {}): Hardware => ({
  surroundings: 'host',
  processor: null,
  memory: {
    totalBytes: 34_359_738_368,
    modules: [
      {
        sizeBytes: 17_179_869_184,
        kind: 'DDR5',
        speedMts: 5600,
        manufacturer: 'Kingston',
        slot: 'DIMM A1',
      },
    ],
  },
  drives: [],
  ...change,
});

describe('MemoryInfo', () => {
  it('says how much memory there is', () => {
    render(<MemoryInfo hardware={machine()} />);

    expect(screen.getByText('Capacity')).toBeInTheDocument();
  });

  it('describes each stick in its slot', () => {
    render(<MemoryInfo hardware={machine()} />);

    expect(screen.getByText('DIMM A1')).toBeInTheDocument();
    expect(screen.getByText('DDR5')).toBeInTheDocument();
    expect(screen.getByText('5,600 MT/s')).toBeInTheDocument();
    expect(screen.getByText('Kingston')).toBeInTheDocument();
  });

  it('explains why a container shows no sticks', () => {
    render(
      <MemoryInfo
        hardware={machine({
          surroundings: 'container',
          memory: { totalBytes: 1024, modules: [] },
        })}
      />,
    );

    expect(screen.getByText(/runs privileged/u)).toBeInTheDocument();
  });

  it('warns that a virtual machine shows what it was given', () => {
    render(<MemoryInfo hardware={machine({ surroundings: 'virtualMachine' })} />);

    expect(screen.getByText(/inside a virtual machine/u)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MemoryInfo.displayName).toBe('MemoryInfo');
  });
});
